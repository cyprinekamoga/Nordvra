import { describe, expect, it } from "vitest";
import { parsePublishedReviews, parseReviewState, validateReview } from "@/lib/reviews/reviews";

describe("reviews", () => {
  it("validates rating, text and display name", () => {
    expect(validateReview({ rating: "5", body: "Jättebra flyttstädning, allt godkänt.", displayName: "Anna, Eskilstuna" }).ok).toBe(true);
    const bad = validateReview({ rating: "7", body: "Bra", displayName: "A" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["body", "displayName", "rating"]);
    const pnr = validateReview({ rating: 4, body: "Mitt personnummer är 19121212-1212 hej", displayName: "Anna" });
    expect(pnr.ok).toBe(false);
  });

  it("parses published reviews and drops broken rows", () => {
    const parsed = parsePublishedReviews({
      count: 2,
      average: 4.5,
      items: [
        { rating: 5, body: "Toppen", display_name: "Anna, Eskilstuna", service_name: "Flyttstädning" },
        { rating: 9, body: "x", display_name: "y" },
      ],
    });
    expect(parsed.count).toBe(2);
    expect(parsed.average).toBe(4.5);
    expect(parsed.items).toHaveLength(1);
    expect(parsePublishedReviews(null)).toEqual({ count: 0, average: null, items: [] });
  });

  it("suggests first name and city as the display name", () => {
    const state = parseReviewState({ booking_number: "NV-2026-00010", contact_name: "Anna", city: "Eskilstuna", can_review: true, reviewed: false });
    expect(state).toMatchObject({ suggestedName: "Anna, Eskilstuna", canReview: true, reviewed: false });
  });
});
