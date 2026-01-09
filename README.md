# Admin Basis - Production Management System

## 📌 Project Overview

**Admin Basis** is a comprehensive admin panel for managing production data. It allows administrators to manage users, production lines, machines, parts, shifts, and quality control criteria.

The system is built using:
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth v5
- **UI**: Tailwind CSS & shadcn/ui

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your server or local machine:
- **Node.js** (v18 or later recommended)
- **PostgreSQL** (Database server)
- **Git** (for version control)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd admin-basis
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory. You can copy the example if available or use the following template:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/admin_basis?schema=public"

# NextAuth Configuration
AUTH_SECRET="your-super-secret-key-generate-one-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000" # Change to your domain in production

# Other settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🗄️ Database Setup

This project uses **Prisma** for database management.

### Initial Setup & Migrations

To set up the database schema:

**For Development:**
```bash
# Applies migrations and updates the client
npx prisma migrate dev
```

**For Production:**
```bash
# Applies pending migrations to the database
npx prisma migrate deploy
```

### Seeding Data

To populate the database with initial master data (default users, roles, etc.):

```bash
npx prisma db seed
```

---

## 🛠️ Development

To start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building for Production (Standalone)

This project is configured to build as a **standalone** application, which significantly reduces the size of the deployment by only including necessary files.

### 1. Build the Application

Run the build command:

```bash
npm run build
```

This will generate a `.next` folder containing the build artifacts.

### 2. Deploying the Standalone Build

The standalone build is located at `.next/standalone`.

To run the application in production, you need to:

1.  **Copy the standalone folder** to your deployment location (or keep it where it is).
2.  **Copy static assets**:
    *   Copy `.next/static` folder to `.next/standalone/.next/static`
    *   Copy `public` folder to `.next/standalone/public`

**Directory Structure for Deployment:**
```
/deploy-folder
  ├── .next/
  │    └── static/      <-- Copied from .next/static
  ├── public/           <-- Copied from public
  ├── server.js         <-- Entry point (inside .next/standalone)
  └── package.json
```

### 3. Running the Server

Navigate to the standalone directory and run the server using Node.js:

```bash
# If you are in the root of the project after build and copy:
node .next/standalone/server.js
```

The application will start (usually on port 3000). You can configure the port using the `PORT` environment variable:

```bash
PORT=8080 node .next/standalone/server.js
```

---

## 📂 Project Structure Overview

For maintenance purposes, here is where key files are located:

- **`prisma/schema.prisma`**: Database schema definition. Modify this to change the database structure.
- **`src/app`**: The application pages and API routes.
- **`src/components`**: UI components.
- **`src/server`**: Backend logic, database queries, and services.
- **`src/lib/db.ts`**: Database connection instance.
- **`public`**: Static assets like images and fonts.

---

## 🔄 Maintenance

### Updating the Database

If you modify `prisma/schema.prisma`:

1.  **Generate Migration**: `npx prisma migrate dev --name describe_changes`
2.  **Apply to Production**: `npx prisma migrate deploy`

### Troubleshooting

- **Database Connection Errors**: Check `DATABASE_URL` in `.env`.
- **Build Errors**: Ensure all types are correct and run `npm run lint`.
