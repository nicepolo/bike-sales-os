# Bike Sales OS — Project Brief

## Purpose

Bike Sales OS supports the sale and delivery of approximately 100 Be-Bike BE100 new-old-stock e-bikes. It should connect inventory, customer enquiries, the sales funnel, factory evidence, and operational reporting without making unverified product claims.

## Current system

- Frontend: React 18, Vite, React Router, Axios
- Backend: Flask, SQLAlchemy, Flask-Migrate, Flask-Login
- Database: PostgreSQL
- Deployment: one multi-stage Docker image on Railway
- Production branch: `master`, automatically deployed by Railway
- Current modules: administrator login, vehicles, customers, and dashboard summary

## Current business capabilities

- Vehicle records and status tracking
- Customer records for B2B/B2C enquiries
- Basic customer status flow and deal information
- Dashboard totals for enquiries, deals, and revenue

## Product principles

- Mobile-first and Traditional Chinese first
- Verified evidence over assumptions
- Production data must remain recoverable
- Sales attribution must connect enquiries to channels and outcomes
- Factory collection should produce reusable evidence for sales, FAQ, manuals, and marketing

## First Sprint

### Sales Funnel

Plan a clear funnel that covers at least:

`新詢問 → 有效客戶 → 預約試騎 → 已下訂 → 已付款 → 已交車`

Candidate supporting fields include source platform, audience segment, preferred language, interested price, owner, next action, and notes. Final fields require a schema review against the existing customer model before implementation.

The existing customer status is protected by a database `CHECK` constraint and contains the legacy stages `詢問中`, `預約試騎`, `已試騎`, `已成交`, and `未成交`. The proposed funnel is therefore a data migration, not a label-only UI change. Before implementation, define mappings for every existing row, preserve `未成交` as an explicit terminal outcome, and decide how `已成交` maps into the new order/payment/delivery stages. The migration must be reversible and reviewed before it reaches production.

### Factory Checklist

Plan a mobile checklist for collecting verified evidence about certification labels, motor, battery, charger, frame number, inventory, colours, controls, parts, and reusable photo/video shots. Product facts remain `待確認` until supported by captured evidence.

## Out of scope for the first Sprint

- Rewriting the whole application
- AI customer service
- Publishing legal, certification, range, warranty, or licence claims
- Unreviewed production migrations
- Changing Railway deployment architecture
