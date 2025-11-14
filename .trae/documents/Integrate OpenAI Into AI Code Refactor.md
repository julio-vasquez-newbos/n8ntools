## Goal
- Wire the “AI Code Refactor” panel to OpenAI so user instructions transform the current editor code and update it in place.

## Approach
- Client-side call to OpenAI for development using `import.meta.env.VITE_OPENAI_API_KEY` and `VITE_OPENAI_MODEL`.
- Compose a prompt that:
  - Includes the user’s instructions and the current code
  - Requires output to be the full updated JavaScript snippet as plain text (no markdown fences)
  - Ensures the snippet returns the required function or pipeline-style array compatible with the executor

## Changes
1. Environment
- Ensure `.env` has:
  - `VITE_OPENAI_API_KEY` (already present)
  - Add `VITE_OPENAI_MODEL` (e.g., `gpt-4o-mini`)

2. Refactor Implementation
- File: `src/pages/delphi-code-analysis-workspace/index.jsx`
  - Replace `performAIRefactor` to:
    - Read `import.meta.env.VITE_OPENAI_API_KEY` and `import.meta.env.VITE_OPENAI_MODEL`
    - Call `https://api.openai.com/v1/chat/completions` with a system+user prompt
    - Validate the response text; update `jsCode` with the returned snippet
    - Handle errors and update `error` state

3. Prompt Design
- System: “You are a code refactoring assistant. Return only executable JavaScript code. No explanations.”
- User: Template including:
  - The refactor instructions
  - Guardrails: output must be a single JS snippet compatible with this app’s executor (either returns a function `(fileContent, diffItems, metadata)` or pipeline-style array)
  - Provide the current code as context

4. UI/UX
- Reuse existing `AIRefactorPanel` actions and loading state
- Show errors in `ErrorDisplay` if the API call fails or output is empty

## Security Note
- Calling OpenAI from the browser exposes the API key to end users; suitable for local/dev.
- For production, recommend a minimal proxy (serverless function) to keep keys secret. This can be added later.

## Verification
- With a test `.pas` file and a diff item, enter instructions (e.g., “Add error handling and optimize regex”) and click “Generate Refactored Code”
- Confirm the editor updates and “Run Analysis” executes the new snippet without errors

## Confirmation
- Confirm client-side integration with `chat/completions` and model `gpt-4o-mini`.
- Confirm adding `VITE_OPENAI_MODEL` to `.env` and using the existing `VITE_OPENAI_API_KEY`.