## Current Behavior
- The "Run Analysis" button triggers `handleRunAnalysis` which calls `handleExecuteScript(jsCode)` in `src/pages/delphi-code-analysis-workspace/index.jsx:144-146`.
- `handleExecuteScript` delegates to `executeJavaScript` which currently returns mock results and does not evaluate the user’s script (`index.jsx:31-55, 106-115`).

## Goal
- Make the button evaluate the JavaScript snippet the user writes in the editor and produce its returned results to feed the tables and JSON output.

## Implementation Plan
1. Replace mock executor with a real evaluator
- Update `executeJavaScript` to safely evaluate the editor code into a function and call it with `(fileContent, diffItems, metadata)`:
  - Use `new Function` to compile the snippet into a factory returning the analysis function.
  - Validate the factory returns a function; throw error if not.
  - Call the function and expect an array of result objects.
- File: `src/pages/delphi-code-analysis-workspace/index.jsx` (replace current mock executor at `index.jsx:31-55`).

2. Validation and error reporting
- Validate output type: ensure it is an `Array`; if not, raise a clear error.
- Optionally validate item schema for fields used by `ResultsTable` and `JSONOutputPanel`.
- Use existing error handling UI (`ErrorDisplay`) via `setError(err)` and `executionStatus` updates (`index.jsx:110-115`).

3. UI contract reinforcement
- Keep `JavaScriptEditor` default snippet that ends with `return analyzeDelphiCode;` and update help text to state:
  - The script must `return` a function accepting `(fileContent, diffItems, metadata)` and returning an array of results.
- File: `src/pages/delphi-code-analysis-workspace/components/JavaScriptEditor.jsx` (minor copy changes only).

4. Produce JSON output
- On successful execution, continue to populate `analysisResults` (`index.jsx:107-110`) and keep `JSONOutputPanel` toggling as-is; this already renders results.

## Safety Considerations
- Initial approach uses `new Function` in a strict wrapper; it runs in-browser and has access to the page scope.
- Add guards:
  - Wrap evaluation in try/catch.
  - Disallow non-function return.
  - Consider timeouts for long-running code.
- Optional next step: move execution into a Web Worker for isolation and responsiveness.

## Optional Enhancement (later)
- Web Worker sandbox:
  - Create a dedicated worker to compile and run the snippet with message passing.
  - Limit available globals; enforce timeouts; cancelable runs.

## References
- Trigger path: `src/pages/delphi-code-analysis-workspace/index.jsx:144-146`.
- Execution pipeline and state: `index.jsx:86-116`.
- Output consumers: `ResultsTable.jsx`, `JSONOutputPanel.jsx`, `CodeViewer.jsx`.

## Confirmation Needed
- Approve the in-page evaluator (`new Function` with validation) as the first step.
- Do you also want the Web Worker sandbox in the initial implementation, or add it as a follow-up after we validate the in-page approach?
