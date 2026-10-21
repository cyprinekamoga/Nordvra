import { addDays, addMonths } from "@/components/ui/calendar-utils";
import type { Catalog, Service } from "@/lib/catalog/types";

/**
 * The extras in the request flow that are not catalogue data: the move-out package (two
 * bookings in one request), seasonal subscriptions and the "remind me next time" option.
 * Pure, so the rules are unit-tested.
 */

// ---------------------------------------------------------------------------------------------
// Flyttpaket: moving help and move-out cleaning in one request

/** The service that completes a move-out package for each package service (all RUT). */
const PACKAGE_COMPANION: Readonly<Record<string, string>> = {
  flyttstadning: "bara-lasta",
  "bara-lasta": "flyttstadning",
  packning: "flyttstadning",
};

/** The other half of the move-out package, when this service has one and it can be booked. */
export function packageCompanion(catalog: Catalog, service: Service | null): Service | null {
  if (!service) return null;
  const id = PACKAGE_COMPANION[service.id];
  const companion = id ? catalog.services.find((s) => s.id === id && s.active) : undefined;
  return companion && companion.deductionType === service.deductionType ? companion : null;
}

// ---------------------------------------------------------------------------------------------
// Säsongsabonnemang

export const RECURRING_CHOICES = ["once", "season"] as const;
export type RecurringChoice = (typeof RECURRING_CHOICES)[number];

/** Services that can be booked as a seasonal subscription (labels in `t.booking.recurring`). */
export const SEASONAL_SERVICES = ["fonsterputs", "grasklippning", "snoskottning"] as const;
export type SeasonalService = (typeof SEASONAL_SERVICES)[number];

export function seasonalService(service: Service | null): SeasonalService | null {
  return service && (SEASONAL_SERVICES as readonly string[]).includes(service.id)
    ? (service.id as SeasonalService)
    : null;
}

// ---------------------------------------------------------------------------------------------
// Påminnelser

/** How many months until the same job is usually due again (only jobs people repeat). */
const REMIND_MONTHS: Readonly<Record<string, number>> = {
  fonsterputs: 6,
  storstadning: 12,
  grasklippning: 12,
  hackklippning: 12,
  ograsrensning: 12,
  krattning: 12,
  beskarning: 12,
  snoskottning: 12,
  takskottning: 12,
  hangrannor: 12,
  fasadtvatt: 12,
  varmepump: 12,
  skorsten: 12,
  kamin: 12,
  kakelugn: 12,
};

/** The reminder comes two weeks before the job is due, so there is time to book. */
export const REMIND_DAYS_BEFORE = 14;

export function reminderMonths(service: Service | null): number | null {
  return (service && REMIND_MONTHS[service.id]) || null;
}

/** "YYYY-MM-DD" for the reminder, or null when the service has none or the date is unknown. */
export function reminderDate(service: Service | null, jobDate: string | undefined): string | null {
  const months = reminderMonths(service);
  if (!months || !jobDate) return null;
  return addDays(addMonths(jobDate, months), -REMIND_DAYS_BEFORE);
}
