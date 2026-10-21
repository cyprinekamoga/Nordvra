import Link from "next/link";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { computeStats } from "@/lib/admin/stats";
import { BOOKING_STATUSES } from "@/lib/admin/filters";
import { formatDateLong, formatKr, formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { Flash, PageHeader, StatusBadge } from "@/components/admin/bits";
import { addDays, stockholmDate } from "@/components/ui/calendar-utils";
import { sendReminderAction } from "@/lib/admin/trust-actions";
import { WeeklyChart } from "@/components/admin/WeeklyChart";

export const metadata = { title: "Översikt" };

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  await connection();
  const supabase = await createServerSupabase();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7 * 13);
  const today = stockholmDate(new Date());
  const monthAgo = new Date();
  monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
  const [{ data: recent }, { data: all }, { data: reminders }, { data: redos }] = await Promise.all([
    supabase
      .from("bookings")
      .select("created_at")
      .gte("created_at", since.toISOString()),
    supabase
      .from("bookings")
      .select(
        "created_at,status,model,labour_ore,material_ore,travel_ore,subcontractor_cost_ore,commission_pct,paid_amount_ore,claim_requested_ore",
      )
      .limit(10000),
    // Reminders the customer asked for that are due within two weeks.
    supabase
      .from("bookings")
      .select("id,booking_number,service_name,contact_name,remind_on")
      .lte("remind_on", addDays(today, 14))
      .is("reminder_sent_at", null)
      .in("status", ["godkand", "utford", "betald", "rut_rot_begard", "avslutad"])
      .order("remind_on")
      .limit(50),
    // Besiktningsgaranti requests from the last 30 days.
    supabase
      .from("bookings")
      .select("id,booking_number,service_name,redo_requested_at")
      .gte("redo_requested_at", monthAgo.toISOString())
      .order("redo_requested_at", { ascending: false })
      .limit(20),
  ]);
  const stats = computeStats(all ?? [], new Date());
  const newCount = stats.byStatus.ny_forfragan ?? 0;

  const tiles = [
    { label: "Förfrågningar totalt", value: formatNumber(stats.total) },
    { label: "Senaste 13 veckorna", value: formatNumber(recent?.length ?? 0) },
    { label: "Intäkt RUT-jobb (betalt)", value: formatKr(stats.sellerRevenueOre) },
    { label: "Marginal RUT-jobb", value: formatKr(stats.sellerMarginOre) },
    { label: "Provision ROT-jobb", value: formatKr(stats.agentCommissionOre) },
    { label: "Begärt RUT/ROT-avdrag", value: formatKr(stats.requestedDeductionOre) },
  ];

  return (
    <>
      <PageHeader title="Översikt">
        {newCount > 0 && (
          <p className="mt-2">
            <Link href="/admin/bokningar?status=ny_forfragan" className="link font-bold">
              {newCount} {newCount === 1 ? "ny förfrågan väntar" : "nya förfrågningar väntar"} på dig
            </Link>
          </p>
        )}
      </PageHeader>
      <Flash params={sp} />

      {(redos ?? []).length > 0 && (
        <section aria-labelledby="omstadning" className="mb-8">
          <h2 id="omstadning" className="mb-3 text-xl font-bold text-danger">
            Omstädning begärd (besiktningsgaranti)
          </h2>
          <ul className="space-y-2">
            {(redos ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/admin/bokningar/${r.id}`} className="link font-bold">
                  {r.booking_number} {r.service_name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="paminnelser" className="mb-8">
        <h2 id="paminnelser" className="mb-3 text-xl font-bold">
          Påminnelser att skicka
        </h2>
        {(reminders ?? []).length === 0 ? (
          <p className="text-muted">Inga påminnelser de närmaste två veckorna.</p>
        ) : (
          <ul className="space-y-3">
            {(reminders ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3">
                <Link href={`/admin/bokningar/${r.id}`} className="link font-bold">
                  {r.booking_number}
                </Link>
                <span>
                  {r.service_name}, {r.contact_name}, {formatDateLong(r.remind_on)}
                </span>
                <form action={sendReminderAction}>
                  <input type="hidden" name="bookingId" value={r.id} />
                  <button
                    type="submit"
                    className="min-h-12 rounded-control border-2 border-brand bg-surface px-4 font-semibold text-brand"
                  >
                    Skicka påminnelse
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Card padding="sm" className="h-full">
              <p className="text-sm text-muted">{tile.label}</p>
              <p className="text-2xl font-bold tabular-nums">{tile.value}</p>
            </Card>
          </li>
        ))}
      </ul>

      <section aria-labelledby="per-vecka" className="mb-8">
        <h2 id="per-vecka" className="mb-3 text-xl font-bold">
          Förfrågningar per vecka
        </h2>
        <Card>
          <WeeklyChart weeks={stats.weeks} />
        </Card>
      </section>

      <section aria-labelledby="per-status">
        <h2 id="per-status" className="mb-3 text-xl font-bold">
          Per status
        </h2>
        <ul className="flex flex-wrap gap-3">
          {BOOKING_STATUSES.map((s) => (
            <li key={s}>
              <Link
                href={`/admin/bokningar?status=${s}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-control border border-border bg-surface px-3 no-underline"
              >
                <StatusBadge status={s} />
                <span className="font-bold tabular-nums">{stats.byStatus[s] ?? 0}</span>
                <span className="sr-only">{t.common.status[s]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
