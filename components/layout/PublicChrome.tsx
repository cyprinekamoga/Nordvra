import { Suspense, type ReactNode } from "react";
import { PublicOnly } from "./PublicOnly";

/**
 * Renders customer-facing chrome (header, footer, cookie notice) everywhere except under
 * /admin, where the admin shell provides its own header. The pathname is read in a client
 * island; on routes whose pathname is only known at request time the chrome itself is the
 * Suspense fallback, so the static shell still contains it.
 */
export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <PublicOnly>{children}</PublicOnly>
    </Suspense>
  );
}
