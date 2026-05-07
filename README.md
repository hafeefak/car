# CarSync CRM

CarSync is now a split-stack CRM for used-car dealers:

- `frontend/`: React + Vite client
- `backend/`: Spring Boot API

## What The New Stack Keeps

- Dealer dashboard
- Lead create, edit, and delete
- Inventory create, edit, and delete
- Follow-up tracking
- Lead-linked booking creation and bookings view
- Login and registration
- Demo data for first-run experience

## Current Sales Flow

The backend now supports this business flow:

`Lead -> Follow-up(s) -> Booking`

What that means in the current implementation:

- A lead belongs to a customer inside a tenant
- A follow-up can be attached directly to a lead
- Creating a lead can also create its first follow-up if follow-up details are provided
- A booking is created from a specific lead and a specific vehicle
- Each lead can have at most one booking
- When a booking is created, the linked lead is marked as `WON`
- When a booking is created, the linked vehicle is marked as `RESERVED`

Schema and service references:

- [V1__init_schema.sql](</C:/SHANID/business project/carSync/carsync-app/backend/src/main/resources/db/migration/V1__init_schema.sql>)
- [V2__lead_lifecycle_and_booking_updates.sql](</C:/SHANID/business project/carSync/carsync-app/backend/src/main/resources/db/migration/V2__lead_lifecycle_and_booking_updates.sql>)
- [CrmService.java](</C:/SHANID/business project/carSync/carsync-app/backend/src/main/java/com/carsync/backend/service/CrmService.java>)

## Multi-Tenant Approach

The new backend uses a shared-database, shared-schema multi-tenant model:

- Every business row carries a `tenant_id`
- Each registered dealership creates its own tenant workspace
- JWT auth includes both `userId` and `tenantId`
- All CRM queries are filtered by tenant to isolate dealer data
- Flyway manages schema creation through versioned SQL migrations

## Project Structure

```text
carsync-app/
  backend/   Spring Boot API
  frontend/  React app
```

## App URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Bring Up Each Service

Start PostgreSQL:

```powershell
cd "C:\SHANID\business project\carSync\carsync-app\backend"
docker compose up -d
```

Start backend API:

```powershell
cd "C:\SHANID\business project\carSync\carsync-app\backend"
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=UTC"
mvn spring-boot:run
```

Start frontend UI:

```powershell
cd "C:\SHANID\business project\carSync\carsync-app\frontend"
npm install
npm run dev
```

Startup order:

1. Start PostgreSQL
2. Start backend
3. Start frontend

Quick checks after startup:

- Frontend should open at `http://localhost:5173`
- Backend should answer at `http://localhost:8080`
- `GET http://localhost:8080/api/auth/me` should return `403` before login

## Run The Backend

```powershell
cd "C:\SHANID\business project\carSync\carsync-app\backend"
docker compose up -d
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=UTC"
mvn spring-boot:run
```

Backend URL:

- `http://localhost:8080`

Useful backend commands:

```powershell
docker compose up -d
docker compose down
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=UTC"
mvn test
mvn spring-boot:run
```

## PostgreSQL Setup

The backend now uses PostgreSQL instead of H2.

- Database name: `carsync_crm`
- Default username: `postgres`
- Default password: `postgres`
- Host port: `5433`
- Container port: `5432`
- Default connection URL: `jdbc:postgresql://localhost:5433/carsync_crm`

These defaults are provided through:

- [application.properties](</C:/SHANID/business project/carSync/carsync-app/backend/src/main/resources/application.properties>)
- [docker-compose.yml](</C:/SHANID/business project/carSync/carsync-app/backend/docker-compose.yml>)

You can override them with:

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5433/carsync_crm"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="postgres"
```

## Timezone Note

On this machine, PostgreSQL rejected the local JVM timezone value `Asia/Calcutta`.
To avoid that startup failure, run the backend with:

```powershell
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=UTC"
```

That is the startup path that was verified successfully.

## Flyway Migrations

Schema migrations live here:

- [V1__init_schema.sql](</C:/SHANID/business project/carSync/carsync-app/backend/src/main/resources/db/migration/V1__init_schema.sql>)
- [V2__lead_lifecycle_and_booking_updates.sql](</C:/SHANID/business project/carSync/carsync-app/backend/src/main/resources/db/migration/V2__lead_lifecycle_and_booking_updates.sql>)

Flyway runs automatically on backend startup before the app begins serving requests.

## Backend API

Base URL:

- `http://localhost:8080`

Auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

CRM read endpoints:

- `GET /api/crm/snapshot`
- `GET /api/leads`
- `GET /api/vehicles`
- `GET /api/follow-ups`
- `GET /api/bookings`

CRM write endpoints:

- `POST /api/leads`
- `PUT /api/leads/{leadId}`
- `DELETE /api/leads/{leadId}`
- `POST /api/vehicles`
- `PUT /api/vehicles/{vehicleId}`
- `DELETE /api/vehicles/{vehicleId}`
- `POST /api/bookings`

Flow-specific notes:

- `POST /api/leads` can create the lead and its first follow-up when `followUpTitle` and `dueAt` are included
- `POST /api/bookings` creates a booking from a specific lead and vehicle
- `POST /api/bookings` closes the linked lead as `WON`
- `POST /api/bookings` updates the linked vehicle status to `RESERVED`

## Run The Frontend

```powershell
cd "C:\SHANID\business project\carSync\carsync-app\frontend"
npm install
npm run dev
```

Frontend default URL:

- `http://localhost:5173`

Useful frontend commands:

```powershell
npm run dev
npm run build
```

## Stop Services

Stop frontend:

- Stop the terminal running `npm run dev`, or close that process

Stop backend:

- Stop the terminal running `mvn spring-boot:run`, or close that process

Stop PostgreSQL:

```powershell
cd "C:\SHANID\business project\carSync\carsync-app\backend"
docker compose down
```

## Demo Login

Use the seeded demo account:

- Email: `admin@carsync.local`
- Password: `password123`

Or register a new dealership tenant from the React app.

Demo seed note:

- New bookings created through the updated UI are lead-linked
- Existing seeded bookings in an older local database may not yet carry `lead_id` until the database is refreshed or reseeded

## Customer Pitch

CarSync helps used-car dealers turn scattered lead handling into a clear sales workflow.

Why it matters:

- Capture every lead in one place
- Schedule follow-ups before prospects go cold
- Track stock and customer interest together
- Convert active leads into bookings with a clear audit trail
- Give small dealership teams a simple daily operating system

Short pitch:

CarSync is a lightweight CRM built for used-car dealerships. It helps your team manage leads, follow-ups, inventory, and bookings in one place so fewer prospects slip through the cracks and more conversations turn into closed deals.

Who it is for:

- Used-car dealers
- Small multi-agent dealership teams
- Dealers still managing leads in WhatsApp, notebooks, or spreadsheets

Suggested outreach message:

Hi, we built CarSync for used-car dealerships that want a simpler way to manage leads, follow-ups, inventory, and bookings. If your team is currently juggling calls, WhatsApp chats, and spreadsheets, CarSync can help you organize the full sales journey from first inquiry to confirmed booking. We would love to show you a quick demo and get your feedback.

## Verification Status

These checks were completed after the migration:

- `backend`: `mvn test`
- `frontend`: `npm run build`

## Verified Live Startup

The stack was brought up and checked with these live results:

- Frontend responded on `http://localhost:5173`
- Backend responded on `http://localhost:8080`
- PostgreSQL container was running on host port `5433`
- `GET /api/auth/me` returned `403` without auth, confirming the API was up and enforcing security
