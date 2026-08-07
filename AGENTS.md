# Bike Sales OS — AI Collaboration Rules

## Project goal

Build a mobile-first sales and factory-intelligence system for selling approximately 100 Be-Bike BE100 new-old-stock e-bikes.

## Source of truth

- Read `docs/PROJECT.md` before planning product changes.
- Read `docs/ROADMAP.md` before starting a sprint item.
- Existing code and database migrations are the source of truth for current behavior.
- Never invent product specifications. Unverified facts must be marked `TBD` or `待確認`.

## Safety rules

- Do not claim road legality, certification, range, motor power, battery specifications, warranty, or licence requirements without verified evidence.
- Never delete or rewrite production data without an explicit migration and approval.
- Never commit secrets, passwords, tokens, customer personal data, or production `.env` values.
- Do not change Railway production settings or deploy directly unless explicitly requested.
- Treat `master` as the production branch. Work on `feature/*`, `fix/*`, or `chore/*` branches and merge through review.

## Engineering conventions

- Primary language for the product UI and documentation is Traditional Chinese.
- Preserve the current stack: React/Vite frontend, Flask/SQLAlchemy backend, PostgreSQL, Docker/Railway.
- Prefer small, reversible changes with database migrations where required.
- Keep the UI mobile-first.
- Run relevant checks before handing work to another agent.
- Until automated tests are added, the minimum checks are `python -m compileall backend/app backend/wsgi.py` and `npm run build --prefix frontend`. Run migration-specific checks when a schema change is proposed.
- Report changed files, checks run, unresolved risks, and any assumptions.

## Codex and Claude Code workflow

1. Codex scopes and implements one task on a non-production branch.
2. Claude Code reviews the completed diff without editing first.
3. Codex applies approved fixes and verifies the result.
4. The user approves before merge or production deployment.
5. Codex and Claude Code must not edit the same working tree at the same time.
6. If the user asks Claude Code to implement a fix, Codex must first confirm it has no work in progress on the same branch. Otherwise Claude Code provides review comments only and Codex applies the changes.

User approval must be recorded explicitly in the conversation before merging, pushing to `master`, deploying, changing Railway, or changing GitHub repository rules.
