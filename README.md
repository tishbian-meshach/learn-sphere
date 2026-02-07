# LearnSphere - eLearning Platform

A production-grade eLearning platform built with Next.js, TypeScript, Prisma, and Supabase.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env.local` with your Supabase database password:

```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.fzjdrzihvveowdimbbks.supabase.co:5432/postgres"
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed demo data
npm run db:seed
```

### 4. Setup Supabase Storage

Create the following public buckets in your Supabase dashboard:

- `course-images`
- `lesson-documents`
- `lesson-attachments`

### 5. Setup Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Disable email confirmations for demo (Settings → Auth → Confirm email = OFF)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Accounts

| Role       | Email                      | Password      |
| ---------- | -------------------------- | ------------- |
| Admin      | admin@learnsphere.com      | admin123      |
| Instructor | instructor@learnsphere.com | instructor123 |
| Learner    | learner@learnsphere.com    | learner123    |

> **Note:** Create these accounts manually in Supabase Auth dashboard or via the sign-up page.

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/
│   │   ├── admin/       # Admin backoffice
│   │   └── learner/     # Learner portal
│   ├── api/             # API routes
│   └── learn/           # Full-screen lesson player
├── components/
│   ├── ui/              # Reusable UI components
│   ├── admin/           # Admin-specific components
│   └── learner/         # Learner-specific components
├── hooks/               # Custom React hooks
└── lib/                 # Utilities and clients
```

## ✨ Features

### Admin/Instructor

- ✅ Courses dashboard (Kanban + List views)
- ✅ Course creation and editing
- ✅ Lesson management (Video, Document, Image, Quiz)
- ✅ Quiz builder with questions and options
- ✅ Reporting dashboard with learner progress

### Learner

- ✅ Browse published courses
- ✅ My Courses dashboard with progress
- ✅ Full-screen lesson player
- ✅ Quiz flow with attempt-based scoring
- ✅ Points and badge progression

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
