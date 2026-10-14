import Link from "next/link";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { computeStats } from "@/lib/admin/stats";
import { BOOKING_STATUSES } from "@/lib/admin/filters";
import { formatKr, formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { PageHeader, StatusBadge } from "@/components/admin/bits";
import { WeeklyChart } from "@/components/admin/WeeklyChart";

export const metadata = { title: "Översikt" };

export default async function AdminDashboard() {
  await connection();
  const supabase = await createServerSupabase();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7 * 13);
  const [{ data: recent }, { data: all }] = await Promise.all([
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
