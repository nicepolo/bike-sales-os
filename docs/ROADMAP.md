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
- `NEXT` Add GitHub protection for `master` after confirming the repository plan supports the required rules.
- `LATER` Add staging only when the deployment workflow justifies its ongoing cost.

## Sprint 1 — Sales operations

- `NEXT` Map the current customer schema and API to the proposed Sales Funnel.
- `PLANNED` Define funnel stages, allowed transitions, required fields, and reporting metrics.
- `PLANNED` Map every legacy customer status, including `未成交`, and specify rollback behavior before changing the database constraint.
- `PLANNED` Add channel/source attribution and next-action tracking.
- `PLANNED` Design the mobile-first funnel interface.
- `PLANNED` Implement a safe database migration, API changes, UI, and tests/checks.
- `PLANNED` Add baseline automated tests; until then require backend compile and frontend production-build checks.

## Sprint 1 — Factory intelligence

- `NEXT` Define the factory checklist sections and evidence requirements.
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
