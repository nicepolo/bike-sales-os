# Be-Bike AI Sales Agent

The official product name used by the agent is `Be-Bike`. Customer-facing replies normalize unofficial product-name variants to `Be-Bike`.

## Approved product facts

- Be-Bike is an electric-assist bicycle offered as new old inventory clearance.
- Prices: 1 unit NT$12,800; 2 units NT$24,000; 3 or more units NT$10,800 each, plus one first-generation e-bike as a gift per qualifying order.
- First 20 units sold; most recently confirmed remaining inventory: 80 units (update when stock changes).
- It has the yellow label and a qualification certificate. The actual certificate number is not yet supplied and must never be invented.
- No driving licence is required, and it may be used legally on the road in accordance with applicable rules.
- Be-Bike previously cooperated with Tainan City Government.
- Intended audiences include students, commuters, foreign workers, older adults, and daily-transport users.
- Quotes outside the published multi-unit promotion require human confirmation.
- Delivery method and cost depend on location and quantity and require human confirmation.
- Factory-confirmed range is approximately 25 km per charge, subject to riding conditions and battery state; maximum assist speed is approximately 25 km/h.
- Factory-confirmed battery: Han-Win HWT-1003-AW-S35, 36V / 10.2Ah / 367Wh.
- Original manufacturer does not provide standard new-product commercial warranty for this clearance inventory; statutory consumer rights remain unaffected. Specific paid battery/repair options require human confirmation.
- Motor rated power, bicycle dimensions, weight, delivery fee, exact certificate number and viewing address remain unverified and must not be guessed.

## Reply routing

The service uses deterministic replies before calling AI for the six exact rich-menu payloads configured in LINE:

- `我想了解 BE-BIKE 的特色與適合對象`
- `我想預約 BE-BIKE 購車諮詢`
- `我想詢問 BE-BIKE 目前的價格與庫存`
- `我想了解 BE-BIKE 的購買與交車流程`
- `我想查看 BE-BIKE 常見問題`
- `我需要真人客服協助`

Product-name matching is case-insensitive, so `BE-BIKE` and `Be-Bike` trigger the same reply. The service also handles common natural-language questions about price, licence, road use, labels, suitability, viewing, delivery, group purchases, and unverified specifications.

High-intent messages—including buying, ordering, test rides, payment, company procurement, group purchases, multiple units, delivery quotations, and discount requests—are routed toward human sales and ask for name, city/county, quantity, and a convenient contact time. Other free-form questions use the OpenAI Responses API with the same approved facts and safety rules.

Incomplete model responses are replaced with a useful sales fallback before replying to LINE.

## Visual replies (Flex Message)

For the overview, price, FAQ and purchase-process replies, the LINE webhook sends an image-led Flex carousel. It uses the existing, real Be-Bike product photographs hosted at:

- `/be-bike/be-bike-hero.jpg`
- `/be-bike/be-bike-detail.jpg`
- `/be-bike/be-bike-side.jpg`

The buttons either send a predefined sales/consultation message or open the real-photo/video landing page `/be-bike`. No AI-generated bicycle photographs are used. The images must be reachable as public HTTPS resources for LINE clients.

For one-off questions, uncertain media origins, and all human handoffs, the system keeps the normal text-only reply. The underlying approved response content and lead collection remain unchanged.

## Webhook

- Endpoint: `POST /api/webhooks/line`
- Production URL: `https://<railway-domain>/api/webhooks/line`
- The endpoint validates `X-Line-Signature` against the exact raw request body before parsing JSON.
- V1 handles LINE text-message events. Other event and message types are acknowledged and ignored.

Configure the production URL in LINE Developers, enable the webhook, and disable LINE OA's conflicting automatic reply if the AI agent should be the only responder.

## Railway environment variables

Set these on the existing Railway web service. Never put their values in GitHub:

| Variable | Purpose |
|---|---|
| `LINE_CHANNEL_SECRET` | Verifies webhook signatures |
| `LINE_CHANNEL_ACCESS_TOKEN` | Sends replies through the Messaging API |
| `OPENAI_API_KEY` | Generates the sales response |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-5-mini` |
| `LINE_PUBLIC_BASE_URL` | Optional public HTTPS origin (for example `https://your-domain`) for visual card images. If unset, the webhook's public request hostname is used. |

The existing Docker/Railway deployment architecture does not need to change.

## CRM extension point

Each successfully generated text response is passed to a `LeadSink` as a `LeadInquiry` containing the LINE webhook event ID, message ID, user ID, incoming message, AI reply, and event timestamp. The default sink deliberately performs no database write.

When the lead-field mapping and consent policy are approved, implement an adapter that writes to the existing `Customer` model and register it as:

```python
app.extensions["line_lead_sink"] = CustomerLeadSink()
```

This keeps channel handling separate from CRM policy and avoids creating incomplete or duplicate production customers. This release does not add database fields or migrations. A production adapter should use the webhook event ID or message ID for idempotency and define identity matching by LINE user ID, consent/retention rules, name fallback behavior, ownership, and status/next-action mappings before it is enabled.

## Safety behavior

The agent directly answers with approved facts. It must not invent a certificate number, motor rated power, dimensions, weight, warranty period, delivery fee, viewing address, payment account, or unconfirmed inventory changes. Unverified details are handed to human sales for confirmation. AI output is normalized to the official product name and rejected if it contains an incorrect numeric price or an unverified numeric specification claim.
