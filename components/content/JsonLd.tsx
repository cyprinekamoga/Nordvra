import { serializeJsonLd } from "@/lib/content/faq";

/** Structured data as `<script type="application/ld+json">`, with "<" escaped. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Safe: serializeJsonLd escapes "<" so the payload can't close the script element.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
