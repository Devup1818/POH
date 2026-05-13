# Railway POH Management System - Architecture

## Overview

The POH (Periodic Overhaul) Management System is a Next.js-based web application for managing railway coach maintenance operations at EMU Car Shed, Ghaziabad. It tracks the complete lifecycle of POH operations from intake to release, with coach-level granularity and multi-section work tracking.

---

## System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser[Browser / Mobile]
        UI[React Components]
        State[Context / State Management]
    end

    subgraph Framework["Next.js Framework"]
        RouteHandlers[Route Handlers]
        Middleware[Middleware]
        StaticPages[Static / SSR Pages]
    end

    subgraph Backend["Business Logic Layer"]
        Actions[Server Actions]
        Queries[Data Queries]
        Validations[Zod Validations]
    end

    subgraph External["External Services"]
        Supabase[(Supabase PostgreSQL)]
        Auth[Supabase Auth]
        Storage[Supabase Storage]
    end

    Browser --> UI
    UI --> State
    UI --> RouteHandlers
    RouteHandlers --> Actions
    State --> Actions
    Actions --> Queries
    Queries --> Supabase
    Actions --> Validations
    RouteHandlers --> Middleware
    Middleware --> Auth
```

---

## Technology Stack

```mermaid
graph LR
    Frontend[React 19 / Next.js 16] --> Styling[Tailwind CSS 3]
    Frontend --> Icons[Lucide React]
    Frontend --> Charts[Recharts]

    Backend[Next.js API] --> Validation[Zod]
    Backend --> PDF[jsPDF + AutoTable]

    Data[(Supabase PostgreSQL)] --> ORM[Supabase JS SDK]

    Auth[Supabase Auth] --> RLS[Row Level Security]
    Data --> RLS

    Testing[Vitest + React Testing Library] --> TypeScript[TypeScript 5]
```

---

## Data Model

### Core Entities

```mermaid
erDiagram
    SHED ||--o{ RAKE : contains
    SHED {
        uuid id PK
        string name
        string location
        timestamp created_at
    }

    RAKE ||--|{ COACH : comprises
    RAKE {
        uuid id PK
        string rake_number UK
        enum rake_type
        enum poh_type
        uuid shed_id FK
        enum status
        timestamp intake_date
        timestamp completed_at
        timestamp created_at
    }

    COACH {
        uuid id PK
        string coach_number
        uuid rake_id FK
        enum coach_type
        enum current_stage
        enum timeline_status
        float completion_percentage
        timestamp created_at
    }

    COACH ||--o{ COACH_SECTION_STATUS : has
    COACH ||--o{ STAGE_HISTORY : tracks
    COACH ||--o{ PART : contains
    COACH ||--o{ NOTE : has

    COACH_SECTION_STATUS ||--|| SECTION_TEMPLATE : references
    SECTION_TEMPLATE ||--o{ WORK_ITEM_TEMPLATE : contains
    SECTION_TEMPLATE ||--o{ MUST_CHANGE_TEMPLATE : contains
    SECTION_TEMPLATE ||--o{ TEST_TEMPLATE : contains
```

### POH Stages Flow

```mermaid
stateDiagram-v2
    [*] --> Intake
    Intake --> Dismantling
    Dismantling --> Inspection
    Inspection --> Overhaul
    Overhaul --> Reassembly
    Reassembly --> Finishing
    Finishing --> Testing
    Testing --> Trial
    Trial --> Release
    Release --> [*]

    Testing --> Testing: Electrical
    Testing --> Testing: Mechanical
    Testing --> Testing: Pneumatic
```

---

## Application Structure

```mermaid
graph TB
    subgraph Routes["Route Groups"]
        AuthRoutes["(auth)"]
        DashboardRoutes["(dashboard)"]
        APIRoutes["api/"]
    end

    subgraph Auth["Auth Routes"]
        Login["/login"]
    end

    subgraph Dashboard["Dashboard Routes"]
        Home["/ - Dashboard Home"]
        Rakes["/rakes - Rake List"]
        RakeDetail["/rakes/[id] - Rake Detail"]
        CoachDetail["/rakes/[id]/coach/[coachId]"]
        Admin["/admin - Admin Panel"]
        Completed["/completed - Completed Rakes"]
        Reports["/reports - Analytics"]
        Settings["/settings - User Settings"]
    end

    subgraph Components["Component Architecture"]
        UI["ui/ - Reusable UI"]
        RakeComponents["rakes/ - Rake Views"]
        CoachComponents["coaches/ - Coach Views"]
        SectionComponents["sections/ - Section Views"]
        DashboardComponents["dashboard/ - Dashboard"]
        AdminComponents["admin/ - Admin"]
        AuthComponents["auth/ - Auth"]
        ReportsComponents["reports/ - Reports"]
    end

    AuthRoutes --> Login
    DashboardRoutes --> Home
    DashboardRoutes --> Rakes
    DashboardRoutes --> RakeDetail
    DashboardRoutes --> CoachDetail
    DashboardRoutes --> Admin
    DashboardRoutes --> Completed
    DashboardRoutes --> Reports
    DashboardRoutes --> Settings
```

---

## Module Architecture

### Coach Section Workflow

```mermaid
flowchart LR
    subgraph Sections["Workshop Sections"]
        E2[E2 - Electrical]
        E3[E3 - Traction Motor]
        E5[E5 - Pneumatic]
        M2[M2 - Bogie]
        M3[M3 - Body Shell]
        M4[M4 - Lifting/Shifting]
        M5[M5 - Wheel/Buffer]
        M6[M6 - Couplers]
        M8[M8 - Misc]
        Painting[Painting]
    end

    subgraph WorkItems["Work Tracking"]
        WI[Work Items]
        MC[Must Change Items]
        Tests[Section Tests]
    end

    E2 --> WI
    E3 --> WI
    E5 --> WI
    M2 --> WI
    M3 --> WI
    M4 --> WI
    M5 --> WI
    M6 --> WI
    M8 --> WI
    Painting --> WI

    E2 --> MC
    E3 --> MC
    M2 --> MC
    M3 --> MC
    M5 --> MC
    M6 --> MC

    E2 --> Tests
    E3 --> Tests
    E5 --> Tests
    M2 --> Tests
    M3 --> Tests
    M5 --> Tests
    M6 --> Tests
```

### Rake Lifecycle

```mermaid
flowchart TB
    subgraph Registration
        CreateRake[Create Rake Record]
        AddCoaches[Add Coaches]
        AssignChecklist[Assign POH Checklist]
        InitializeSections[Initialize Sections]
    end

    subgraph ActivePOH
        TrackSections[Track Section Progress]
        UpdateWorkItems[Update Work Items]
        ManageMustChange[Manage Must-Change Items]
        RunTests[Run Section Tests]
        RecordNotes[Record Notes]
    end

    subgraph Completion
        ValidateCompletion[Validate Completion]
        GenerateReport[Generate Job Card]
        ArchiveRake[Archive Rake]
    end

    CreateRake --> AddCoaches
    AddCoaches --> AssignChecklist
    AssignChecklist --> InitializeSections
    InitializeSections --> TrackSections
    TrackSections --> UpdateWorkItems
    TrackSections --> ManageMustChange
    TrackSections --> RunTests
    TrackSections --> RecordNotes
    UpdateWorkItems --> ValidateCompletion
    ManageMustChange --> ValidateCompletion
    RunTests --> ValidateCompletion
    RecordNotes --> ValidateCompletion
    ValidateCompletion --> GenerateReport
    GenerateReport --> ArchiveRake
```

---

## Authentication & Authorization

```mermaid
flowchart TB
    subgraph AuthFlow["Authentication Flow"]
        Login["User Login"]
        Verify["Verify OTP"]
        Session["Create Session"]
        CheckRole["Check User Role"]
    end

    subgraph Roles["User Roles"]
        Admin[Admin]
        SSE[Senior Section Engineer]
        JE[Junior Engineer]
        Tech[Technician]
        Viewer[Viewer]
    end

    subgraph Permissions["Permission Matrix"]
        Create[Create Rake]
        Update[Update Coach]
        Delete[Delete/Admin]
        View[View Only]
    end

    Login --> Verify
    Verify --> Session
    Session --> CheckRole
    CheckRole --> Admin
    CheckRole --> SSE
    CheckRole --> JE
    CheckRole --> Tech
    CheckRole --> Viewer

    Admin --> Create
    Admin --> Update
    Admin --> Delete
    Admin --> View

    SSE --> Create
    SSE --> Update
    SSE --> View

    JE --> Update
    JE --> View

    Tech --> View

    Viewer --> View
```

---

## Database Schema Overview

### Key Tables

```mermaid
erDiagram
    sheds {
        uuid id PK
        string name
        string location
        boolean is_active
    }

    users {
        uuid id PK
        string email
        string full_name
        enum role
        boolean is_active
    }

    users ||--o{ shed_assignments : has
    users ||--o{ section_assignments : has
    shed_assignments ||--|| sheds : belongs_to

    rakes ||--|{ coaches : contains
    coaches ||--o{ coach_section_status : tracks
    coaches ||--o{ stage_history : logs
    coaches ||--o{ parts : contains

    section_templates ||--o{ work_item_templates : includes
    section_templates ||--o{ must_change_templates : includes
    section_templates ||--o{ test_templates : includes

    coaches ||--o{ work_item_instances : assigned
    coaches ||--o{ must_change_instances : assigned
    coaches ||--o{ test_instances : assigned
```

---

## API Structure

### Route Handlers

```mermaid
graph TB
    subgraph API["/api/*"]
        Notifications["/api/notifications"]
    end

    subgraph ServerActions["Server Actions"]
        RakeActions["rake.ts"]
        CoachActions["coach.ts"]
        SectionActions["section-*.ts"]
        BulkActions["bulk.ts"]
        AdminActions["admin-*.ts"]
    end

    subgraph Queries["Data Queries"]
        DashboardQueries["dashboard.ts"]
        CoachQueries["coach.ts"]
        SectionQueries["section-*.ts"]
        ReportQueries["reports.ts"]
    end

    API --> ServerActions
    ServerActions --> Queries
    Queries --> Supabase
```

---

## Component Hierarchy

```mermaid
graph TB
    subgraph Layout
        RootLayout["Root Layout"]
        AuthLayout["(auth) Layout"]
        DashboardLayout["(dashboard) Layout"]
    end

    subgraph Shared
        UIShell["UI Shell"]
        Sidebar["Sidebar Navigation"]
        Header["Header"]
    end

    subgraph Pages
        DashboardPage["Dashboard Page"]
        RakesPage["Rakes Page"]
        RakeDetailPage["Rake Detail Page"]
        CoachDetailPage["Coach Detail Page"]
        SectionPage["Section Detail Page"]
    end

    RootLayout --> AuthLayout
    RootLayout --> DashboardLayout
    DashboardLayout --> UIShell
    UIShell --> Sidebar
    UIShell --> Header

    DashboardPage --> UIShell
    RakesPage --> UIShell
    RakeDetailPage --> UIShell
    CoachDetailPage --> UIShell
    SectionPage --> UIShell
```

---

## Key Features Flow

### Job Card Generation

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Actions
    participant Query
    participant PDF
    participant DB

    User->>UI: Select Coach
    UI->>Actions: Generate Job Card
    Actions->>Query: Fetch Section Data
    Query->>DB: Get Work Items
    Query->>DB: Get Must-Change Items
    Query->>DB: Get Test Results
    DB-->>Query: Return Data
    Query-->>Actions: Return Section Data
    Actions->>Actions: Aggregate Sections
    Actions->>PDF: Create PDF Document
    PDF-->>Actions: Return PDF Blob
    Actions-->>UI: Return Job Card
    UI-->>User: Download PDF
```

---

## Security Model

```mermaid
flowchart TB
    subgraph Security["Security Layers"]
        SSL[SSL/TLS Encryption]
        Auth[Authentication]
        RLS[Row Level Security]
        RBAC[Role Based Access]
    end

    subgraph RLS_Policies["RLS Policies"]
        ShedFilter["Filter by Shed"]
        SectionFilter["Filter by Section"]
        UserFilter["Filter by User"]
    end

    SSL --> Auth
    Auth --> RBAC
    Auth --> RLS
    RLS --> ShedFilter
    RLS --> SectionFilter
    RLS --> UserFilter
    RBAC --> Admin[Admin: Full Access]
    RBAC --> SSE[Section Engineer: CRUD]
    RBAC --> JE[Junior Engineer: Update]
    RBAC --> Tech[Technician: View]
```

---

## Deployment Architecture

```mermaid
flowchart LR
    subgraph Dev["Development"]
        Local[Local Dev Server]
        HMR[HMR Enabled]
    end

    subgraph Build["Build Process"]
        TypeCheck[TypeScript Check]
        Lint[ESLint]
        Build[Next.js Build]
        Optimize[Asset Optimization]
    end

    subgraph Deploy["Deployment"]
        Vercel[Vercel Edge]
        CDN[Global CDN]
        Edge[Edge Functions]
    end

    Local --> TypeCheck
    TypeCheck --> Lint
    Lint --> Build
    Build --> Optimize
    Optimize --> Vercel
    Vercel --> CDN
    Vercel --> Edge
```

---

## Configuration

| Aspect | Technology |
|--------|------------|
| Language | TypeScript 5 |
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 3 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Validation | Zod |
| Testing | Vitest |
| PDF Generation | jsPDF |
| Charts | Recharts |
| Icons | Lucide React |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
```

---

## Future Considerations

- Mobile app for workshop floor technicians
- Barcode/QR code scanning
- Parts inventory integration
- Automated notifications (SMS/Email)
- Predictive analytics for delay forecasting
- IoT sensor integration