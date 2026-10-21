"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Card, Icon, InfoBox, SubmitButton, TextArea } from "@/components/ui";
import { fmt, t } from "@/lib/i18n";
import { IDLE_STATE, type QuoteAction } from "@/lib/quote/form";
import type { RedoState } from "@/lib/quote/quote";

const r = t.quote.booking.redo;

/**
 * Besiktningsgaranti on the booking page (move-out cleaning only): explains the guarantee and,
 * from the cleaning day up to the last day, lets the customer ask for a free re-clean.
 */
export function RedoPanel({
  state: redo,
  lastDay,
  requestedAt,
  action,
}: {
  state: Exclude<RedoState, "none">;
  /** Already formatted, e.g. "fredag 23 oktober 2026". */
  lastDay: string | null;
  requestedAt: string | null;
  action: QuoteAction;
}) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  return (
    <Card as="section" aria-labelledby="besiktningsgaranti" className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon name="shield" size={32} className="shrink-0 text-accent" />
        <h2 id="besiktningsgaranti" className="text-xl font-bold text-ink">
          {r.title}
        </h2>
      </div>

      {redo === "requested" ? (
        <p className="font-semibold text-ink">{fmt(r.requested, { date: requestedAt ?? "" })}</p>
      ) : redo === "closed" ? (
        <p className="text-ink">{fmt(r.closed, { date: lastDay ?? "" })}</p>
      ) : redo === "notYet" ? (
        <p className="text-ink">{r.notYet}</p>
      ) : (
        <form action={formAction} className="space-y-4">
          <p className="text-ink">{fmt(r.open, { date: lastDay ?? "" })}</p>
          {state.status === "error" ? (
            <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-card">
              <InfoBox tone="danger">
                <p>{state.message}</p>
              </InfoBox>
            </div>
          ) : null}
          <TextArea label={r.messageLabel} hint={r.messageHint} name="message" maxLength={2000} optional />
          <SubmitButton pendingText={r.submitting} icon="arrow-right">
            {r.submit}
          </SubmitButton>
        </form>
      )}

      <p>
        <Link href="/flyttstadning-checklista" className="link">
          {r.checklistLink}
        </Link>
      </p>
    </Card>
  );
}
