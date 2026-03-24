# DB Schema Visual (MyVeritext 2.0)

```mermaid
erDiagram
    Organization ||--o{ User : has
    Organization ||--o{ Matter : owns
    Organization ||--o{ AuditEvent : logs

    Matter ||--o{ Job : schedules
    Matter ||--o{ Record : contains
    Matter ||--o{ MatterMembership : grants_access
    Matter ||--o{ AuditEvent : context

    User ||--o{ MatterMembership : assigned_to
    User ||--o{ AuditEvent : acts

    Organization {
      string id PK
      string name
      datetime createdAt
      datetime updatedAt
    }

    User {
      string id PK
      string organizationId FK
      string email UK
      string displayName
      enum role
      boolean isActive
      datetime createdAt
      datetime updatedAt
    }

    Matter {
      string id PK
      string organizationId FK
      string referenceNumber
      string title
      string venue
      string caseType
      datetime openedAt
      datetime createdAt
      datetime updatedAt
    }

    MatterMembership {
      string id PK
      string matterId FK
      string userId FK
      enum role
      datetime createdAt
    }

    Job {
      string id PK
      string matterId FK
      datetime scheduledStart
      datetime scheduledEnd
      string location
      string remoteUrl
      enum status
      string notes
      datetime createdAt
      datetime updatedAt
    }

    Record {
      string id PK
      string matterId FK
      enum type
      string title
      string storagePath
      string originalFileName
      string mimeType
      bigint sizeBytes
      enum status
      int version
      string uploadedById
      datetime uploadedAt
      datetime createdAt
      datetime updatedAt
    }

    AuditEvent {
      string id PK
      string organizationId FK
      string matterId FK
      string actorUserId FK
      enum action
      string entityType
      string entityId
      json metadataJson
      datetime createdAt
    }
```

## Notes
- `Matter` is the core aggregate.
- `MatterMembership` enables matter-scoped RBAC.
- `AuditEvent` captures compliance/traceability actions.
- `Record` stores transcript/exhibit metadata (binary blobs live in GCS).
