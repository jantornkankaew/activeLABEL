import type {ChatGPTToolOutput} from './chatgptEngine';
import {validateChatGPTDocument} from './chatgptEngine';
import {migrateDocument,type LabelDocument} from './core';

export type WidgetState = {document: LabelDocument; resolvedProposals: string[]; documents?:LabelDocument[]};
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
  const knownIncoming=host?.widgetState?.documents?.find(doc=>doc.id===incoming?.id);
  const resolvedIncoming=host?.toolOutput?.proposal?.id&&host?.widgetState?.resolvedProposals.includes(host.toolOutput.proposal.id);
  const keepSelection=stored&&(!incoming||stored.id===incoming.id||(knownIncoming&&(host?.toolOutput?.status==='opened'||resolvedIncoming)));
  const candidates = [keepSelection?stored:knownIncoming, incoming];
  for (const doc of candidates) {
    try { if (doc) { validateChatGPTDocument(doc); return migrateDocument(doc); } } catch { /* Try the verified tool output next. */ }
  }
  return null;
}
