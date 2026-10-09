# RoadWatch Use-Case Diagram

> Scope: use cases supported by the inspected API routes and workflow validator. UI-only behavior and deployment details are outside this diagram.

```mermaid
flowchart LR
    Citizen[Citizen]
    Inspector[Field Inspector]
    Admin[Administrator]

    subgraph RoadWatch["RoadWatch API"]
        Register((Register account))
        Login((Log in))
        OwnReports((View own reports))
        Submit((Submit report))
        Evidence((Attach photo evidence))
        Categories((View active categories))
        Review((Review report))
        Decide((Verify / request information / reject))
        Assignment((Assign report to inspector))
        Repair((Update repair status))
        Endorse((Endorse verified report))
        Close((Close report))
        History((View status history))
        Verification((View verification record))
        Photos((View report photos))
        ManageUsers((List / create users))
        ListAssignments((View assignments))
    end

    Citizen --> Register
    Citizen --> Login
    Citizen --> Categories
    Citizen --> Submit
    Submit -. optional .-> Evidence
    Citizen --> OwnReports
    Citizen --> History
    Citizen --> Verification
    Citizen --> Photos

    Inspector --> Login
    Inspector --> Review
    Inspector --> Decide
    Inspector --> Repair
    Inspector --> ListAssignments
    Inspector --> History
    Inspector --> Verification
    Inspector --> Photos

    Admin --> Login
    Admin --> ManageUsers
    Admin --> Categories
    Admin --> Review
    Admin --> Assignment
    Admin --> Endorse
    Admin --> Close
    Admin --> ListAssignments
    Admin --> History
    Admin --> Verification
    Admin --> Photos
```

## Actor notes

- **Citizen:** can self-register, sign in, view active categories, create reports, and access only their own report details and related records.
- **Field Inspector:** can perform the inspection decisions permitted by the transition rules, view assignments assigned to their email, and move an assigned verified report to `Ongoing`.
- **Administrator:** can list/create users, create assignments, endorse verified reports to the Engineering Office, and close reports through permitted transitions.
- All three roles can authenticate. Most other API routes require authentication; specific role requirements apply as implemented in `api.js`.

## Boundaries

This diagram represents API capabilities, not proof that every frontend screen currently calls the API. Account editing/deletion and report editing/deletion endpoints were not found in the inspected API router.
