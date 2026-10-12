import type {ChatGPTToolOutput} from './chatgptEngine';
import {validateChatGPTDocument} from './chatgptEngine';
import type {LabelDocument} from './core';

export type WidgetState = {document: LabelDocument; resolvedProposals: string[]};
export type ChatGPTHost = {
  toolOutput?: ChatGPTToolOutput | null;
  widgetState?: WidgetState | null;
  setWidgetState: (state: WidgetState) => Promise<void>;
  sendFollowUpMessage: (input: {prompt: string}) => Promise<void>;
  requestDisplayMode?: (input: {mode: 'fullscreen'}) => Promise<unknown>;
};
export function getChatGPTHost(): ChatGPTHost | undefined {
  const host = (window as unknown as {openai?: ChatGPTHost}).openai;
  return host && typeof host.setWidgetState === 'function' && typeof host.sendFollowUpMessage === 'function' ? host : undefined;
}
export function initialChatGPTDocument(host: ChatGPTHost | undefined): LabelDocument | null {
  const stored = host?.widgetState?.document;
  const incoming = host?.toolOutput?.document;
  const candidates = [stored && (!incoming || stored.id === incoming.id) ? stored : undefined, incoming];
  for (const doc of candidates) {
    try { if (doc) { validateChatGPTDocument(doc); return structuredClone(doc); } } catch { /* Try the verified tool output next. */ }
  }
  return null;
}
