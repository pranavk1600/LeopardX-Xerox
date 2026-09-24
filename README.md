# 🐆 LeopardX Xerox - Self-Service Print Kiosk System

Production-ready Self-Service Xerox / Print Kiosk software for LeopardX Technologies.

---

## 🏗️ Project Architecture

```
leopardx-xerox/
├── client/          # Mobile-First React + Vite + TypeScript Kiosk UI
├── server/          # Express + Prisma + Socket.IO Backend Server
├── print-agent/     # Local Desktop Agent (Node.js + Socket.IO + Printer Abstraction)
└── README.md
```

---

## 🛠️ Quick Setup & Installation

### 1. Database Setup (PostgreSQL + Prisma)
Ensure PostgreSQL server is running on `localhost:5432`.

```bash
# Move to server directory
cd server

# Install dependencies
npm install

# Generate Prisma Client & Run Migrations
npm run prisma:generate
npm run prisma:push

# Seed Development Machine (PUNE-COLLEGE-001)
npm run seed
```

---

### 2. Start Backend Server
```bash
cd server
npm run dev
```
*Backend server starts at `http://localhost:5000`*

---

### 3. Start Print Agent (Local PC connected to Xerox printer)
```bash
cd print-agent
npm install
npm run dev
```
*Print Agent connects via Socket.IO to backend server and authenticates machine `PUNE-COLLEGE-001`.*

---

### 4. Start Customer Frontend
```bash
cd client
npm install
npm run dev
```
*Open `http://localhost:5173/print?machine=PUNE-COLLEGE-001` in your browser or mobile viewport.*

---

## 🧪 Testing Steps

1. Open `http://localhost:5173/print?machine=PUNE-COLLEGE-001`.
2. Upload a sample `.pdf` file.
3. Verify document page count and rendered preview.
4. Select print options (Black & White vs Color, Page Range, Copies).
5. Click **PRINT DOCUMENT**.
6. Observe real-time Socket.IO log updates across Server, Print Agent, and Frontend:
   - Server receives request -> Marks job `QUEUED` -> Dispatches job to agent via Socket.IO room.
   - Print Agent receives job -> Downloads PDF binary -> Invokes Windows printer spooler (`pdf-to-printer`) -> Reports status `PRINTING` -> Reports `COMPLETED`.
   - Frontend updates live: `QUEUED` ➔ `PRINTING` ➔ `COMPLETED ✓`.
