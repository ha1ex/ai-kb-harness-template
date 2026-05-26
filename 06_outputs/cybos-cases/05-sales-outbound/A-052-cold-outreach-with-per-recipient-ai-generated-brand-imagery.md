---
id: A-052
tier: A
category: "Sales & outbound"
kind: workflow
title: "Cold outreach with per-recipient AI-generated brand imagery — collapses the Apollo-tier value-add"
subtitle: "Problem solved: Apollo, Outreach, and similar B2B sequencing tools charge $300-1000/mo for personalization the recipient barely notices; a vibecoded pipeline buys Apollo only for raw contacts ($59 / 2,800 leads), generates a per-recipient branded image (BrandFetch logo + gpt-image), and drafts a one-image Gmail message at 6-7¢/email all-in."
source: https://www.cybos.ai/cases/A-052
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · growth lead · SDR ops"
type: case
version: v0.1
---
# Cold outreach with per-recipient AI-generated brand imagery — collapses the Apollo-tier value-add

> Problem solved: Apollo, Outreach, and similar B2B sequencing tools charge $300-1000/mo for personalization the recipient barely notices; a vibecoded pipeline buys Apollo only for raw contacts ($59 / 2,800 leads), generates a per-recipient branded image (BrandFetch logo + gpt-image), and drafts a one-image Gmail message at 6-7¢/email all-in.

## What

B2B outbound flow for a product with a visual hook (in source: branded corporate gifting; the pattern generalizes to any product where a per-prospect mockup carries the message). Step 1: define 3 target personas + minimal subject/body variants in ChatGPT. Step 2: buy Apollo for one month ($59 → 2,800 contacts), apply ChatGPT-suggested filters, export the contact list to Google Sheets (Apollo blocks API export — you live with the manual download). Step 3: build (or reuse) a per-domain image generator that takes a recipient's work email, pulls brand assets via the BrandFetch API, and renders a personalized mockup of your offer with their logo applied. Step 4: have Claude write a script that walks the Google Sheet, calls the image endpoint per row, and creates a Gmail draft per recipient with minimal text + one big clickable image of the offer as the CTA. Step 5: review drafts; after a few hundred, the prompts stabilize and you stop reviewing. Reported economics: ~6-7¢/email all-in, ~20¢/click, ~30% open/click conversion.

## Why it matters

The strategic insight is not the workflow — it's what it kills. The operator's takeaway, verbatim: *"if someone offers me a cheaper contact base than Apollo I'll cancel that subscription instantly."* Apollo's pricing assumed you needed sequencing + AI-personalization on top. With Claude writing the script in an afternoon and gpt-image producing the per-recipient asset at 2-3¢, the only thing you still buy Apollo for is the contact dump — and at $59 for 2,800 leads that's a one-month spend, not a recurring SaaS bill. Any B2B outbound team paying for the value-add tier of an Apollo / Outreach / Lemlist should run this math against their own funnel.

## End-to-end

1. **Persona + copy in ChatGPT.** Define 3 target personas. Generate subject + body variants in the most minimal form possible — the per-recipient image is doing the personalization work, the text is short on purpose.
2. **Buy Apollo for one month.** Apply the persona filters ChatGPT suggested. Export contacts to Google Sheets manually (Apollo blocks API export — don't waste an afternoon trying to script it).
3. **Per-domain branded-image endpoint.** Wire BrandFetch API → for each work email, pull the company's brand assets (logo, brand colors). Feed into gpt-image (or equivalent) with a fixed prompt template that places the logo onto your offer mockup. ~2-3¢ per image at non-top-tier quality settings — that's the unit cost driver.
4. **Spam-script — Claude writes it.** Tell Claude: walk the Google Sheets contact list, hit the image endpoint per row, create one Gmail draft per row with minimal text + the generated image as the clickable CTA. Save as drafts in Gmail, not sent — you'll batch-review then bulk-send.
5. **Review drafts early; stop reviewing once prompts stabilize.** First few hundred drafts: review every one. After the template hardens, the operator stops reviewing entirely.
6. **Retarget the engaged.** ~30% open/click but sales lag on first touch (long sales cycle for the source product). Cheap retarget the engaged contacts until they convert.
7. **Cost-control the image generation.** gpt-image at "not the highest quality" is 2-3¢/image — that's the lever for total cost. Don't reach for the top-quality tier unless your average order value justifies it. Total all-in lands at ~6-7¢/email, ~20¢/click.

## Prompts

The operator's reflection on what this kills:

```
`What's beautiful about this case: it's pure vibe-coding — I haven't even
looked at what's under the hood, because "why bother". It's a very specific
tool for a specific task, not a product or a platform.

The personalized image triggers interest immediately — only possible with
image gen.

If someone offers me a cheaper contact base than Apollo I'll cancel that
subscription instantly.
`
```

Spam-script architecture:

```
`For each row in contacts.csv:
 1. Extract work email → domain
 2. POST domain to BrandFetch API → brand assets (logo, colors)
 3. Compose image-gen prompt:
 "Render <our offer mockup> with <logo> applied in <brand colors>"
 4. POST to gpt-image (low/mid quality tier) → ~2-3¢/image
 5. Pick subject + body variant by persona
 6. Create Gmail draft via Gmail API:
 to: <row.email>
 subject: <variant.subject>
 body: <variant.body>
 inline_image: <generated_image, clickable to landing>
 7. Save as draft (do not send)

Batch-review drafts in Gmail, bulk-send the approved batch.
`
```

## Gotchas

- **Apollo blocks API export.** You will manually download the CSV from Apollo. Don't waste cycles trying to scrape — just plan for it in the workflow.
- **Open/click ≠ sales on first touch.** Reported ~30% open/click but sales were "still warming" at writeup time. Long sales cycles need a retarget loop — bake it in or the campaign reads as a flop at 30 days.
- **Image quality is the cost lever, not the script.** ~75% of unit cost is gpt-image; the rest is Apollo amortized + Gmail. Don't optimize the script — optimize the image quality tier against your AOV.
- **Minimum-text, one-image format only works with a visual offer.** Source was branded corporate gifting (cookies with a company logo). For non-visual products (B2B SaaS without a UI screenshot story) the format degrades — switch to a per-prospect screenshot of *their* product / website with your tool's annotation overlaid.

<hr/>

## Tools

- Apollo (one month, ~$59 / 2,800 contacts — buy it for the contact list, not the sequencer)
- BrandFetch API — per-domain brand assets
- gpt-image (mid-quality tier for cost; ~2-3¢/image)
- Gmail API — draft creation
- Google Sheets — contact list staging
- Claude — writes the script in an afternoon
