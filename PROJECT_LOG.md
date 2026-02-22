# HVAC Margin Rescue AI Agent: Project Log

*A detailed, chronological record of every step taken to build the MVP for the Pulse AI NYC Hackathon.*

## 1. Repository Setup & Initialization
- **Cloned the Repository:** Initially cloned `JoshuaWu16-Hack5`, realized it was an empty/incorrect repo without the CSV data, deleted it, and re-cloned the correct repository (`JoshuaWu16/Hack5`) into `/Users/michaelwang/FML/Hack5_new`.
- **Verified Data:** Confirmed the presence of the 10 core CSV files representing the ~$50M HVAC construction dataset inside `hvac_construction_dataset/`.

## 2. Next.js Framework Scaffolding
- **Initialized Next.js 15:** Ran `npx create-next-app@latest` in a temporary folder (`temp-app`) with TypeScript, Tailwind CSS, ESLint, and the App Router enabled, then moved the generated files to the root directory of the repository to keep the Git history intact.
- **Installed Core Dependencies:** 
  - `ai` and `@ai-sdk/anthropic` (initially `@ai-sdk/openai`) for agent orchestration.
  - `papaparse` (and `@types/papaparse`) for in-memory CSV parsing.
  - `lucide-react`, `clsx`, `tailwind-merge`, and `recharts` for the UI.
- **Configured shadcn/ui:** Ran `npx shadcn@latest init` to set up the component library architecture, followed by adding the necessary UI primitives: `card`, `button`, `input`, `scroll-area`, `badge`, and `table`.

## 3. The Data Engine (`lib/db.ts`)
Instead of building a separate SQL database which would overcomplicate the hackathon submission, I built an in-memory data layer to parse the provided CSVs:
- **Created Interfaces:** Defined strict TypeScript interfaces (`Contract`, `SOV`, `LaborLog`, `MaterialDelivery`, `ChangeOrder`, `RFI`, `FieldNote`, `BillingHistory`, `BillingLineItem`) mapping perfectly to the provided data schema.
- **PapaParse Integration:** Wrote a universal `readCSV` function using `fs` and `papaparse` to synchronously load the CSV files into Node.js memory.
- **Caching Mechanism:** Implemented a lightweight cache (`_dataCache`) so the CSVs are only parsed once per server lifecycle, ensuring instant response times (handling ~18,000 records).
- **Helper Functions:** Created getter functions (e.g., `getContracts()`, `getLaborLogs()`) used by the AI tools.

## 4. Defining the AI Tools (`lib/tools.ts`)
Designed 5 specific tools using the Vercel AI SDK `tool()` function and `zod` for parameter validation, allowing the agent to autonomously drill into the data:
1. **`analyzePortfolio`**: Iterates through all contracts, sums up actual labor and material costs, compares it against billed amounts, and calculates the `realized_margin_pct` to flag "AT RISK" projects.
2. **`analyzeProjectLabor`**: Takes a `project_id`, groups all labor hours by `sov_line_id` (cost code), calculates the burdened cost, and flags variances against the original SOV budget.
3. **`analyzeProjectChanges`**: Takes a `project_id`, filters for pending/unapproved change orders, and tallies critical RFIs with cost/schedule impacts.
4. **`getFieldNotesSummary`**: Fetches the 10 most recent unstructured daily reports for a project to provide the LLM with real-world context (weather, issues, delays).
5. **`sendEmailAlert`**: A mock action tool that allows the agent to finalize its loop by drafting a summary report to a stakeholder (e.g., the CFO).

## 5. Agent Orchestration (`app/api/chat/route.ts`)
- **System Prompt (The Granola Protocol):** Engineered a strict system prompt instructing the agent to act as a ruthless financial analyst. I laid out a sequence: (1) Reason Autonomously, (2) Chain Analysis (Portfolio -> Labor -> Changes -> Field Notes), (3) Act (Email).
- **Stream Handler:** Implemented the POST route using `streamText()` from the Vercel AI SDK. 
- **LLM Provider Swap:** Initially configured with `openai('gpt-4o')`, but subsequently swapped to `anthropic('claude-3-5-sonnet-latest')` per user request to avoid leaking OpenAI keys.
- **Loop Control:** Enabled `maxSteps: 5` to allow the agent to call multiple tools sequentially before returning a final text response to the user.

## 6. The User Interface (`app/page.tsx`)
- **Client Component:** Built a modern, dark-themed chat interface using `useChat` from `@ai-sdk/react`.
- **Tool Call Rendering:** Implemented custom UI rendering logic to intercept `message.toolInvocations`. When the agent decides to use a tool, the UI displays a "calling tool..." spinner, and when the tool finishes, it displays the JSON output. This satisfies the "Transparency" hackathon requirement (ensuring it's not a black box).

## 7. Configuration & Documentation
- **Environment Variables:** Created an `.env.example` file instructing the evaluator to supply an `ANTHROPIC_API_KEY`.
- **README.md:** Replaced the default Next.js README with clear instructions on how the agent works, the tech stack, and how to run it locally.
- **TECHNICAL_SUMMARY.md:** Drafted the required 1-page architectural summary outlining the data strategy, tool design, and future improvements (like migrating to v0/React Server Components and PostgreSQL).

## 8. TypeScript & Build Troubleshooting
- **Type Mismatches:** Encountered strict type errors between the `ai` core package (v4.x) and `@ai-sdk/react` (v0.x) regarding the new `maxSteps` loop control features.
- **Resolution Iterations:**
  - Initially tried bypassing with `@ts-ignore` and `ignoreBuildErrors: true` in `next.config.ts`.
  - Ultimately resolved the core issue by ensuring `await streamText(...)` was used (as it returns a Promise in newer SDK versions) and replacing the deprecated `toDataStreamResponse()` with `toTextStreamResponse()`.
  - Ran `npx tsc --noEmit` to guarantee zero compilation errors across the entire codebase.

## 9. Version Control
- **Commits:** Grouped the work into distinct Git commits on the `main` branch.
- **Remote Push:** Pushed the fully functioning, compiled project up to `origin/main` (`https://github.com/JoshuaWu16/Hack5.git`).
