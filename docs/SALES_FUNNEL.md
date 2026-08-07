# Sales Funnel — Sprint 1 Plan

## Goal

Turn the current customer list into a mobile-first sales pipeline that shows where every enquiry came from, what must happen next, and where sales are being lost.

## Proposed stages

1. `新詢問` — a new contact that has not been qualified
2. `有效客戶` — contact details and genuine interest confirmed
3. `預約試騎` — appointment arranged
4. `已試騎` — test ride completed; retained from the legacy workflow
5. `已下訂` — order or deposit commitment recorded
6. `已付款` — payment confirmed
7. `已交車` — vehicle delivered; successful terminal outcome
8. `未成交` — unsuccessful terminal outcome

The first implementation must keep `未成交`. It must not force every legacy `已成交` record into `已交車` without a reviewed migration decision.

## Legacy status mapping

| Current status | Proposed default | Required review |
|---|---|---|
| `詢問中` | `新詢問` | Confirm whether any should become `有效客戶` |
| `預約試騎` | `預約試騎` | Direct mapping |
| `已試騎` | `已試騎` | Direct mapping |
| `已成交` | Review as `已下訂` or `已付款` | No vehicles have been delivered; never map a legacy row directly to `已交車` |
| `未成交` | `未成交` | Direct mapping |

Before migration, produce counts for every current status and a review list for all `已成交` rows. The migration must update existing rows before replacing the database `CHECK` constraint. Downgrade behavior must also be defined.

## Candidate data fields

### Required for a new enquiry

- Customer or company name
- Contact method/value
- Customer type: existing B2B/B2C/other channel classification
- Lead source platform
- Funnel stage, default `新詢問`

### Recommended sales tracking

- Audience segment
- Preferred language
- Interested price or budget
- Assigned owner
- Next action
- Next-action due date
- Loss reason when stage is `未成交`
- Order date, payment date, and delivery date for their corresponding stages
- Existing vehicle link, notes, referrer, batch-deal information, and deal amount

## Source platform values

Start with a controlled list plus `其他`: TikTok, Facebook ads, Facebook groups, Instagram, migrant-worker community, LINE, friend/referral, walk-in, and other. Store a stable internal value separately from the Traditional Chinese display label.

## Transition rules

- Normal forward movement follows the numbered stages.
- Users may move backward to correct data, but the change must not silently erase dates.
- `未成交` requires a loss reason and may be reopened.
- Entering `已下訂`, `已付款`, or `已交車` records its own date rather than reusing one generic deal date.
- A vehicle may be linked before delivery, but vehicle inventory status changes require a separate reviewed rule.
- API validation is authoritative; the frontend must not be the only enforcement layer.

## Sales ownership

Sprint 1 has two sales owners: `Polo` and `Daniel`. Use this controlled owner list rather than free text so assignments and reports remain consistent. Whether they require separate login accounts is still to be confirmed. Do not build a full multi-user permission system into this Sprint unless both people require separate logins.

## Mobile interface

- Default view: stage summary cards with counts and overdue next actions
- Secondary view: compact customer cards grouped or filtered by stage
- Quick actions: advance stage, set next action, call/message reference, and edit
- Filters: stage, source, audience, language, owner, and overdue state
- Keep full table access for desktop, but do not require horizontal scrolling for common mobile tasks

## Reporting

- Enquiries by source and time period
- Conversion between each stage
- Test-ride booking and completion rates
- Orders, payments, and deliveries
- Revenue by source
- Median time between stages
- Loss reasons
- Overdue next actions

## Implementation slices

1. Add tests for the current customer model and API behavior.
2. Add new columns that do not replace the status constraint.
3. Backfill or review legacy data.
4. Replace the status constraint in a reversible migration.
5. Update API validation and serialization.
6. Build the mobile pipeline and filters.
7. Update dashboard metrics.
8. Verify migration on a non-production database before approval for production.

## Decisions required before implementation

- Do Polo and Daniel need separate login accounts, or will one shared administrator login assign records between them?
- Which lead source values are required on day one?
- For each existing `已成交` row, is there an order/deposit, full payment, or only an agreed sale? No row may become `已交車` because no vehicle has been delivered yet.
- Does `已下訂` mean a signed order, a deposit, or either?
- When should a linked vehicle change inventory status?
