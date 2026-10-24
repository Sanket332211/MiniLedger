# MiniLedger

A full-stack application to track money lent to friends, track due dates and overdue statuses, and view a financial summary.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, PostgreSQL (supports local/Docker Postgres or automatic in-memory fallback)
- **Frontend:** React Native (Expo SDK 52, TypeScript)
- **Validation & Testing:** Zod, Jest, Supertest

## Features

- **Authentication:** Phone number login with mock OTP (logged to the backend server terminal and returned in dev response).
- **Loan Tracking:** Add entries with friend's name, loan amount, due date, notes, and optional receipt photo.
- **Overdue Detection:** Overdue loans are automatically flagged and highlighted.
- **Repayment:** Toggle loan status between pending and repaid with instant summary update.
- **Summary Dashboard:** Displays total lent, total repaid, overdue amount, and active counts.
- **Validation & Tests:** Strict input validation with Zod and automated unit/integration tests with Jest.

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Docker (optional, for running local PostgreSQL)

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server runs on `http://localhost:4000`.

> **Database:** If a PostgreSQL instance is running, configure `DATABASE_URL` in `backend/.env` (or run `docker compose up -d`). If PostgreSQL is not running, the backend automatically uses an in-memory database (`pg-mem`) so it works out of the box without extra setup.

### 2. Frontend Setup

In a separate terminal:

```bash
cd mobile
npm install
npm run web
```

Open `http://localhost:8081` in your browser.

- To run on Android emulator: `npm run android`
- To run on mobile via Expo Go: scan the QR code displayed in the terminal.

---

## Running Tests

To run the backend integration and unit tests:

```bash
cd backend
npm test
```

---

## Demo Video

[Add your Loom or Google Drive screen recording link here]
