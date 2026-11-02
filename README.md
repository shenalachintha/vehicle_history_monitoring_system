# FleetGuard Pro

FleetGuard Pro is a web-based fleet management system for recording vehicle history, monitoring maintenance, tracking mileage, managing documents, and handling operational alerts.

## Features

- Vehicle profiles and fleet status management
- Vehicle service and maintenance history
- Date- and mileage-based maintenance rules
- Mileage recording and verification
- Document and expiry tracking
- Maintenance and compliance alerts
- Fleet dashboard and reporting
- Role-based access control
- JWT-based authentication
- Responsive React user interface

## Technology

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Leaflet

### Backend

- Node.js
- Express
- Prisma ORM
- MySQL
- JWT
- Zod validation
- Helmet and CORS

## Project structure

```text
vehicle_history_monitoring_system/
├── client/                 # React frontend
│   ├── public/
│   └── src/
├── server/                 # Express backend
│   ├── api/                # Vercel API entrypoint
│   ├── prisma/             # Database schema and seed script
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── app.js
│   └── test/
└── package.json
```

## Requirements

- Node.js 18 or newer
- npm
- MySQL 8 or a compatible MySQL database

## Installation

Install dependencies from the project root:

```bash
npm install
```

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

Generate the Prisma client and prepare the database:

```bash
npm run prisma:generate --workspace=server
npm run prisma:push --workspace=server
```

To load the sample fleet data:

```bash
npm run prisma:seed --workspace=server
```

## Running locally

Start the backend:

```bash
npm run dev:server
```

Start the frontend in a second terminal:

```bash
npm run dev:client
```

The default local URLs are:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`

For local frontend-to-backend requests, create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Testing

Run the backend test suite:

```bash
npm test --workspace=server
```

## Deployment

The recommended deployment uses separate Vercel projects for the frontend and backend, with a managed MySQL database.

See [HOSTING_PLAN.md](HOSTING_PLAN.md) for the complete hosting, environment-variable, database, security, and production rollout instructions.

## Security notes

- Never commit `.env` files or production credentials.
- Use a unique, high-entropy `JWT_SECRET` in every production environment.
- Change the seeded administrator password before production use.
- Configure CORS with the exact production frontend URL.
- Use a managed object-storage service for production document uploads.

## License

This project is maintained as a private application unless a separate license is provided.
