# AgriTrade landing page

The public `/` introduces the existing product. `/auth` retains persisted session authentication, registration and organization creation. Farmer/trader CTA intent is passed to registration and selects supplier/trader organization type; it never grants verification or administrative access.

## Content and design

Forest green, warm cream and self-hosted Vazirmatn; locally stored agricultural imagery. The page includes separate farmer/trader CTAs, real capability descriptions, an illustrative capability preview without fabricated business data, three onboarding steps, native expandable FAQs and a closing registration CTA. Keyboard-operated role tabs, a mobile menu with Escape, a skip link, reduced-motion handling and stored light/dark/system preferences are included.

Landing marketing copy is currently complete in Persian and English; other retained language choices use the English landing copy. Authentication and operational errors retain the ten-language dictionaries from the preceding milestone. Full landing translations and native review remain outstanding. Browser-stored language choices do not create separate crawlable locale URLs; localized URL routes/hreflang are future work.

## SEO configuration

Set `NEXT_PUBLIC_SITE_URL` to the actual HTTPS origin in the deployment environment **before** building the frontend. For Compose development it is forwarded from root `.env`. For example, use the real site's origin without a path; no production domain is invented in source.

With that variable configured, metadata emits the homepage canonical and the sitemap advertises the real homepage URL. Without it, the sitemap is intentionally empty and Next falls back to its development origin for social image resolution. Production domain-dependent SEO is not complete until this is configured. Title, description, Open Graph, Twitter card, generated PNG social artwork, favicon, semantic headings, Persian prerendered copy and visible-FAQ JSON-LD are present. `/auth` and role panels are noindex; robots excludes those routes and the API. These are crawler hints, not access controls. FAQ markup does not promise rich-result eligibility or search rankings.

No analytics provider, conversion tracking, search-console account, production hosting, indexing, ranking or Lighthouse score is claimed. The Compose stack continues to run development servers. Existing business-module gaps remain in IMPLEMENTATION_STATUS.md.

## Hero asset provenance

Saved project asset: `apps/web/public/images/fields.png`. Created using the built-in image_gen tool and copied into the project; consumed with Next Image responsive sizing and preload. It is an illustrative generated landscape, not evidence of a real supplier's farm.

Exact generation prompt:

> Create a premium editorial agricultural landscape photograph for a farm-to-trade platform website hero. Vertical 4:5 composition. Rolling fertile agricultural fields and precise curved crop rows, sunlit golden green wheat in foreground, olive green fields and distant hills, warm late afternoon natural light, subtle atmospheric depth, sophisticated muted forest green and ochre palette. Photorealistic, richly textured, calm and aspirational, authentic agricultural landscape. No people, no buildings, no machinery, no text, no logos, no overlays. Image will be cropped as a tall website hero panel. Save generated asset for project use.

Earlier external-photo download attempts failed; no externally hosted photo is required by the delivered page.
