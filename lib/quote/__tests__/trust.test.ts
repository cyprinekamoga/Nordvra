import { describe, expect, it } from "vitest";
import { complaintUntil, parseHomeLog } from "@/lib/quote/homeLog";
import { companyAgeYears, parsePhotos, parseQuote, redoState } from "@/lib/quote/quote";

const PATH = "0b5d4b00-0000-4000-8000-000000000001/2e9e6e00-0000-4000-8000-000000000002.jpg";

describe("company checks", () => {
  it("counts whole years since registration", () => {
    expect(companyAgeYears("2014-05-02", "2026-10-21")).toBe(12);
    expect(companyAgeYears("2014-10-22", "2026-10-21")).toBe(11);
    expect(companyAgeYears("2026-09-01", "2026-10-21")).toBe(0);
  });

  it("reads partner checks and drops F-skatt dates that are not dates", () => {
    const quote = parseQuote({
      booking_number: "NV-2026-00001",
      status: "offert_skickad",
      deduction_type: "rut",
      model: "seller",
      partner_checks: { f_skatt_checked_at: "2026-10-01", employer_registered: true, founded_on: "x" },
    });
    expect(quote?.partnerChecks).toMatchObject({ fSkattCheckedAt: "2026-10-01", employerRegistered: true, foundedOn: null });
  });
});

describe("photo report", () => {
  it("keeps only well-formed storage paths", () => {
    expect(parsePhotos([{ path: PATH, kind: "fore" }, { path: "../hemligt.jpg" }, null])).toEqual([
      { path: PATH, caption: null, kind: "fore" },
    ]);
  });
});

describe("besiktningsgaranti", () => {
  const base = {
    formKind: "flyttstad",
    redoRequestedAt: null,
    redoLastDay: "2026-10-30",
    completedAt: null,
    scheduledDate: "2026-10-20",
  };
  it("opens on the cleaning day and closes after the last day", () => {
    expect(redoState(base, "2026-10-19")).toBe("notYet");
    expect(redoState(base, "2026-10-20")).toBe("open");
    expect(redoState(base, "2026-10-30")).toBe("open");
    expect(redoState(base, "2026-10-31")).toBe("closed");
    expect(redoState({ ...base, redoRequestedAt: "2026-10-22T10:00:00Z" }, "2026-10-22")).toBe("requested");
    expect(redoState({ ...base, formKind: "hemstad" }, "2026-10-22")).toBe("none");
  });
});

describe("bostadens logg", () => {
  it("parses entries and gives 3 years to complain", () => {
    const [entry] = parseHomeLog([
      {
        booking_number: "NV-2026-00002",
        deduction_type: "rot",
        service_name: "Målning inomhus",
        completed_at: "2026-10-15",
        labour_ore: 1_000_000,
        material_ore: 200_000,
        travel_ore: 50_000,
        photos: [{ path: PATH }],
      },
      { booking_number: "", deduction_type: "rut" },
    ]);
    expect(entry.totalOre).toBe(1_250_000);
    expect(entry.photos).toHaveLength(1);
    expect(complaintUntil(entry)).toBe("2029-10-15");
    expect(complaintUntil({ completedAt: null })).toBeNull();
  });
});
