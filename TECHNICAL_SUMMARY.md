# Technical Summary (1 page)

## Architecture Overview
The HVAC Margin Rescue Agent is a **Next.js App Router** full-stack application.
- **Data Layer:** Rather than standing up a separate SQL database for the hackathon, the dataset (`~18k CSV records`) is parsed into memory on the Node server using PapaParse (`lib/db.ts`). This provides blazing fast querying capabilities.
- **Agent Orchestration:** Powered by the **Vercel AI SDK (`ai` package)**, specifically using the `streamText` function on the server (`app/api/chat/route.ts`) and the `useChat` hook on the client.
- **User Interface:** Built with **Tailwind CSS** and **shadcn/ui** components. The UI customizes the chat loop to explicitly render when the agent is "deciding" (waiting on a tool call) and formats the JSON objects returned by the tools for transparency.

## Tool Design & Autonomy
We designed five core deterministic tools:
1. `analyzePortfolio`: Aggregates the 18K rows to provide a top-level margin health breakdown.
2. `analyzeProjectLabor`: Groups labor logs by cost code (SOV line) to find budget variances.
3. `analyzeProjectChanges`: Looks up pending change orders and unapproved RFIs with cost impacts.
4. `getFieldNotesSummary`: Parses unstructured daily reports to find contextual reasons for delays.
5. `sendEmailAlert`: Acts as the final action trigger.

**Model Strategy:** The agent utilizes `gpt-4o` combined with a `maxSteps: 5` loop control. The "Granola Protocol" system prompt explicitly instructs the LLM to *chain* these tools sequentially when asked broad questions, ensuring it behaves as an agent rather than a simple chatbot.

## What I'd Improve
1. **Database Migration:** For production, move the flat CSV data into a managed PostgreSQL database (e.g., Vercel Postgres) using Drizzle ORM to improve concurrency and scale beyond 18k rows.
2. **Streaming UI Components:** Instead of just returning text and raw JSON tool results, we would implement `ai/rsc` (React Server Components) to stream beautiful interactive charts directly into the chat feed when `analyzePortfolio` is called.
3. **True Background Autonomy:** Implement cron jobs or webhooks to trigger the agent automatically every week to send proactive Slack/Email alerts without needing the user to query it first.
