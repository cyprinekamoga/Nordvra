"use client";

import { Button } from "@/components/ui";

/** "Skriv ut": opens the browser's print dialog (the page has print styles). */
export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <Button variant="secondary" icon="file" onClick={() => window.print()} className="print:hidden">
      {children}
    </Button>
  );
}
