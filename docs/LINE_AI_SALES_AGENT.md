# Be-Bike AI Sales Agent

The official product name used by the agent is `Be-Bike`. Customer-facing replies normalize unofficial product-name variants to `Be-Bike`.

## Approved product facts

- Be-Bike is an electric-assist bicycle offered as new old inventory clearance.
- Price: `NT$12,800` per unit.
- It has the yellow label and a qualification certificate. The actual certificate number is not yet supplied and must never be invented.
- No driving licence is required, and it may be used legally on the road in accordance with applicable rules.
- Be-Bike previously cooperated with Tainan City Government.
- Intended audiences include students, commuters, foreign workers, older adults, and daily-transport users.
- Multi-unit and group purchases receive a separate quotation.
- Delivery method and cost depend on location and quantity and require human confirmation.
- Warranty and repair details require human confirmation.
- Range, battery capacity, motor power, dimensions, and weight remain unverified and must not be guessed.

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

The existing Docker/Railway deployment architecture does not need to change.

## CRM extension point

Each successfully generated text response is passed to a `LeadSink` as a `LeadInquiry` containing the LINE webhook event ID, message ID, user ID, incoming message, AI reply, and event timestamp. The default sink deliberately performs no database write.

When the lead-field mapping and consent policy are approved, implement an adapter that writes to the existing `Customer` model and register it as:

```python
app.extensions["line_lead_sink"] = CustomerLeadSink()
```

This keeps channel handling separate from CRM policy and avoids creating incomplete or duplicate production customers. This release does not add database fields or migrations. A production adapter should use the webhook event ID or message ID for idempotency and define identity matching by LINE user ID, consent/retention rules, name fallback behavior, ownership, and status/next-action mappings before it is enabled.

## Safety behavior

The agent directly answers with approved facts. It must not invent a certificate number, battery capacity, range, motor power, dimensions, weight, warranty period, delivery fee, viewing address, payment account, or exact remaining inventory. Unverified details are handed to human sales for confirmation. AI output is normalized to the official product name and rejected if it contains an incorrect numeric price or an unverified numeric specification claim.
