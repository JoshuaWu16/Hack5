# HVAC Margin Rescue AI Agent

An autonomous financial analyst agent built for the Pulse AI NYC Hackathon. The agent scans your HVAC construction portfolio, identifies projects with margin erosion, autonomously investigates the root causes (e.g. labor overruns, unapproved change orders, field issues), and delivers actionable summaries.

## How it Works
This project implements an autonomous loop (up to 5 steps) where the agent can chain tools together without human intervention. When asked **"How's my portfolio doing?"**, the agent will:
1. Scan the base **Contracts**, **SOVs**, and actual costs (**Labor + Materials**) using `analyzePortfolio`.
2. Find struggling projects automatically.
3. Drill down into root causes using `analyzeProjectLabor` and `analyzeProjectChanges`.
4. Read recent `field_notes` to add real-world context using `getFieldNotesSummary`.
5. Offer to send an email report using `sendEmailAlert`.

## Technology Stack
- **Next.js 15 (App Router)**: Framework for the UI and API routes.
- **Vercel AI SDK**: Core agent orchestration with `useChat` and `streamText`.
- **shadcn/ui**: Modern, minimal UI components.
- **PapaParse**: In-memory data layer reading the `hvac_construction_dataset` CSV files.
- **Granola Protocol**: Strict system prompting that guarantees autonomous reasoning.

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the `.env.example` file and add your OpenAI API Key:
   ```bash
   cp .env.example .env.local
   ```
   Add: `OPENAI_API_KEY=your_key_here`

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and type *"How's my portfolio doing?"*

## Screenshots / Agent UI
The UI clearly renders when the agent starts *reasoning* and decides to call a tool, showing you its thought process in real-time. Action results are streamed back.
