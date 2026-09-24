import { notFound } from "next/navigation";

import { listLocations } from "@/lib/api/public";
import { getDictionary, hasLocale } from "@/lib/i18n";

import { AboutSection } from "./_components/sections/about-section";
import { FindUsSection } from "./_components/sections/find-us-section";
import { GallerySection } from "./_components/sections/gallery-section";
import { Hero } from "./_components/sections/hero";
import { ReviewsSection } from "./_components/sections/reviews-section";
import { ServicesSection } from "./_components/sections/services-section";

/**
 * One page, six sections, in the order a visitor asks the questions: what is
 * this, what does it cost, who are you, do people like it, what does the work
 * look like, where are you.
 *
 * The branch list is fetched here and passed down because the map section is a
 * Client Component — it has to be, the branch picker changes what the iframe
 * shows — and a Client Component cannot reach the tenant key.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const locations = await listLocations();

  return (
    <>
      <Hero locale={locale} dict={dict} />
      <ServicesSection dict={dict} />
      <AboutSection locale={locale} dict={dict} />
      <ReviewsSection locale={locale} dict={dict} />
      <GallerySection locale={locale} dict={dict} />
      <FindUsSection locale={locale} dict={dict} locations={locations} />
    </>
  );
}
