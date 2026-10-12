import {apply, object, seed, validate, type Command, type LabelDocument} from './core';

export type LabelProposal = {id: string; documentId: string; baseRevision: number; commands: Command[]; previewDocument: LabelDocument; changesBarcodePayload: boolean};
export type ChatGPTToolOutput = {status: 'opened' | 'proposal_pending'; document: LabelDocument; proposal?: LabelProposal};
type OpenInput = {title?: string; widthMm?: number; heightMm?: number};
type ProposalInput = {document: LabelDocument; baseRevision: number; commands: Command[]};
const objectKeys = new Set(['id', 'name', 'kind', 'x', 'y', 'width', 'height', 'content', 'fontSize', 'fontName', 'bold', 'locked', 'symbology', 'line', 'barcodeScale']);
const aiUpdateKeys = new Set(['name', 'x', 'y', 'width', 'height', 'content', 'fontSize', 'fontName', 'bold', 'symbology', 'line', 'barcodeScale']);
function keys(value: unknown, allowed: Set<string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.has(key))) throw Error('Unsupported input properties');
}
export function validateChatGPTDocument(doc: LabelDocument) {
  keys(doc, new Set(['schemaVersion', 'id', 'revision', 'title', 'width', 'height', 'objects']));
  validate(doc);
  for (const item of doc.objects) keys(item, objectKeys);
  if (doc.objects.some(item => item.kind === 'image')) throw Error('This ChatGPT app version supports text, barcodes, lines and boxes; image uploads remain in the standalone editor');

  if (JSON.stringify(doc).length > 200_000) throw Error('Label document is too large');
}
export function changesBarcodePayload(doc: LabelDocument, commands: Command[]): boolean {
  return commands.some(command => command.op === 'update' && command.changes.content !== undefined &&
    doc.objects.some(item => item.id === command.id && item.kind === 'barcode' && item.content !== command.changes.content));
}
export function prepareProposal(input: ProposalInput): ChatGPTToolOutput {
  keys(input, new Set(['document', 'baseRevision', 'commands']));
  validateChatGPTDocument(input.document);
  if (!Number.isInteger(input.baseRevision) || input.baseRevision !== input.document.revision) throw Error('Stale document revision');
  if (!Array.isArray(input.commands) || input.commands.length < 1 || input.commands.length > 20) throw Error('Supply 1–20 typed label commands');
  const commands = input.commands.map(command => {
    if (command.op === 'update') { keys(command, new Set(['op', 'id', 'changes'])); keys(command.changes, aiUpdateKeys); }
    else if (command.op === 'add') {
      keys(command, new Set(['op', 'object'])); keys(command.object, objectKeys);
      if (!['text', 'barcode', 'line', 'box'].includes(command.object.kind) || command.object.locked === true) throw Error('Unsupported new object');
      return {...command, object: object(command.object.kind, command.object)};
    } else if (command.op === 'remove') keys(command, new Set(['op', 'id']));
    else if (command.op === 'resize') keys(command, new Set(['op', 'width', 'height']));
    else throw Error('Unsupported operation');
    return command;
  });
  const previewDocument = apply(input.document, commands, input.baseRevision);
  validateChatGPTDocument(previewDocument);
  return {status: 'proposal_pending', document: structuredClone(input.document), proposal: {
    id: crypto.randomUUID(), documentId: input.document.id, baseRevision: input.baseRevision,
    commands, previewDocument, changesBarcodePayload: changesBarcodePayload(input.document, commands),
  }};
}
export function openChatGPTLabel(input: OpenInput): ChatGPTToolOutput {
  keys(input, new Set(['title', 'widthMm', 'heightMm']));
  const document = seed();
  document.objects = []; // Start blank; never invent product data or barcode payloads.
  document.title = input.title ?? 'Untitled label';
  document.width = input.widthMm ?? 50;
  document.height = input.heightMm ?? 30;
  validateChatGPTDocument(document);
  return {status: 'opened', document};
}
