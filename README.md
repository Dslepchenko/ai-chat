# AI Chat

A full-stack ChatGPT-like chatbot built with Next.js, Supabase, and OpenAI. Stream AI responses, manage conversations, upload documents, and sync across tabs in real time.

---

## Features

- **Streaming AI responses** — token-by-token output via OpenAI GPT-4o mini
- **Conversation history** — chats and messages persisted in Supabase Postgres
- **Authentication** — sign up / log in via Supabase Auth
- **Anonymous access** — 3 free messages before sign-up is required
- **Image support** — paste or attach images directly in the chat
- **Document upload** — attach PDF or TXT files; content is injected into AI context
- **Real-time sync** — new chats appear across browser tabs via Supabase Realtime
- **Markdown rendering** — rich formatting with syntax-highlighted code blocks
- **Dark / light mode** — system-aware theme toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TanStack Query v5 |
| UI | Shadcn/ui, Tailwind CSS v4 |
| Backend | Next.js API Routes (REST) |
| Database | Supabase Postgres (service role — no RLS) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (public client) |
| AI | OpenAI GPT-4o mini via Vercel AI SDK |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/          # App layout + chat pages
│   ├── (auth)/         # Login / register pages
│   └── api/            # REST API routes
├── components/
│   ├── chat/           # Chat UI components
│   └── ui/             # Shadcn base components
├── hooks/              # TanStack Query hooks
└── lib/
    ├── ai/             # AI model config
    ├── api/            # Typed API client (frontend only)
    ├── supabase/       # Supabase server + realtime clients
    └── constants.ts    # All magic values / config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key with billing enabled

### 1. Clone and install

```bash
git clone https://github.com/your-username/ai-chat.git
cd ai-chat
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`.

### 3. Set up the database

Run this SQL in your Supabase project (**SQL Editor → New query**):

```sql
create table chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  images text[],
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  filename text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Enable Realtime for cross-tab sync
alter publication supabase_realtime add table chats;
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description | Where to find |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (Realtime only) | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (**server-side only**) | Supabase → Settings → API |
| `OPENAI_API_KEY` | OpenAI API key | platform.openai.com → API keys |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auth/me` | Optional | Get current user |
| `POST` | `/api/auth/login` | — | Sign in |
| `POST` | `/api/auth/register` | — | Sign up |
| `POST` | `/api/auth/logout` | Required | Sign out |
| `GET` | `/api/chats` | Optional | List chats |
| `POST` | `/api/chats` | Optional | Create chat |
| `GET` | `/api/chats/:id` | Optional | Get single chat |
| `DELETE` | `/api/chats/:id` | Required | Delete chat |
| `GET` | `/api/chats/:id/messages` | Optional | List messages |
| `POST` | `/api/chats/:id/messages` | Optional* | Send message + stream AI response |
| `POST` | `/api/documents` | Optional | Upload document (PDF/TXT) |
| `GET` | `/api/documents?chat_id=` | Optional | List documents for chat |

*Anonymous users are limited to 3 messages total (enforced server-side).

---

## Deployment

### Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Click **Deploy**
