# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tražim-Radnike.online** is a discrete, privacy-first platform for employers in the Balkans region (Serbia, Montenegro, Croatia, Bosnia, Macedonia, Bulgaria, Romania) who need help with worker recruitment documentation and procedures.

## ⚠️ CRITICAL: Business Model Clarification

**WE ARE A CONSULTING AGENCY, NOT AN EMPLOYMENT AGENCY.**

We do NOT have a license for employment/recruitment. We legally CANNOT:
- ❌ "Find workers" for clients
- ❌ "Send candidate proposals"
- ❌ Act as intermediary between workers and employers
- ❌ Employ or recruit workers on behalf of clients

**What we actually do:**
- ✅ **Documentation consulting** - Help clients prepare proper documentation for hiring workers
- ✅ **Procedure guidance** - Advise on legal procedures for international hiring
- ✅ **Form assistance** - Help fill out and verify required forms
- ✅ **Lead generation** - Use the platform to attract clients who are looking for workers

**Revenue Model:**
- Free platform registration attracts employers who need workers
- These employers become consulting clients
- We provide paid consulting services for documentation/procedures

**Current Status:** Phase 1 (Foundation) completed. Implementing Phase 2 (Authentication).

## Key Services (for sales copy reference)

1. **Priprema dokumentacije** - Help prepare all required hiring documents
2. **Provera ispravnosti** - Verify document completeness and accuracy
3. **Konsultacije** - Expert guidance on procedures
4. **Asistencija** - Ongoing support throughout the process

## Technology Stack (Implemented)

- **Frontend:** Next.js 14 + TailwindCSS + Radix UI
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **File Storage:** S3-compatible (MinIO dev / AWS S3 prod)
- **Authentication:** JWT + Email verification + Phone verification
- **AI Chatbot:** Claude 4.5 Haiku (`claude-haiku-4-5-20251001`)
- **Hosting:** Vercel (frontend) + Render (backend)

## Key Architecture Concepts

### Three-Tier Visibility Model
1. **Private** - Dashboard only (employer + admin)
2. **Secret Link** - Full access via cryptographic token (`?rf=<secret>`)
3. **Public Limited** - Basic info only, CTA to register

### AI Chatbot Flow
The chatbot helps clients describe their worker needs (for consulting purposes). Collects:
1. Job title/position needed
2. Number of workers needed
3. Expected salary range (EUR/month)
4. Work location
5. Work hours/shifts
6. Housing availability (yes/no + description)
7. Required experience
8. Communication languages needed
9. Photos (3 workplace + 2 housing if available)
10. Privacy consent (GDPR)

**Note:** This information is used to prepare proper documentation, NOT to recruit workers.

**Claude API Settings:**
- Model: `claude-haiku-4-5-20251001`
- Max tokens: 800
- Temperature: 0.0 (deterministic)

### Security Requirements
- All private/secret URLs must be non-indexed (robots.txt, meta noindex)
- TLS encryption in transit, AES at rest
- Secret tokens: minimum 128-bit, cryptographically random
- Block sensitive data in chatbot (passports, IDs, payment info)
- Audit logging for all data access

## Planned Project Structure

```
frontend/
├── pages/           # Next.js pages (index, auth, dashboard, jobs)
├── components/      # React components (ChatWidget, JobForm, AdminPanel)
└── lib/             # Utilities (api client, auth, validators)

backend/
├── src/
│   ├── routes/      # API endpoints (auth, jobs, chat, uploads, admin)
│   ├── models/      # Database models (User, Company, Job, Message)
│   ├── services/    # Business logic (AuthService, JobService, ChatService)
│   ├── middleware/  # Auth, validation, error handling
│   ├── llm/         # Claude integration (client, prompts, validators)
│   └── config/      # Database, storage, env configuration
└── tests/           # Unit, integration, E2E tests
```

## Key API Endpoints

```
# Authentication
POST /api/auth/signup              # Register with phone verification
POST /api/auth/oauth               # OAuth callback

# Employer Profile
GET  /api/profile                  # Get employer profile
PUT  /api/profile                  # Update employer profile

# Jobs
POST /api/jobs                     # Create job posting
GET  /api/jobs/:id                 # Get job (with visibility control)
GET  /api/jobs/public/:slug        # Public limited view
POST /api/jobs/:id/generate-secret # Create secret link

# Chat System
POST /api/chat/:jobId/message      # Chat message (employer <-> admin)
GET  /api/chat/:jobId/history      # Get conversation history
POST /api/chat/ai/message          # AI agent chatbot (job creation assistant)

# Files
POST /api/uploads                  # Upload files

# Admin
GET  /api/admin/jobs               # Admin job list
GET  /api/admin/chats              # All active conversations
```

## Database Schema (Core Tables)

- `users` - id, email, phone, phone_verified, role, gdpr_consent
- `companies` - id, user_id, name, country, is_public_profile
- `jobs` - id, company_id, title, slug, description_full, description_public, visibility, secret_token
- `uploads` - id, job_id, file_type, s3_url, uploaded_by
- `messages` - id, job_id, from_user_id, content, is_from_claude
- `audit_logs` - id, user_id, action, target_type, target_id, ip_address

## Development Commands (Once Implemented)

```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run test         # Run tests

# Backend
npm run dev          # Development with hot reload
npm run migrate      # Database migrations
npm run test         # Run test suite

# Docker
docker-compose up    # Full stack with PostgreSQL
```

## Critical Implementation Notes

1. **Privacy is the key differentiator** - Focus on visibility controls and secret link logic
2. **Chatbot asks one question at a time** - Never present a checklist in single message
3. **Phone verification is mandatory** for employers before creating job posts
4. **All secret links must be tested** to ensure they're not indexed and public view doesn't leak data
5. **File uploads must reject** executable files (.exe, .dll, .sh, etc.)
6. **GDPR checkbox required** - Block job creation without consent

## Chatbot System Prompt

```
You are a documentation consultant assistant for Tražim-Radnike.online.
We are a CONSULTING agency (NOT an employment agency). We help employers
prepare proper documentation for hiring workers - we do NOT find or
recruit workers ourselves.

Use a professional, concise, and reassuring tone. Guide the client
through describing their worker needs so we can prepare appropriate
documentation. Collect necessary fields, request photos of
workplace/housing if available, and confirm privacy options.

NEVER say we will "find workers" or "send candidates" - we provide
documentation and procedure consulting only.

Ask one question at a time. Validate required fields.
```

## Test Scenarios

- User registration with phone verification (3 test users)
- Complete chatbot flow with all validations
- Private job only visible to owner + admin
- Secret link shows full content; public shows limited
- Secret token reset invalidates old links
- File upload rejects malicious files
- GDPR consent enforcement
