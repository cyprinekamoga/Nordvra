"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Button, Checkbox, Icon, InfoBox, PriceLine, PriceList, SubmitButton, cx } from "@/components/ui";
import { fmt, t } from "@/lib/i18n";
import type { PriceLines } from "@/lib/pricing/calculate";
import {
  FIELD,
  IDLE_STATE,
  birthYearOf,
  buyerPreview,
  evenShareStrings,
  fieldId,
  isUnderMinimumAge,
  orderedErrors,
  sharesSum,
  validateApproval,
  type ApprovalInput,
  type BuyerInput,
  type FieldErrors,
  type QuoteAction,
} from "@/lib/quote/form";
import { deductionName } from "@/lib/quote/labels";
import { MAX_BUYERS, type PropertyKind } from "@/lib/quote/quote";
import type { DeductionType, TaxYearRules } from "@/lib/taxRules";
import { BuyerFieldset, type BuyerField } from "./BuyerFieldset";
import { DECLINE_PANEL_ID, DeclinePanel } from "./DeclinePanel";
import { PropertyFields, type PropertyField } from "./PropertyFields";

const f = t.quote.form;
const legal = t.common.legal;

export interface ApprovalFormProps {
  /** acceptQuote bound to the token. */
  acceptAction: QuoteAction;
  /** declineQuote bound to the token. */
  declineAction: QuoteAction;
  deductionType: DeductionType;
  /** From the stored eligibility; false = the price has no deduction. */
  eligible: boolean;
  propertyKind: PropertyKind | null;
  /** The job starts within the 14-day ångerfrist → the waiver checkbox is required. */
  waiverRequired: boolean;
  /** Buyers to start with (the request's "Hur många ska dela på avdraget?"). */
  defaultBuyerCount: number;
  /** Prefills buyer 1 with the contact name. */
  defaultName: string;
  lines: PriceLines;
  rules: TaxYearRules;
  labourShareOfTotal: number | null;
  taxYear: number;
  /** "YYYY-MM-DD" in Swedish time, from the server (keeps server and browser render equal). */
  today: string;
}

interface BuyerState extends BuyerInput {
  key: number;
}

type Consents = ApprovalInput["consents"];

function initialBuyers(count: number, name: string): BuyerState[] {
  return evenShareStrings(count).map((share, i) => ({ key: i, name: i === 0 ? name : "", pnr: "", share }));
}

function focusField(name: string) {
  const target =
    document.getElementById(fieldId(name)) ??
    (name === FIELD.shares ? document.getElementById(fieldId(FIELD.buyerShare(0))) : null);
  if (target instanceof HTMLElement) {
    target.focus();
    target.scrollIntoView({ block: "center" });
  }
}

/** Runs after React has committed the next render. */
function afterRender(fn: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

/**
 * The approval form: buyers (name, personnummer, share), live deduction per buyer, ROT
 * property details, the required consents and "Godkänn och boka" / "Nej tack".
 * Validates in the browser with the same rules as the server (lib/quote/form.ts) and shows
 * an error summary with links to the fields. Personnummer stay in React state only.
 */
export function ApprovalForm(props: ApprovalFormProps) {
  const { deductionType, eligible, propertyKind, waiverRequired, rules, taxYear } = props;
  const [state, formAction] = useActionState(props.acceptAction, IDLE_STATE);
  const [buyers, setBuyers] = useState<BuyerState[]>(() =>
    initialBuyers(props.defaultBuyerCount, props.defaultName),
  );
  const [property, setProperty] = useState<ApprovalInput["property"]>({
    fastighetsbeteckning: "",
    brfOrgNr: "",
    lagenhetsnummer: "",
  });
  const [consents, setConsents] = useState<Consents>({ deduction: false, withdrawalWaiver: false, terms: false });
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [attempted, setAttempted] = useState(false);
  const [editedSinceSubmit, setEditedSinceSubmit] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [declineOpen, setDeclineOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const declineButtonRef = useRef<HTMLButtonElement>(null);

  const todayDate = useMemo(() => new Date(`${props.today}T12:00:00Z`), [props.today]);
  const name = deductionName(deductionType);

  const input: ApprovalInput = { buyers, property, consents };
  const result = validateApproval(input, { propertyKind, waiverRequired, today: todayDate });
  const clientErrors: FieldErrors = result.ok ? {} : result.errors;
  const shareTouched = buyers.some((_, i) => touched.has(FIELD.buyerShare(i)));
  const visibleClientErrors: FieldErrors = attempted
    ? clientErrors
    : Object.fromEntries(
        Object.entries(clientErrors).filter(
          ([key]) => touched.has(key) || (key === FIELD.shares && shareTouched),
        ),
      );
  const serverError = state.status === "error" ? state : null;
  const serverFieldErrors = serverError && !editedSinceSubmit ? serverError.fieldErrors : {};
  const errors: FieldErrors = { ...serverFieldErrors, ...visibleClientErrors };
  const summaryErrors = orderedErrors(attempted || serverError ? errors : {}, buyers.length);
  const showSummary = (attempted && !result.ok) || serverError !== null;

  const birthYears = buyers.map((b) => birthYearOf(b.pnr, todayDate));
  const preview = eligible
    ? buyerPreview({
        deductionType,
        lines: props.lines,
        rules,
        eligible,
        labourShareOfTotal: props.labourShareOfTotal,
        taxYear,
        buyers: buyers.map((b, i) => ({ share: b.share, birthYear: birthYears[i] })),
      })
    : null;
  const sum = sharesSum(buyers);

  // Server answered with an error: move focus to the summary so it is read out.
  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
  }, [state]);

  function markEdited() {
    if (!editedSinceSubmit) setEditedSinceSubmit(true);
  }

  function touch(key: string) {
    if (touched.has(key)) return;
    setTouched((prev) => new Set(prev).add(key));
  }

  function updateBuyer(index: number, field: BuyerField, value: string) {
    setBuyers((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
    markEdited();
  }

  /** Touched flags are per position; forget the buyer ones when positions shift. */
  function resetBuyerTouched() {
    setTouched((prev) => new Set([...prev].filter((key) => !key.startsWith("buyers."))));
  }

  function addBuyer() {
    if (buyers.length >= MAX_BUYERS) return;
    const count = buyers.length + 1;
    const shares = evenShareStrings(count);
    const nextKey = Math.max(...buyers.map((b) => b.key)) + 1;
    setBuyers([
      ...buyers.map((b, i) => ({ ...b, share: shares[i] })),
      { key: nextKey, name: "", pnr: "", share: shares[count - 1] },
    ]);
    resetBuyerTouched();
    markEdited();
    setAnnouncement(fmt(f.buyerAdded, { n: count }));
    afterRender(() => focusField(FIELD.buyerName(count - 1)));
  }

  function removeBuyer(index: number) {
    if (buyers.length <= 1) return;
    const remaining = buyers.filter((_, i) => i !== index);
    const shares = evenShareStrings(remaining.length);
    setBuyers(remaining.map((b, i) => ({ ...b, share: shares[i] })));
    resetBuyerTouched();
    markEdited();
    setAnnouncement(f.buyerRemoved);
    afterRender(() => focusField(FIELD.buyerName(Math.max(0, index - 1))));
  }

  function splitEvenly() {
    const shares = evenShareStrings(buyers.length);
    setBuyers(buyers.map((b, i) => ({ ...b, share: shares[i] })));
    markEdited();
    setAnnouncement(f.sharesReset);
  }

  function updateProperty(field: PropertyField, value: string) {
    setProperty((prev) => ({ ...prev, [field]: value }));
    markEdited();
  }

  function updateConsent(field: keyof Consents, checked: boolean) {
    setConsents((prev) => ({ ...prev, [field]: checked }));
    markEdited();
  }

  /**
   * Submits through a transition instead of letting React run the form action itself, because
   * React resets a form after its action runs and the controlled checkboxes would then look
   * unticked. The form status (SubmitButton's pending state) still updates.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    setEditedSinceSubmit(false);
    if (!result.ok) {
      afterRender(() => summaryRef.current?.focus());
      return;
    }
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  function handleSummaryLink(event: MouseEvent<HTMLAnchorElement>, key: string) {
    event.preventDefault();
    focusField(key);
  }

  function openDecline() {
    setDeclineOpen(true);
  }

  function closeDecline() {
    setDeclineOpen(false);
    afterRender(() => declineButtonRef.current?.focus());
  }

  const propertyErrors = {
    fastighetsbeteckning: errors[FIELD.fastighetsbeteckning],
    brfOrgNr: errors[FIELD.brfOrgNr],
    lagenhetsnummer: errors[FIELD.lagenhetsnummer],
  };

  return (
    <section aria-labelledby="offert-godkann-rubrik" className="space-y-6">
      <div className="space-y-2">
        <h2 id="offert-godkann-rubrik" className="text-2xl font-bold text-ink">
          {f.title}
        </h2>
        <p className="text-ink">{f.intro}</p>
      </div>

      <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-8">
        {showSummary ? (
          <div ref={summaryRef} tabIndex={-1} className="rounded-card">
            <InfoBox tone="danger" title={serverError?.message ?? f.errorSummaryTitle} headingLevel={3}>
              {summaryErrors.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5">
                  {summaryErrors.map(([key, message]) => (
                    <li key={key}>
                      <a
                        href={`#${fieldId(key)}`}
                        className="link"
                        onClick={(event) => handleSummaryLink(event, key)}
                      >
                        {message}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </InfoBox>
          </div>
        ) : null}

        <input type="hidden" name={FIELD.buyerCount} value={buyers.length} />

        <section aria-labelledby="offert-kopare-rubrik" className="space-y-4">
          <div className="space-y-1">
            <h3 id="offert-kopare-rubrik" className="text-xl font-bold text-ink">
              {f.buyersTitle}
            </h3>
            <p className="text-muted">{eligible ? f.buyersHint : f.buyersHintNoDeduction}</p>
          </div>

          <InfoBox tone="legal" title={legal.personnummer.title} icon="lock">
            <p>{legal.personnummer.body}</p>
            <p>
              <a href="/integritetspolicy" target="_blank" rel="noopener" className="link font-semibold">
                {legal.personnummer.privacyLink}
                <span className="sr-only"> {t.common.external.newTab}</span>
              </a>
            </p>
          </InfoBox>

          <div className="space-y-4">
            {buyers.map((buyer, i) => {
              const year = birthYears[i];
              const under18 = eligible && year !== null && isUnderMinimumAge(year, taxYear, rules);
              return (
                <BuyerFieldset
                  key={buyer.key}
                  index={i}
                  buyer={buyer}
                  showShare={buyers.length > 1}
                  canRemove={buyers.length > 1}
                  errors={{
                    name: errors[FIELD.buyerName(i)],
                    pnr: errors[FIELD.buyerPnr(i)],
                    share: errors[FIELD.buyerShare(i)],
                  }}
                  under18Warning={under18 ? fmt(t.quote.warnings.under18, { deduction: name }) : null}
                  onChange={updateBuyer}
                  onBlur={(index, field) => touch(`buyers.${index}.${field}`)}
                  onRemove={removeBuyer}
                />
              );
            })}
          </div>

          {buyers.length > 1 ? (
            <div
              className={cx(
                "flex items-start gap-2 rounded-control border-2 p-3 font-semibold",
                sum === 100 ? "border-success bg-success-soft text-success" : "border-warning-border bg-warning-soft text-ink",
              )}
              role="status"
            >
              <Icon name={sum === 100 ? "check-circle" : "warning"} className="mt-0.5 shrink-0" />
              <span>
                {fmt(f.sharesTotal, { sum })}
                {sum === 100 ? "" : ` – ${f.sharesOff}`}
              </span>
            </div>
          ) : null}
          {errors[FIELD.shares] ? (
            <p id={fieldId(FIELD.shares)} className="flex items-start gap-2 font-semibold text-danger">
              <Icon name="alert" className="mt-1" />
              <span>
                <span className="sr-only">{t.common.form.errorPrefix} </span>
                {errors[FIELD.shares]}
              </span>
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {buyers.length < MAX_BUYERS ? (
              <Button variant="secondary" icon="plus" onClick={addBuyer} className="w-full sm:w-auto">
                {f.addBuyer}
              </Button>
            ) : (
              <p className="text-muted">{f.maxBuyers}</p>
            )}
            {buyers.length > 1 ? (
              <Button variant="ghost" onClick={splitEvenly} className="w-full sm:w-auto">
                {f.evenSplit}
              </Button>
            ) : null}
          </div>

          {preview ? (
            <div className="rounded-card border border-border bg-surface-muted p-4 sm:p-6">
              <h4 className="text-lg font-bold text-ink">{f.preview.title}</h4>
              {preview.valid ? (
                <PriceList live>
                  {preview.rows.map((row, i) => (
                    <PriceLine
                      key={buyers[i]?.key ?? i}
                      label={fmt(f.preview.buyerFallback, { n: i + 1 })}
                      hint={
                        row.under18
                          ? f.preview.under18
                          : row.cappedBy
                            ? `${fmt(f.preview.share, { share: row.sharePct })} · ${f.preview.capped}`
                            : fmt(f.preview.share, { share: row.sharePct })
                      }
                      ore={row.deduction}
                      negative={row.deduction > 0}
                      accent={deductionType}
                    />
                  ))}
                  <PriceLine label={f.preview.totalDeduction} ore={preview.deduction} negative={preview.deduction > 0} emphasis="strong" accent={deductionType} />
                  <PriceLine label={f.preview.toPay} ore={preview.toPay} emphasis="total" />
                </PriceList>
              ) : (
                <p className="mt-2 text-muted" role="status">
                  {f.preview.invalid}
                </p>
              )}
            </div>
          ) : null}
        </section>

        {propertyKind ? (
          <PropertyFields
            kind={propertyKind}
            value={property}
            errors={propertyErrors}
            onChange={updateProperty}
            onBlur={(field) =>
              touch(
                field === "fastighetsbeteckning"
                  ? FIELD.fastighetsbeteckning
                  : field === "brfOrgNr"
                    ? FIELD.brfOrgNr
                    : FIELD.lagenhetsnummer,
              )
            }
          />
        ) : null}

        <section aria-labelledby="offert-bekrafta-rubrik" className="space-y-4">
          <h3 id="offert-bekrafta-rubrik" className="text-xl font-bold text-ink">
            {f.consentsTitle}
          </h3>
          <InfoBox tone="legal" title={legal.notGuaranteed.title}>
            <p>{legal.notGuaranteed.body}</p>
          </InfoBox>
          <Checkbox
            id={fieldId(FIELD.consentDeduction)}
            name={FIELD.consentDeduction}
            label={legal.notGuaranteed.checkbox}
            checked={consents.deduction}
            onChange={(event) => updateConsent("deduction", event.currentTarget.checked)}
            error={errors[FIELD.consentDeduction]}
            boxed
            required
          />
          {waiverRequired ? (
            <Checkbox
              id={fieldId(FIELD.consentWaiver)}
              name={FIELD.consentWaiver}
              label={legal.withdrawal.waiverCheckbox}
              description={f.withdrawalWaiverHint}
              checked={consents.withdrawalWaiver}
              onChange={(event) => updateConsent("withdrawalWaiver", event.currentTarget.checked)}
              error={errors[FIELD.consentWaiver]}
              boxed
              required
            />
          ) : null}
          <Checkbox
            id={fieldId(FIELD.consentTerms)}
            name={FIELD.consentTerms}
            label={
              <>
                {legal.terms.checkboxBefore}
                <a href="/villkor" target="_blank" rel="noopener" className="link">
                  {legal.terms.termsLink}
                  <span className="sr-only"> {t.common.external.newTab}</span>
                </a>
                {legal.terms.checkboxAnd}
                <a href="/integritetspolicy" target="_blank" rel="noopener" className="link">
                  {legal.terms.privacyLink}
                  <span className="sr-only"> {t.common.external.newTab}</span>
                </a>
                {legal.terms.checkboxAfter}
              </>
            }
            checked={consents.terms}
            onChange={(event) => updateConsent("terms", event.currentTarget.checked)}
            error={errors[FIELD.consentTerms]}
            boxed
            required
          />
        </section>

        <div className="space-y-3">
          <p className="font-semibold text-ink">{f.binding}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SubmitButton size="lg" icon="check" pendingText={f.approving} className="w-full sm:w-auto">
              {f.approve}
            </SubmitButton>
            <Button
              ref={declineButtonRef}
              variant="secondary"
              size="lg"
              onClick={openDecline}
              aria-expanded={declineOpen}
              aria-controls={declineOpen ? DECLINE_PANEL_ID : undefined}
              className="w-full sm:w-auto"
            >
              {f.decline}
            </Button>
          </div>
        </div>
      </form>

      {declineOpen ? <DeclinePanel action={props.declineAction} onCancel={closeDecline} /> : null}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
