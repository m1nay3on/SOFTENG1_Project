# RoadWatch Data Model (ERD)

> This is a logical, application-level ERD inferred from the inspected route code and collection mappings. The Mongoose schemas are flexible (`strict: false`), so the diagram shows observed references rather than enforced foreign keys. Field names vary between camelCase and snake_case in the current code.

```mermaid
erDiagram
    USERS {
        ObjectId _id
        string email
        string role
        string firstName
        string lastName
    }
    CATEGORIES {
        ObjectId _id
        string name
        string category_name
        boolean active
    }
    REPORTS {
        string id
        string report_id
        ObjectId citizen_id
        ObjectId category_id
        string reporterEmail
        string status
        string priority
        string location
        string description
        datetime createdAt
    }
    REPORT_PHOTOS {
        ObjectId _id
        string report_id
        string filename
        string content_type
        string data_url
        string uploaded_by_email
        datetime created_at
    }
    STATUS_LOGS {
        ObjectId _id
        string report_id
        string previousStatus
        string status
        ObjectId changed_by
        datetime changed_at
    }
    VERIFICATIONS {
        ObjectId _id
        string report_id
        ObjectId inspector_id
        string inspectorEmail
        string status
        string notes
        string priority
        datetime inspectedAt
    }
    ASSIGNMENTS {
        ObjectId _id
        string report_id
        string assigned_to_email
        ObjectId crew_supervisor_id
        ObjectId assigned_by
        string status
        datetime assigned_at
        datetime completed_at
    }

    USERS o|--o{ REPORTS : "reports submitted by citizen"
    CATEGORIES o|--o{ REPORTS : "category_id"
    REPORTS ||--o{ REPORT_PHOTOS : "report_id / report_id or id"
    REPORTS ||--o{ STATUS_LOGS : "report_id / id"
    REPORTS ||--o| VERIFICATIONS : "report_id / id"
    REPORTS ||--o{ ASSIGNMENTS : "report_id / id"
    USERS o|--o{ STATUS_LOGS : "changed_by"
    USERS o|--o{ VERIFICATIONS : "inspector_id"
    USERS o|--o{ ASSIGNMENTS : "assigned_to_email / crew_supervisor_id"
```

## Observed relationships and caveats

- Report creation writes `citizen_id` from the user document and `category_id` from the category document. Reports also store reporter email/name and category text.
- Related photo, status log, verification, and assignment documents use a report identifier, typically `report_id`; report lookups accept `id`, `reportId`, or `report_id`.
- The API upserts one verification record per report using `report_id`; the diagram therefore shows a zero-or-one verification relationship as intended by that operation.
- Assignment creation upserts by `report_id`, so the current route maintains one assignment document per report rather than a full assignment history.
- Some relationships are by email, while others use MongoDB ObjectIds. These are logical references, not database-enforced foreign keys.
- Exact fields and indexes must be confirmed against real stored documents and database indexes before treating this as a definitive physical ERD.
