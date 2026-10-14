import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { decryptPII } from "@/lib/crypto/pii";
import { loadExportBookings, toExportBooking } from "@/lib/admin/export";
import { buildRows, toCsv } from "@/lib/admin/csv";

const iso = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

/** CSV with full personnummer for the RUT/ROT claim. Admins only, never cached. */
export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return new Response("Ingen behörighet", { status: 403, headers: { "Cache-Control": "no-store" } });

  const range = { from: iso(request.nextUrl.searchParams.get("fran")), to: iso(request.nextUrl.searchParams.get("till")) };
  const supabase = await createServerSupabase();
  const { rows, overrides } = await loadExportBookings(supabase, range);
  const csv = toCsv(
    buildRows(
      rows.map((r) =>
        toExportBooking(r, (b) => {
          if (!b.pnr_encrypted) return b.pnr_masked;
          try {
            return decryptPII(b.pnr_encrypted);
          } catch {
            return b.pnr_masked;
          }
        }),
      ),
      overrides,
    ),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nordvra-rut-rot-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
