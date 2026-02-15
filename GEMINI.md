# Gemini Integration: Family Organizer Hub

This document provides instructional context for Gemini regarding the architecture, integration patterns, and development conventions of the Family Organizer application.

## Project Overview
The Family Organizer Hub is a modern, responsive home dashboard built with **Next.js (App Router)** and **Material UI**. It centralizes family management by aggregating Google Calendars and Tasks from multiple accounts into a unified, touch-optimized split-screen interface.

### Core Technologies
- **Frontend**: Next.js 15+, React 19, Material UI (MUI v6), Tailwind CSS.
- **Authentication**: NextAuth.js with Google OAuth and multi-account support.
- **Database**: SQLite with Prisma ORM for session and linked account management.
- **AI Integration**: Google Multimodal Live API via the `@google/genai` SDK.

## AI Architecture
The application leverages Gemini in two primary ways:

### 1. Standard Gemini Intelligence
Located in `src/lib/gemini.ts` and exposed via `src/app/api/ai/analyze/route.ts`.
- **Model**: `gemini-1.5-pro`.
- **Purpose**: General text analysis, multimodal content processing, and structured data extraction.

### 2. Conversational Voice Agent
Located in `src/components/VoiceAgent.tsx`.
- **Model**: `models/gemini-2.5-flash-native-audio-preview-12-2025`.
- **Protocol**: Bidirectional WebSockets (Multimodal Live API).
- **Audio Specs**: 16kHz PCM Input, 24kHz PCM Output.
- **Tooling**: The agent has "hands" through Function Calling (`toolDeclarations`):
  - `add_event`, `delete_event`, `get_events`
  - `add_task`, `update_task`, `delete_task`, `get_tasks`
- **Reactivity**: Upon successful tool execution, the agent dispatches a `hub-ai-update` custom event. Components (`CalendarView`, `TodoView`) listen for this event to re-fetch data and apply visual flourishes (`.ai-updated` CSS class).

## Building and Running
### Prerequisites
- Node.js installed.
- Google Cloud Console Project with Calendar and Tasks APIs enabled.
- Google AI Studio API Key for Gemini.

### Development Commands
```bash
# Install dependencies
npm install

# Setup Database
npx prisma migrate dev

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables (.env)
Required keys:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth credentials.
- `NEXTAUTH_SECRET`: Encryption for sessions.
- `DATABASE_URL`: Prisma connection string (e.g., `file:./dev.db`).
- `GOOGLE_API_KEY`: Server-side Gemini access.
- `NEXT_PUBLIC_GOOGLE_API_KEY`: Client-side access for the Voice Agent.

## Development Conventions
- **UI Aesthetic**: Follows an "Apple aesthetic" with squircles (`borderRadius: 24px`), frosted glass backdrops (`backdropFilter: blur`), and system fonts.
- **Modals**: Use centered `Dialog` components with backdrop blurs for all secondary views.
- **Multi-Account**: Always ensure `accountId` and `taskListId` are propagated through API calls to ensure operations target the correct Google account.
- **Visual Feedback**: Use the `.ai-updated` class to trigger a purple glow animation (`ai-glow`) whenever the AI modifies data.
