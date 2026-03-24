# Object Model Visual

```mermaid
classDiagram
  class Organization {
    +id: string
    +name: string
  }

  class User {
    +id: string
    +email: string
    +displayName: string
    +role: UserRole
    +isActive: boolean
  }

  class Matter {
    +id: string
    +referenceNumber: string
    +title: string
    +venue: string
    +caseType: string
  }

  class Job {
    +id: string
    +scheduledStart: Date
    +scheduledEnd: Date
    +location: string
    +status: JobStatus
    +notes: string
  }

  class Record {
    +id: string
    +type: RecordType
    +title: string
    +storagePath: string
    +status: RecordStatus
    +version: number
  }

  class MatterMembership {
    +id: string
    +role: UserRole
  }

  class AuditEvent {
    +id: string
    +action: AuditAction
    +entityType: string
    +entityId: string
    +metadataJson: object
  }

  Organization "1" --> "many" User : users
  Organization "1" --> "many" Matter : matters
  Organization "1" --> "many" AuditEvent : auditEvents

  Matter "1" --> "many" Job : jobs
  Matter "1" --> "many" Record : records
  Matter "1" --> "many" MatterMembership : memberships

  User "1" --> "many" MatterMembership : memberships
  User "1" --> "many" AuditEvent : actions
```

## Domain boundaries
- **Scheduling domain:** `Job`
- **Records domain:** `Record`
- **Access domain:** `User`, `MatterMembership`
- **Compliance domain:** `AuditEvent`
- **Case context domain:** `Matter`
