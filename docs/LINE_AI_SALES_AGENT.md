# Be-Bike AI Sales Agent V1

The official product name used by the agent is `BE-BIKE`. Inputs such as `BE100`, `B100`, or `BE-100` are treated as possible customer mistakes and trigger a short confirmation rather than being presented as official model names.

Until verified product data is connected, the agent must not infer features, specifications, equipment, suitability, price, or stock from generic electric-bike knowledge. Incomplete model responses are replaced with a complete safe fallback before replying to LINE.

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

This keeps channel handling separate from CRM policy and avoids creating incomplete or duplicate production customers in V1. A production adapter should use the webhook event ID or message ID for idempotency and define identity matching by LINE user ID, consent/retention rules, name fallback behavior, ownership, and status/next-action mappings before it is enabled.

## Safety behavior

The AI instruction prohibits inventing product specifications, road-legality or certification claims, range, motor/battery details, warranty, licence requirements, price, and inventory. Unverified facts must be presented as pending confirmation and handed to a human salesperson.
