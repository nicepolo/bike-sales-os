# Bike Sales OS — Roadmap

## Status legend

- `NEXT`: ready for the next planning step
- `PLANNED`: agreed direction, details still required
- `BLOCKED`: requires verified evidence or a user decision
- `LATER`: intentionally deferred

## Foundation

- `NEXT` Confirm the collaboration documents with Codex and Claude Code.
- `PLANNED` Use `master` only for reviewed production releases.
- `PLANNED` Create one branch per feature and review before merge.
- `PLANNED` GitHub pull requests automatically run backend tests and the frontend production build, pending production review.
- `NEXT` Add GitHub protection for `master` after confirming the repository plan supports the required rules.
- `LATER` Add staging only when the deployment workflow justifies its ongoing cost.

## Sprint 1 — Sales operations

- `PLANNED` Detailed scope recorded in `docs/SALES_FUNNEL.md`.
- `NEXT` Resolve the business decisions listed in the Sales Funnel plan.
- `PLANNED` Support two controlled sales owners, `Polo` and `Daniel`, using the existing shared administrator login.
- `PLANNED` Define funnel stages, allowed transitions, required fields, and reporting metrics.
- `PLANNED` Map every legacy customer status, including `未成交`, and specify rollback behavior before changing the database constraint.
- `PLANNED` Add channel/source attribution and next-action tracking.
- `PLANNED` Design the mobile-first funnel interface.
- `PLANNED` Implement a safe database migration, API changes, UI, and tests/checks.
- `PLANNED` Baseline Factory Checklist API tests are implemented pending review; keep backend compile and frontend production-build checks.

## Sprint 1 — Factory intelligence

- `PLANNED` Detailed scope recorded in `docs/FACTORY_CHECKLIST.md`.
- `NEXT` Resolve the visit and evidence-storage decisions listed in the Factory Checklist plan.
- `PLANNED` Visit summary and unresolved-question export are implemented pending production review.
- `PLANNED` Editable visit name, factory, date, and overall notes are implemented pending production review.
- `PLANNED` Factory staff perform the full count; our team records a representative sample and later receiving inspection.
- `PLANNED` Cover certification labels, motor, battery, charger, frame number, inventory, colours, controls, parts, and reusable media shots.
- `PLANNED` Separate verified values, captured evidence, and unresolved questions.
- `PLANNED` Design a mobile workflow that can be used during the factory visit.

## Evidence-dependent work

- `BLOCKED` Final product specifications
- `BLOCKED` Certification and road-legality statements
- `BLOCKED` Battery, motor, charger, and range claims
- `BLOCKED` Final warranty and after-sales wording
- `BLOCKED` Formal FAQ and user manual claims

## Later phases

- `LATER` Product master database
- `LATER` Website and public FAQ
- `LATER` User manual and purchase information
- `LATER` Marketing content production pipeline
- `LATER` AI-assisted customer support
