import type { ReactNode } from "react";
import { t } from "@/lib/i18n";
import { cx } from "@/components/ui";
import type { BookingStatus } from "@/lib/admin/filters";

const STATUS_TONE: Record<BookingStatus, string> = {
  ny_forfragan: "bg-info-soft text-info",
  soker_utforare: "bg-warning-soft text-warning",
  offert_skickad: "bg-legal-soft text-legal",
  godkand: "bg-success-soft text-success",
  utford: "bg-brand-soft text-brand",
  betald: "bg-brand-soft text-brand",
  rut_rot_begard: "bg-rut-soft text-rut",
  avslutad: "bg-surface-muted text-ink",
  nekad: "bg-danger-soft text-danger",
  avbokad: "bg-danger-soft text-danger",
  offert_utgangen: "bg-surface-muted text-muted",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cx("inline-block rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap", STATUS_TONE[status])}>
      {t.common.status[status]}
    </span>
  );
}

export function ModelBadge({ model, deduction }: { model: "seller" | "agent"; deduction: "rut" | "rot" }) {
  return (
    <span className="inline-flex flex-wrap gap-1 text-sm">
      <span
        className={cx(
          "rounded-full px-2 py-0.5 font-bold",
          deduction === "rut" ? "bg-rut-soft text-rut" : "bg-rot-soft text-rot-strong",
        )}
      >
        {deduction.toUpperCase()}
      </span>
      <span className="rounded-full bg-surface-muted px-2 py-0.5">{model === "seller" ? "Säljare" : "Förmedlare"}</span>
    </span>
  );
}

export function PageHeader({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {children}
      </div>
      {actions}
    </div>
  );
}

const FLASH: Record<string, { tone: "success" | "danger"; text: string }> = {
  sparad: { tone: "success", text: "Ändringarna är sparade." },
  skapad: { tone: "success", text: "Skapad." },
  borttagen: { tone: "success", text: "Borttagen." },
  skickad: { tone: "success", text: "Skickat." },
  testmejl: { tone: "success", text: "Testmejlet är skickat. Kolla din inkorg (och skräpposten)." },
  fel: { tone: "danger", text: "Något gick fel. Kontrollera uppgifterna och försök igen." },
  testmejlfel: { tone: "danger", text: "Testmejlet kunde inte skickas. Kontrollera nyckeln och att domänen är verifierad i Resend." },
  fskatt: { tone: "danger", text: "Utföraren har inte verifierad F-skatt och kan inte tilldelas." },
  ogiltig: { tone: "danger", text: "Uppgifterna är ogiltiga. Kontrollera fälten." },
  bekrafta: { tone: "danger", text: "Kryssa i rutan för att bekräfta att förfrågan ska tas bort." },
  ejborttagbar: {
    tone: "danger",
    text: "Godkända och utförda jobb kan inte tas bort, eftersom fakturor och avdrag måste sparas. Sätt status till Avbokad i stället.",
  },
  sista: { tone: "danger", text: "Du kan inte ta bort dig själv eller den sista administratören." },
};

/** Status message after a form redirect (?ok=sparad or ?fel=fskatt). */
export function Flash({ params }: { params: Record<string, string | string[] | undefined> }) {
  const key = (typeof params.ok === "string" && params.ok) || (typeof params.fel === "string" && params.fel) || null;
  const flash = key ? FLASH[key] : null;
  if (!flash) return null;
  return (
    <p
      role="status"
      className={cx(
        "mb-4 rounded-control border-2 p-3 font-bold",
        flash.tone === "success" ? "border-success bg-success-soft text-success" : "border-danger bg-danger-soft text-danger",
      )}
    >
      {flash.text}
    </p>
  );
}

export const tableClasses = "w-full border-collapse text-left text-base";
export const thClasses = "border-b-2 border-border px-3 py-2 text-sm font-bold whitespace-nowrap";
export const tdClasses = "border-b border-border px-3 py-2 align-top";
export const selectClasses =
  "min-h-12 w-full rounded-control border-2 border-control bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none";
