"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent } from "react";
import { DeductionBadge, Icon } from "@/components/ui";
import { fmt, t } from "@/lib/i18n";
import type { DeductionType } from "@/lib/taxRules";

const h = t.content.home.hero;

export interface SearchableService {
  id: string;
  name: string;
  category: string;
  deductionType: DeductionType;
}

const MAX_RESULTS = 6;

function normalize(text: string): string {
  return text.toLocaleLowerCase("sv-SE").normalize("NFC").trim();
}

/**
 * "Sök efter tjänst": filters the catalogue as you type and links each match straight to its
 * step in the booking flow (`/boka?tjanst=…`). Enter opens the first match.
 */
export function ServiceSearch({ services }: { services: readonly SearchableService[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputId = useId();
  const statusId = useId();
  const q = normalize(query);

  const results = useMemo(() => {
    if (q.length < 2) return [];
    const starts: SearchableService[] = [];
    const contains: SearchableService[] = [];
    for (const service of services) {
      const name = normalize(service.name);
      if (name.startsWith(q)) starts.push(service);
      else if (name.includes(q) || normalize(service.category).includes(q)) contains.push(service);
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS);
  }, [q, services]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    router.push(results[0] ? `/boka?tjanst=${encodeURIComponent(results[0].id)}` : "/boka");
  }

  const status =
    q.length < 2 ? "" : results.length === 1 ? h.searchCountOne : fmt(h.searchCount, { count: results.length });

  return (
    <form role="search" onSubmit={onSubmit} className="relative">
      <label htmlFor={inputId} className="sr-only">
        {h.searchLabel}
      </label>
      {/* The focus ring goes around the whole rounded field, not the bare input inside it. */}
      <div className="flex items-center gap-3 rounded-full border-2 border-border bg-surface px-5 focus-within:border-brand has-[input:focus-visible]:outline-[3px] has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus has-[input:focus-visible]:outline-solid">
        <Icon name="search" size={24} className="shrink-0 text-ink" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={h.searchPlaceholder}
          autoComplete="off"
          aria-describedby={statusId}
          className="min-h-14 w-full min-w-0 bg-transparent text-lg text-ink placeholder:text-muted focus-visible:shadow-none focus-visible:outline-none"
        />
      </div>
      <p id={statusId} aria-live="polite" className="sr-only">
        {status}
      </p>
      {q.length >= 2 ? (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-lg">
          {results.length > 0 ? (
            <ul>
              {results.map((service) => (
                <li key={service.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/boka?tjanst=${encodeURIComponent(service.id)}`}
                    className="flex min-h-14 items-center justify-between gap-3 px-5 py-2 no-underline hover:bg-brand-soft"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{service.name}</span>
                      <span className="block text-muted">{service.category}</span>
                    </span>
                    <DeductionBadge type={service.deductionType} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2 px-5 py-4">
              <p className="text-ink">{h.searchNoResults}</p>
              <Link href="/boka" className="link font-semibold">
                {h.searchAll}
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}
