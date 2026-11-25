# LIFEOS — Personal Life Management Dashboard

A complete, full-stack personal life management app: finances, priorities (Covey 7 Habits),
health & fitness, study, calendar, goals and a private journal — all integrated and persisted
in MongoDB.

- **Frontend:** React + Vite (JavaScript), React Router, Tailwind CSS, Recharts, Lucide
- **Backend:** Node.js + Express (ESM)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt (user-scoped data)

---

## Project structure

```
ERP et TodoList Ikram/
├─ client/                 # React + Vite frontend
│  ├─ src/
│  │  ├─ components/        # reusable UI (Card, Modal, Tabs, …)
│  │  ├─ contexts/          # AuthContext, ToastContext
│  │  ├─ hooks/             # useCollection (CRUD + resync), useFetch
│  │  ├─ layouts/           # AppLayout (sidebar + topbar), AuthLayout
│  │  ├─ pages/             # Dashboard, Finance, Planner, Health, Study, Calendar, Goals, Journal
│  │  ├─ services/          # axios API client
│  │  └─ utils/             # constants, format, dates
│  └─ .env.example
├─ server/                 # Express + MongoDB backend
│  ├─ src/
│  │  ├─ config/            # db.js (Mongoose connection)
│  │  ├─ controllers/       # auth, finance, cycle, health, study, calendar, planner, dashboard, report
│  │  ├─ middleware/        # auth (JWT), error handling
│  │  ├─ models/            # all Mongoose schemas
│  │  ├─ routes/            # REST routes mounted under /api
│  │  └─ utils/             # crud factory, dates, token
│  ├─ scripts/smoke-test.js # end-to-end API test
│  └─ .env.example
└─ README.md
```

---

## Prerequisites

- **Node.js** 18+ (uses the built-in `fetch` in the smoke test)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`

### Start MongoDB

Use any local MongoDB you have. For example, with a standalone `mongod` binary:

```powershell
# create a data folder inside the project (persists across restarts)
mkdir server\.mongo-data -Force

# run mongod pointing at that data folder
.\mongodb\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe --dbpath ".\server\.mongo-data" --port 27017
```

Or, if MongoDB Community Server is installed as a Windows service, make sure the service
`MongoDB` is running (`services.msc`). The default connection string is
`mongodb://127.0.0.1:27017/lifeos`.

---

## Configuration

Copy the example env files and adjust if needed.

**server/.env**

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lifeos
JWT_SECRET=change-this-to-a-long-random-secret-string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

**client/.env**

```
VITE_API_URL=http://localhost:5000/api
```

---

## Install & run

### 1. Backend

```powershell
cd server
npm install
npm run dev        # or: npm start
# → API on http://localhost:5000/api  (health: /api/health)
```

### 2. Frontend

```powershell
cd client
npm install
npm run dev
# → app on http://localhost:5173
```

Open http://localhost:5173, register an account and start using LIFEOS.

---

## Verifying persistence & correctness

With both servers running, execute the end-to-end API test (it registers a fresh user,
creates records across every module, then re-logs in and re-reads the data):

```powershell
cd server
npm run smoke
```

Expected output ends with something like `NN passed, 0 failed`.

---

## How the modules integrate

- **Academic deadlines** appear automatically in the Calendar via a read-time merge in
  `GET /api/calendar/agenda` (`acad:<id>` vs `evt:<id>`) — records are never duplicated.
- **Balances** are always recomputed on the server from stored records:
  `balance = initialBalance + Σincome − Σexpense − ΣsavingsDeposit + ΣsavingsWithdrawal`,
  and `piggyBalance = Σdeposit − Σwithdrawal`. Piggy deposits are internal transfers, not expenses.
- **Dashboard**, **Study stats**, **Water summary**, **Finance summary** and the **monthly report**
  are all derived from the database — never hardcoded.
- **Cycle tracking** offers approximate, optional energy suggestions. It is private to the user,
  can be manually corrected or disabled, and is explicitly *not* medical advice.

---

## Test scenario (manual)

1. Register and log in.
2. Add income, expenses and savings (set a starting balance).
3. Create weekly tasks (life role + Covey quadrant).
4. Record menstrual cycle information.
5. Add meals and water consumption.
6. Record measurements (BMI) and exercises.
7. Create study sessions and academic deadlines.
8. Add calendar events, goals and journal entries.
9. Close the browser completely (and optionally restart MongoDB).
10. Reopen the app and log in again.
11. Verify all data is still present and balances/statistics are correct.

Because every write goes through the Express API to MongoDB, all data survives browser and
machine restarts. `localStorage` is used only for the auth token and display preferences.
