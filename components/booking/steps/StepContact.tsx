"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { Button, Checkbox, InfoBox, TextArea, TextField } from "@/components/ui";
import { submitRequest } from "@/lib/booking/actions";
import { reminderMonths } from "@/lib/booking/extras";
import {
  NOTE_MAX,
  validateContact,
  type ContactDraft,
  type ContactErrors,
  type ContactFormValues,
} from "@/lib/booking/schema";
import type { Step } from "@/lib/booking/state";
import { formatPostcode } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import { postcodeDigits } from "./StepWhere";
import { focusFirstError, type StepProps } from "../types";

const s = t.booking.steps.contact;
const terms = t.common.legal.terms;

/**
 * Step 8: contact details, the required terms checkbox and "Skicka förfrågan". Validated inline
 * with the same zod schema as the server action (`submitRequest`), which recomputes the price,
 * calls the `submit_request` RPC and redirects to `/boka/klart`.
 */
export function StepContact({ draft, derived, update, onEdit }: StepProps & { onEdit: (step: Step) => void }) {
  const [state, formAction, pending] = useActionState(submitRequest, null);
  const [accepted, setAccepted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const serverErrorRef = useRef<HTMLDivElement>(null);

  const contact = draft.contact;
  const values: ContactFormValues = {
    name: contact.name ?? "",
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    street: contact.street ?? "",
    postcode: draft.postcode ?? "",
    city: contact.city ?? "",
    note: contact.note ?? "",
    forRelative: draft.forRelative,
    residentName: contact.residentName ?? "",
    residentPhone: contact.residentPhone ?? "",
    remind: draft.remind,
    acceptTerms: accepted,
  };
  const months = draft.recurring === "season" ? null : reminderMonths(derived.service);
  const validation = validateContact(values);
  const liveErrors: ContactErrors = attempted && !validation.ok ? validation.errors : {};
  const errors: ContactErrors = { ...(state?.fieldErrors ?? {}), ...liveErrors };
  const serverMessage = state?.message ?? null;

  // Announce and focus a new error from the server.
  useEffect(() => {
    if (state?.message) serverErrorRef.current?.focus();
  }, [state]);

  function setField(field: keyof ContactDraft, value: string) {
    update((d) => ({ ...d, contact: { ...d.contact, [field]: value } }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!validation.ok) {
      flushSync(() => setAttempted(true));
      focusFirstError(formRef.current);
      return;
    }
    const formData = new FormData(event.currentTarget);
    // The answers from steps 1–7 (no personnummer – the draft has no such field).
    const { contact: _contact, ...answers } = draft;
    void _contact;
    formData.set("draft", JSON.stringify(answers));
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} noValidate aria-label={s.formLabel} onSubmit={onSubmit} className="space-y-6">
      {serverMessage ? (
        <div ref={serverErrorRef} tabIndex={-1} role="alert" className="rounded-card">
          <InfoBox tone="danger" title={t.booking.submitErrors.title}>
            <p>{serverMessage}</p>
            {state?.step ? (
              <Button variant="secondary" onClick={() => onEdit(state.step as Step)}>
                {fmt(t.booking.nav.goToStep, { step: state.step })}
              </Button>
            ) : null}
          </InfoBox>
        </div>
      ) : attempted && !validation.ok ? (
        <div role="alert">
          <InfoBox tone="danger" title={t.booking.errorSummaryTitle} />
        </div>
      ) : null}

      <TextField
        label={s.name}
        name="name"
        autoComplete="name"
        enterKeyHint="next"
        maxLength={200}
        value={values.name}
        onChange={(event) => setField("name", event.currentTarget.value)}
        error={errors.name}
      />
      <TextField
        label={s.phone}
        hint={s.phoneHint}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        enterKeyHint="next"
        maxLength={40}
        value={values.phone}
        onChange={(event) => setField("phone", event.currentTarget.value)}
        error={errors.phone}
      />
      <TextField
        label={s.email}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="next"
        maxLength={254}
        value={values.email}
        onChange={(event) => setField("email", event.currentTarget.value)}
        error={errors.email}
      />
      <TextField
        label={s.street}
        hint={s.streetHint}
        name="street"
        autoComplete="street-address"
        enterKeyHint="next"
        maxLength={200}
        value={values.street}
        onChange={(event) => setField("street", event.currentTarget.value)}
        error={errors.street}
      />
      <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
        <TextField
          label={s.postcode}
          name="postcode"
          inputMode="numeric"
          autoComplete="postal-code"
          enterKeyHint="next"
          maxLength={6}
          value={formatPostcode(values.postcode)}
          onChange={(event) => {
            const digits = postcodeDigits(event.currentTarget.value);
            update((d) => ({ ...d, postcode: digits }));
          }}
          error={errors.postcode}
          inputClassName="max-w-48"
        />
        <TextField
          label={s.city}
          name="city"
          autoComplete="address-level2"
          enterKeyHint="next"
          maxLength={100}
          value={values.city}
          onChange={(event) => setField("city", event.currentTarget.value)}
          error={errors.city}
        />
      </div>
      <TextArea
        label={s.note}
        hint={s.noteHint}
        name="note"
        optional
        maxLength={NOTE_MAX}
        value={values.note}
        onChange={(event) => setField("note", event.currentTarget.value)}
        error={errors.note}
      />

      <Checkbox
        name="forRelative"
        boxed
        checked={draft.forRelative}
        onChange={(event) => {
          const checked = event.currentTarget.checked;
          update((d) => ({ ...d, forRelative: checked }));
        }}
        label={s.forRelativeLabel}
        description={s.forRelativeDescription}
      />
      {draft.forRelative ? (
        <div className="space-y-6 border-l-4 border-brand-soft pl-4">
          <TextField
            label={s.residentName}
            name="residentName"
            autoComplete="off"
            maxLength={200}
            value={values.residentName}
            onChange={(event) => setField("residentName", event.currentTarget.value)}
            error={errors.residentName}
          />
          <TextField
            label={s.residentPhone}
            hint={s.residentPhoneHint}
            name="residentPhone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            maxLength={40}
            optional
            value={values.residentPhone}
            onChange={(event) => setField("residentPhone", event.currentTarget.value)}
            error={errors.residentPhone}
          />
          <InfoBox tone="info" title={s.relativeInfoTitle}>
            <ul className="list-disc space-y-2 pl-5">
              {s.relativeInfo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </InfoBox>
        </div>
      ) : null}

      {months ? (
        <Checkbox
          name="remind"
          boxed
          checked={draft.remind}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            update((d) => ({ ...d, remind: checked }));
          }}
          label={s.remindLabel}
          description={fmt(s.remindDescription, { when: months >= 12 ? s.remindWhen12 : s.remindWhen6 })}
        />
      ) : null}

      <Checkbox
        name="acceptTerms"
        boxed
        checked={accepted}
        onChange={(event) => {
          const checked = event.currentTarget.checked;
          setAccepted(checked);
        }}
        aria-required="true"
        error={errors.acceptTerms}
        label={
          <>
            {terms.checkboxBefore}
            <Link href="/villkor" className="link">
              {terms.termsLink}
            </Link>
            {terms.checkboxAnd}
            <Link href="/integritetspolicy" className="link">
              {terms.privacyLink}
            </Link>
            {terms.checkboxAfter}
          </>
        }
      />

      <InfoBox tone="info">
        <p>{t.common.legal.requestFree}</p>
      </InfoBox>

      <Button
        type="submit"
        size="lg"
        fullWidth
        iconEnd="arrow-right"
        loading={pending}
        loadingText={t.booking.nav.submitting}
      >
        {t.booking.nav.submit}
      </Button>
    </form>
  );
}
