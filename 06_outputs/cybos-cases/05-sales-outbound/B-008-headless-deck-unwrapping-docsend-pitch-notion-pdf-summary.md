---
id: B-008
tier: B
category: "Sales & outbound"
kind: workflow
title: "Headless deck unwrapping (DocSend / Pitch / Notion → PDF → summary)"
subtitle: "20 decks a week need analyst review. Forward the share link; structured JSON summary in the tracker in 60 seconds."
source: https://www.cybos.ai/cases/B-008
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "Investor analyst · BD lead · competitive-intelligence researcher"
type: case
version: v0.1
---
# Headless deck unwrapping (DocSend / Pitch / Notion → PDF → summary)

> 20 decks a week need analyst review. Forward the share link; structured JSON summary in the tracker in 60 seconds.

## What

Takes a deck-share URL (DocSend, Pitch, Gamma, Notion, Figma, Canva) with optional password, completes the auth gate using a residential-proxy headless browser, sniffs the internal GraphQL response for the direct `/d/<id>` href, hands that to a third-party PDF converter, OCRs any image-only pages with Tesseract, then asks Haiku for a structured JSON summary (`company`, `founder`, `one-liner`, `vertical`, `stage`, `traction`, `team`, `links`).

## Why it matters

20+ decks per week get summarised with zero analyst time. Founder forwards a DocSend link → 60 seconds later the summary appears in the team's tracker.

## End-to-end

1. Provision a Browserbase account; install Playwright + Chromium.
2. Detect URL shape: `/view/s/<space>` needs the browser step; `/view/<id>` can skip straight to the converter.
3. For space URLs: open in Browserbase, fill the email gate, listen for `presentation/graphql` responses, walk JSON for an `href` containing `/d/`.
4. Send the resolved href + viewer email + passcode to `docsend2pdf.com/api/convert`.
5. Save PDF to `data/decks/<deal_uuid>/deck.pdf`.
6. Extract text with pypdf. If under ~200 chars, fall back to `pdf2image + pytesseract` OCR at 180 DPI.
7. Run a Haiku summarisation prompt; emit structured JSON; attach to the deal record.

## Gotchas

- DocSend's WAF actively blocks AWS / GCP / Azure IP ranges. Running the browser step from a normal cloud worker will fail silently — residential proxies are mandatory for that one step.

<hr/>

## Tools

- Browserbase (paid; residential proxies)
- Playwright + Chromium, pypdf, pdf2image, Tesseract
- docsend2pdf.com (free tier exists)
- Haiku (cheap summarisation tier)
