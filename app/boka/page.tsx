import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowLoading } from "@/components/booking/FlowLoading";
import { RequestFlow } from "@/components/booking/RequestFlow";
import { PhoneCard } from "@/components/layout";
import { Container } from "@/components/ui";
import { getCatalog } from "@/lib/catalog/load";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t.booking.meta.title,
  description: t.booking.meta.description,
  alternates: { canonical: "/boka" },
};

/**
 * `/boka` – the click-only request flow (SPEC §4). The catalogue is cached ('use cache'), so the
 * page shell is static; the flow itself renders in the browser (step in `?steg=N`, answers in
 * sessionStorage) inside a Suspense boundary because it reads the search params.
 */
export default async function BookPage() {
  const catalog = await getCatalog();
  return (
    <Container width="narrow" className="space-y-10 py-6 sm:py-10">
      <Suspense fallback={<FlowLoading />}>
        <RequestFlow catalog={catalog} />
      </Suspense>
      <PhoneCard />
    </Container>
  );
}
