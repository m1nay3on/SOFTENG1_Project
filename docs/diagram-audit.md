# Diagram and Process Audit

## Purpose

This document records the evidence and limitations behind the RoadWatch architecture, use-case, workflow, and data-model diagrams.

## Evidence reviewed

- `backend/src/routes/api.js`
- `backend/src/models/index.js`
- `backend/src/validators/workflow.js`
- `backend/tests/workflow.test.js`
- Repository documentation previously reviewed, including the README and API endpoint documentation.

## Findings

### 1. Status workflow differences

The backend validator defines `Verified → Endorsed to Engineering Office` for Administrator and `Endorsed to Engineering Office → Closed`. It defines `Verified → Ongoing` for Field Inspector. It does **not** define a direct `Verified → Closed` transition, or an Administrator `Verified → Ongoing` transition. The diagrams follow the validator rather than older/generalized workflow summaries.

### 2. Audit data is stored in separate collections

The API writes status transitions to `status_logs`, inspection decisions to `verifications`, evidence metadata/data URLs to `report_photos`, and assignment/completion details to `assignments`. These are distinct records connected through report identifiers and, in some cases, user identifiers or email addresses.

### 3. Data model is flexible

`backend/src/models/index.js` creates schemas with `strict: false` and no declared field-level schema or explicit relationship constraints. The ERD is therefore a logical view inferred from the route operations, not a verified schema specification.

### 4. Evidence validation

The workflow validator allows up to five PNG/JPEG evidence images, checks the data URL/content type and file signature, and caps each decoded image at 5 MB. The route stores image metadata and data URLs in `report_photos`.

### 5. Authorization boundaries

The inspected API applies role restrictions to user administration, report creation, status changes, and assignment management. Citizens are filtered to their own reports in report listing/detail and related status-log, verification, and photo endpoints. These access checks should be covered by route-level tests as well as unit tests.

### 6. Frontend integration and deployment are not confirmed by this audit

The files reviewed here do not establish that the frontend is currently connected to this backend in the running environment. Nor do they verify hosting, network topology, TLS, proxy configuration, or the live database connection. The architecture diagram labels the frontend/API link as requiring verification.

## Test coverage observed

`backend/tests/workflow.test.js` tests user input validation, report input trimming and evidence validation, maximum evidence count, priority values, selected role/status transitions, and assignment input validation. It does not, by itself, prove all route authorization, persistence, or end-to-end workflow behavior.

## Recommended follow-up

- Inspect `frontend/src/services/api.js` and frontend environment settings to confirm the API base URL and integration.
- Inspect backend startup/database configuration to confirm how MongoDB is connected.
- Add or verify route tests for role access, citizen ownership boundaries, status-log creation, verification upserts, assignment checks, and endorsement requirements.
- Compare the documented field names with representative sanitized database documents and indexes before finalizing a physical ERD.
- Keep these Markdown Mermaid files under version control and update them alongside workflow/API changes.
