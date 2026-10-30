# FleetGuard Pro: Company Fleet Vehicle History, Maintenance & Monitoring System

An enterprise-grade, preventive maintenance management and fleet monitoring web application designed for companies operating vehicle fleets. The system provides complete vehicle profile lifecycle tracking, dual-criteria maintenance forecasting (`Date OR Mileage`, `Date AND Mileage`), weekly odometer verification, automatic compliance alerting, and interactive analytics.

---

## 1. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------------+
|                                    FleetGuard Web Client                                |
|    (React 18 + Vite + Tailwind CSS + TanStack Query + React Hook Form + Recharts + Map) |
+-----------------------------------------------------------------------------------------+
                                             |  HTTPS (REST + JWT)
                                             v
+-----------------------------------------------------------------------------------------+
|                               Express.js REST API Server                                |
|    (ES Modules, Zod Validation, RBAC Middleware, Winston Logger, Swagger / OpenAPI)    |
|                                                                                         |
|  +---------------------+   +-----------------------+   +-----------------------------+  |
|  | Maintenance Engine  |   | Mileage Audit Engine  |   | Alert & Notification Engine |  |
|  +---------------------+   +-----------------------+   +-----------------------------+  |
|                                            |                                            |
|                                    Prisma ORM Client                                    |
+-----------------------------------------------------------------------------------------+
                                             |  TCP (SSL / TLS)
                                             v
+-----------------------------------------------------------------------------------------+
|                                  Managed MySQL Database                                 |
|        (Relational Constraints, Foreign Keys, Decimal Precision, Versioned Migrations)  |
+-----------------------------------------------------------------------------------------+
```

### Confirmed Technology Stack
- **Frontend**: React.js with Vite, Tailwind CSS, React Router, Axios, TanStack Query, Recharts, React Hook Form, Zod, Leaflet / React-Leaflet, Lucide React.
- **Backend**: Node.js + Express.js (ES modules), RESTful API, Prisma ORM, Zod, bcryptjs, jsonwebtoken, node-cron, Multer, Helmet, Morgan.
- **Database**: MySQL (Hosted on Aiven, PlanetScale, or self-hosted) with relational foreign keys, indexes, and decimal precision for monetary figures.

---

## 2. Directory Structure

```
vehicle_history_monitoring_system/
├── client/                     # React + Vite Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios API client with JWT interceptor
│   │   ├── components/
│   │   │   ├── dashboard/      # MetricCards, StatusDonut, TrendsBar, FleetMap, RecentVehicles, Activity
│   │   │   └── layout/         # Sleek dark navy Sidebar, Navbar with global search
│   │   ├── context/            # AuthContext (JWT session, RBAC)
│   │   ├── pages/              # Dashboard, Vehicles, VehicleDetails, ServiceHistory, Maintenance, Mileage, Documents, Alerts, Reports, Login
│   │   ├── App.jsx             # React Router with Protected Route guards
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Node.js + Express REST API Backend
│   ├── prisma/
│   │   ├── schema.prisma       # MySQL Prisma schema definition
│   │   └── seed.js             # Comprehensive fleet seed data
│   ├── src/
│   │   ├── config/             # Environment variables
│   │   ├── controllers/        # Express handlers (Vehicle, Event, Maintenance, Mileage, Alert, Report, Auth)
│   │   ├── cron/               # Scheduled daily maintenance & weekly mileage audit jobs
│   │   ├── middleware/         # JWT Auth, RBAC permissions, error handling, Zod validation
│   │   ├── routes/             # Modular Express routers
│   │   ├── services/           # MaintenanceService, AlertService, MileageService
│   │   ├── app.js              # Express app setup
│   │   ├── prisma.js           # Prisma client singleton
│   │   └── server.js           # Server entrypoint
│   ├── test/                   # Vitest unit test suites
│   ├── package.json
│   └── .env.example
├── package.json                # Monorepo workspace configuration
└── README.md
```

---

## 3. Environment Variables

Create `.env` inside `server/` with your database credentials:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database>?sslaccept=strict"
JWT_SECRET="fleetguard_super_secure_jwt_secret_key_2025_prod_ready"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
```

---

## 4. Local Installation & Development

### 1. Install Monorepo Dependencies
From the project root:
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate --workspace=server
```

### 3. Apply MySQL Migrations & Seed Data
```bash
# Push schema to MySQL instance
npm run prisma:push --workspace=server

# Seed realistic company fleet dataset (48 vehicles, rules, services, documents)
npm run prisma:seed --workspace=server
```

### 4. Start Development Servers
In separate terminals:
```bash
# Start backend API (http://localhost:5000)
npm run dev:server

# Start frontend application (http://localhost:3000)
npm run dev:client
```

---

## 5. Pre-Configured Demo Account

| Role | Email | Password | Full Name |
|---|---|---|---|
| **System Administrator** | `admin@eltoro.lk` | `admin123` | El-Toro Administrator |

This account is created by the seed command. Run the seed command against the target database before trying these credentials.

---

## 6. Automated Testing

Run the maintenance scheduling and mileage validation test suite:
```bash
npm test --workspace=server
```

The test suite validates:
- Next due date and mileage calculation for `DATE_OR_MILEAGE` and `DATE_AND_MILEAGE` rules.
- Warning window status evaluation (`UPCOMING` within 500 km or 30 days).
- Overdue threshold escalation (`OVERDUE` and `CRITICAL`).
- Dual-condition requirements (date alone does not trigger overdue when mileage has not yet reached target).

---

## 7. Deployment Instructions

### Frontend Deployment: Vercel
1. Link your GitHub repository to **Vercel**.
2. Set **Root Directory** to `client`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-api.onrender.com/api`

### Backend API Deployment: Render
1. Create a **Web Service** on **Render**.
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install && npx prisma generate`
4. Set **Start Command**: `node src/server.js`
5. Configure Environment Variables in Render Dashboard:
   - `DATABASE_URL`: Your Aiven MySQL SSL connection string
   - `JWT_SECRET`: High-entropy 64-char string
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-vercel-app.vercel.app`

### Database Deployment: Aiven for MySQL
1. Provision a managed **MySQL** service on **Aiven**.
2. Copy the Service URI (includes SSL credentials `?ssl-mode=REQUIRED`).
3. Run `npm run prisma:push --workspace=server` pointing to the Aiven URI.
4. Set automated daily backups in the Aiven console. Point-in-time recovery (PITR) is natively supported by Aiven.
