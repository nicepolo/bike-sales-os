# Factory Checklist — Sprint 1 Plan

## Goal

Provide a mobile-first field workflow for collecting verified BE100 evidence once, then reuse it for the product database, website, FAQ, manual, purchasing information, support, and marketing content.

## Evidence model

Every checklist item should store:

- Status: `未檢查`, `已確認`, `不適用`, or `有問題`
- Captured value or answer
- Evidence photos or videos
- Evidence source or person who answered
- Capture time
- Notes and follow-up question
- Verification state: `待確認` or `已驗證`

An answer without evidence may guide follow-up work but must remain `待確認` for public product claims.

## Checklist sections

### A. Vehicle identity and exterior

- Full vehicle: front, rear, left, right, and three-quarter views
- Frame number and exact location
- Model/name plates and manufacturer markings
- Colour and visible condition
- Tyres, brakes, lights, basket, stand, saddle, controls, keys, and accessories
- Packaging, included documents, and included parts

### B. Certification and labels

- Full view and close-up of every certification or yellow label
- Issuer, type/model, number, date, and readable wording
- Location of each label on the vehicle
- Supporting certificates or official documents
- Unresolved questions about road use, registration, licence, or legal classification

No legal conclusion should be recorded as verified solely from staff recollection.

### C. Battery

- Battery exterior and label close-ups
- Manufacturer, model, chemistry, voltage, capacity, serial number, and date code
- Removable/fixed design and removal procedure
- Lock/key behavior and connector condition
- Charge indicator and measured state where available
- Storage history, visible damage, swelling, corrosion, and sample test result

### D. Motor and controller

- Motor location and label
- Manufacturer, model, rated values, and serial/lot information
- Controller location and label
- Wiring/connectors and visible condition
- Assistance modes and cut-off behavior observed during operation

### E. Charger and charging

- Charger full view and label
- Input/output values and connector
- Included cable/adapter
- Demonstrated charging sequence
- Indicator-light meanings
- Charging location and safety instructions supplied by the manufacturer

### F. Operation test

- Power on/off
- Display and indicators
- Assistance modes
- Brakes and motor cut-off
- Lights, horn/bell, throttle if present, and other controls
- Battery removal/installation
- Folding/adjustment features if present
- Abnormal noise, vibration, warning code, or fault

Do not infer range or performance from a short factory test.

### G. Inventory sampling

- Factory staff are responsible for the full inventory count; record their total, count date, responsible person, and the document or export that supports it
- Our team performs a sample verification rather than recounting all approximately 100 units
- Vehicle code/frame number
- Colour
- Battery code
- Keys, charger, documents, and accessories present
- Condition exceptions and missing items
- Storage location
- Sample size, sampling method, selected locations/colours/batches, and any exceptions

The factory states that units delivered to us will be brand new. Record this as a supplier commitment, not as a verified fact for every unit. Use representative factory sampling plus a receiving inspection for delivered units. Any mismatch between the supplier list, sample, and received unit must be recorded and escalated.

### H. Parts and after-sales

- Supplier/contact for battery, charger, motor, controller, display, brakes, tyres, lights, locks, and keys
- Current stock, minimum order, lead time, and expected availability
- Interchangeability and part numbers
- Repair capability and diagnostic process
- Written after-sales commitments and exclusions

### I. Reusable media shot list

- Clean hero shots in horizontal and vertical formats
- Walk-around and detail close-ups
- Power-on and control sequence
- Basket/load demonstration without unsupported capacity claims
- Low-step frame mounting demonstration
- Battery removal and charging
- Test-ride start, stop, turning, and parking
- Condition disclosure shots
- Factory inventory context
- Quiet ambient clips for voice-over reuse

Capture short stable clips with clean backgrounds, leave editing handles at the start/end, and avoid speaking unverified specifications on camera.

### J. Questions for factory staff

- Exact model history and production year evidence
- Reason the inventory remained unsold
- Storage conditions and maintenance history
- Known recurring faults
- Certification-document ownership and permission to publish
- Original manuals, diagrams, parts lists, and training material
- What is included with each unit
- Which statements may be supported in writing
- Who can answer unresolved technical questions after the visit

## Mobile workflow

- Start or resume a factory visit
- Select a checklist section
- Capture value, evidence, and notes in one screen
- Flag missing or contradictory evidence
- Show completion by section
- Export an unresolved-questions list before leaving
- Allow offline-friendly draft capture; upload strategy requires technical validation

## Completion rules

- A section percentage must distinguish `已確認` from merely answered.
- Required photos must be present before an item can be `已驗證`.
- Contradictory values remain flagged; the latest answer does not overwrite earlier evidence.
- Public-facing specifications are generated only from verified fields.
- Personal contact data and private factory documents must not be exposed publicly.

## Inventory verification split

### Factory responsibility

- Count the full inventory
- Provide the inventory list and responsible person
- Confirm that delivered units will be brand new and state what is included
- Identify exceptions, missing accessories, or damaged packaging

### Our responsibility

- Define and record the sample method
- Inspect representative vehicles across storage areas, colours, or identifiable batches
- Compare sampled frame/battery identifiers with the factory inventory list
- Photograph sample condition and included items
- Perform receiving inspection when units are actually handed over

The sample is evidence about the checked units only; it does not prove the condition of every uninspected unit.

## Implementation slices

1. Confirm checklist wording and factory visit priorities.
2. Design visit, section, item, answer, and evidence records.
3. Decide secure media storage before implementing uploads.
4. Build mobile checklist navigation and progress.
5. Add camera/file capture and evidence review.
6. Add unresolved-question and visit-summary exports.
7. Test the workflow with a short mock visit before the factory trip.

## Decisions required before implementation

- When is the planned factory visit?
- What sample size and selection method should our team use while the factory performs the full count?
- Who is permitted to view factory evidence?
- Where should photos/videos be stored?
- Which checklist sections are mandatory before leaving the factory?
