# Launch checklist

This preview is not cleared for publication. Every box below is open. A production build (`node src/build.mjs --production`) refuses to finish until the config flags are true and the values are not placeholders. Passing the script is not a substitute for the human checks.

## Still blocking a public launch

- [ ] Approved public brand, and `brand.nameApproved` set only after that choice.
- [ ] Legal operator name approved for publication. Do not invent a person to fill the field.
- [ ] Domain chosen, purchased by the operator, and `domain.verified` set. The preview emits no canonical and no sitemap URLs.
- [ ] Routing phone approved. Display text and E.164 must match. The preview has no `tel:` link for the referral.
- [ ] Answering hours in Pacific Time, including an explicit after-hours decision of “none” or “confirmed.” Do not imply all-hours response unless routing was tested.
- [ ] Authorized test of the live number: destination, disclosure before connection, overflow, caps, and after-hours behavior. Do not place that test from this build. No test call was made here.
- [ ] Written current acceptance for residential ZIPs, nearby cities, commercial property, and each specialty that will be offered as available. Conditional sections must stay conditional if acceptance is still no.
- [ ] Current billable rules confirmed by operations. Do not publish a payout amount.
- [ ] California referral and advertising review of the final domain, page wording, and call script. The CSLB paraphrase on the site is not that review.
- [ ] Privacy review if any analytics, call detail records, or recording will be added. Recording is off. This preview has no analytics tag.
- [ ] Real provider photographs, if any, with written permission. Stock or archival photos stay labeled. Do not present them as staff or vans.
- [ ] Separate publish approval, hosting, and SSL. Upload the `website/` folder from a production build only after the items above. Do not upload this preview and remove `noindex` by hand.

## Already true of this preview

- [x] 28 launch URLs, phone-only, no forms.
- [x] Referral identity stated on every page. No fake license, office, reviews, or crew.
- [x] Private-preview robots, noindex, and no canonical domain.
- [x] Production build fails closed on the shipped config (24 gate failures in the November 8, 2026 run).
- [x] Utility emergency numbers are labeled as the utility’s, not the referral’s.

## After launch, not now

- Search Console, analytics, and call disposition reporting.
- Extra URLs only when a section is outgrowing its page and acceptance is real. The guides page lists the unpublished titles so they are not created by accident.
