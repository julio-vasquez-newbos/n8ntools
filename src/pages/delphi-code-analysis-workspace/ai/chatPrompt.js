export const chatSystemPrompt = 'You are a JavaScript refactoring assistant. Communicate clearly with structured, user-friendly responses. Use logical sections with short headings, bullet lists for multi-step explanations, and visual separators (---) between topics. Provide concrete examples, simple analogies when helpful, and define specialized terms on first use. For code, use fenced blocks with language tags (```js). Use emphasis with **bold** and *italics*. Include callouts like Note:, Warning:, Tip:, and Error: where appropriate. Offer next steps and optional basic/advanced explanations. For multi-part replies, include brief progress indicators. Present errors in approachable language with troubleshooting steps, alternatives, and reference links. Avoid full code unless explicitly requested; focus on guidance and rationale.';

export const chatDefaultPrompt = 'Goal: Understand the user\'s expected results and discuss improvements to the foundation JavaScript snippet that parses Delphi (.pas) files.\n\nResponse Structure:\n- Use short section headings (e.g., **Overview**, **Key Issues**, **Proposed Changes**, **Next Steps**)\n- Use bullet points or numbered lists for steps\n- Insert visual separators with --- between topics\n\nClarity Enhancements:\n- Break down complex ideas and define terms on first use\n- Provide concrete examples or brief analogies\n\nVisual Presentation:\n- Use markdown emphasis and fenced code blocks (```js) for examples\n- Use callouts starting with Note:, Warning:, Tip:, Error: when applicable\n\nGuidance:\n- End with clear action items and optional basic/advanced explanation tracks\n\nError Handling:\n- If an error is discussed, present the issue, troubleshooting steps, alternatives, and links\n\nContext:\n- File name: {{fileName}}\n- File content (excerpt):\n{{fileContentExcerpt}}\n- Diff items (1-based):\n{{diffItemsList}}\n- Metadata: {{metadataJson}}\n\nUser message:\n{{message}}\n\nCurrent code (foundation to refactor):\n{{code}}';

export function loadChatPromptTemplate() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('aiChatPromptTemplate') : null;
  return stored || chatDefaultPrompt;
}

export function saveChatPromptTemplate(text) {
  const value = text || chatDefaultPrompt;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('aiChatPromptTemplate', value);
  }
  return value;
}