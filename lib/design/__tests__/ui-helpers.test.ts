import { describe, expect, it } from "vitest";
import { isCurrentPath, footerLegal, footerPages, mainNav } from "@/components/layout/nav";
import { isAdminPath } from "@/components/layout/PublicOnly";
import { deductionBadgeText } from "@/components/ui/DeductionBadge";
import { yesNoToBoolean, booleanToYesNo } from "@/components/ui/YesNo";
import { company } from "@/lib/company";
import { getTaxRules } from "@/lib/taxRules";
import { t } from "@/lib/i18n";
import type { EligibilityWarning, IneligibleReason } from "@/lib/eligibility";

describe("company constants", () => {
  it("matches SPEC §1", () => {
    expect(company.phoneDisplay).toBe("076-113 43 84");
    expect(company.phoneHref).toBe("tel:+46761134384");
    expect(company.email).toBe("info@nordvra.se");
    expect(company.termsVersion).toBe("2026-10-15");
  });
});

describe("navigation", () => {
  it("links every public page from the footer", () => {
    const hrefs = [...footerPages, ...footerLegal].map((i) => i.href.split("#")[0]);
    for (const path of [
      "/",
      "/boka",
      "/sa-fungerar-rut-och-rot",
      "/vad-ger-inte-avdrag",
      "/vanliga-fragor",
      "/om-oss",
      "/kontakt",
      "/villkor",
      "/integritetspolicy",
    ]) {
      expect(hrefs).toContain(path);
    }
    expect(mainNav.map((i) => i.href)).toEqual(["/sa-fungerar-rut-och-rot", "/vanliga-fragor", "/kontakt"]);
  });

  it("marks the current page", () => {
    expect(isCurrentPath("/kontakt", "/kontakt")).toBe(true);
    expect(isCurrentPath("/", "/")).toBe(true);
    expect(isCurrentPath("/kontakt", "/")).toBe(false);
    expect(isCurrentPath("/boka/klart", "/boka")).toBe(true);
    expect(isCurrentPath("/integritetspolicy", "/integritetspolicy#cookies")).toBe(false);
    expect(isCurrentPath(null, "/kontakt")).toBe(false);
  });

  it("detects admin routes", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/bokningar/1")).toBe(true);
    expect(isAdminPath("/administration-info")).toBe(false);
    expect(isAdminPath("/")).toBe(false);
  });
});

describe("badges and answers", () => {
  it("shows the rates from the tax rules", () => {
    expect(deductionBadgeText("rut")).toBe("RUT 50 %");
    expect(deductionBadgeText("rot")).toBe("ROT 30 %");
    const overridden = getTaxRules(2026, [{ year: 2026, rotRate: 0.5 }]);
    expect(deductionBadgeText("rot", overridden)).toBe("ROT 50 %");
  });

  it("converts yes/no answers", () => {
    expect(yesNoToBoolean("ja")).toBe(true);
    expect(yesNoToBoolean("nej")).toBe(false);
    expect(yesNoToBoolean("vet_inte")).toBeUndefined();
    expect(booleanToYesNo(true)).toBe("ja");
    expect(booleanToYesNo(undefined)).toBeNull();
  });
});

describe("shared strings", () => {
  it("has a text for every eligibility reason and warning", () => {
    // Compile-time: adding a reason to lib/eligibility.ts without a text fails `tsc`.
    const reasons: Record<IneligibleReason, string> = t.common.eligibility.reasons;
    const warnings: Record<EligibilityWarning, string> = t.common.eligibility.warnings;
    for (const text of [...Object.values(reasons), ...Object.values(warnings)]) {
      expect(text.length).toBeGreaterThan(20);
    }
  });

  it("has a label for every booking status", () => {
    const statuses = [
      "ny_forfragan",
      "soker_utforare",
      "offert_skickad",
      "godkand",
      "utford",
      "betald",
      "rut_rot_begard",
      "avslutad",
      "nekad",
      "avbokad",
      "offert_utgangen",
    ] as const;
    for (const s of statuses) expect(t.common.status[s]).toBeTruthy();
    expect(Object.keys(t.common.status)).toHaveLength(statuses.length);
  });

  it("keeps the SPEC §5 legal texts verbatim", () => {
    const l = t.common.legal;
    expect(l.notGuaranteed.body).toBe(
      "RUT/ROT-avdraget förutsätter att du har rätt till det. Om Skatteverket nekar helt eller delvis (t.ex. för att du har för lite skatt eller redan använt ditt tak) betalar du mellanskillnaden.",
    );
    expect(l.labourOnly.body).toBe("Avdraget gäller bara arbetskostnaden, inte material eller resor.");
    expect(l.cap.body).toBe(
      "Max 75\u00a0000\u00a0kr per person och år för RUT och ROT tillsammans, varav max 50\u00a0000\u00a0kr för ROT.",
    );
    expect(l.payment.body).toBe(
      "Du måste betala elektroniskt (kort, Swish eller överföring) och själv vara den som betalar.",
    );
    expect(l.withdrawal.body).toBe("Du har 14 dagars ångerrätt.");
    expect(l.withdrawal.waiverCheckbox).toBe(
      "Jag vill att arbetet påbörjas inom ångerfristen och förstår att jag betalar för utfört arbete om jag ångrar mig.",
    );
    expect(l.personnummer.body).toBe(
      "Vi behöver ditt personnummer eftersom lagen kräver det när avdraget begärs från Skatteverket. Vi delar det bara med företaget som utför arbetet.",
    );
    expect(l.counterparty.complaint).toBe("Du har reklamationsrätt enligt konsumenttjänstlagen i 3 år.");
  });
});
