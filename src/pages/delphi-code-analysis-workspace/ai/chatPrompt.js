export const chatSystemPrompt = 'You are a JavaScript refactoring assistant. Discuss how to improve the current snippet that parses Delphi (.pas) files. Ask clarifying questions when needed and propose changes step-by-step. Be concise. Do not output full code unless the user requests it; focus on guidance and rationale.';

export const chatDefaultPrompt = 'Goal: Understand the user\'s expected results and discuss improvements to the foundation JavaScript snippet that parses Delphi (.pas) files.\n\nGuidelines:\n- Ask concise, targeted questions to clarify edge cases and desired output.\n- Propose incremental refactor ideas aligned with existing behavior.\n- Do NOT output full code unless explicitly requested; focus on reasoning and next steps.\n\nContext:\n- File name: {{fileName}}\n- File content (excerpt):\n{{fileContentExcerpt}}\n- Diff items (1-based):\n{{diffItemsList}}\n- Metadata: {{metadataJson}}\n\nUser message:\n{{message}}\n\nCurrent code (foundation to refactor):\n{{code}}';

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