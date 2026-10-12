import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/core';
import {openChatGPTLabel, prepareProposal} from '../src/chatgptEngine';

test('ChatGPT creates a blank label without inventing barcode or commercial data', () => {
  const result = openChatGPTLabel({title: 'My label', widthMm: 60, heightMm: 40});
  assert.equal(result.status, 'opened'); assert.equal(result.document.width, 60); assert.equal(result.document.objects.length, 0);
  assert.throws(() => openChatGPTLabel({widthMm: 2}));
});
test('ChatGPT only previews edits; original label stays intact until UI approval', () => {
  const document = seed(); const result = prepareProposal({document, baseRevision: 0, commands: [{op: 'update', id: 'price', changes: {x: 20}}]});
  assert.equal(result.status, 'proposal_pending'); assert.equal(result.document.objects.find(item => item.id === 'price')!.x, 32);
  assert.equal(result.proposal!.previewDocument.objects.find(item => item.id === 'price')!.x, 20); assert.equal(document.revision, 0);
});
test('ChatGPT command validation shares bounds, locking, stale revision and EAN checks', () => {
  const document = seed(); document.objects[0].locked = true;
  for (const [baseRevision, command] of [[1, {op: 'remove', id: 'price'}], [0, {op: 'update', id: 'brand', changes: {x: 4}}], [0, {op: 'update', id: 'price', changes: {x: 100}}], [0, {op: 'update', id: 'barcode', changes: {symbology: 'ean13', content: '123'}}]] as const) {
    assert.throws(() => prepareProposal({document, baseRevision, commands: [command]}));
  }
});
test('ChatGPT rejects raw execution/printing and model attempts to unlock objects', () => {
  for (const command of [{op: 'print'}, {op: 'exec', script: 'touch x'}, {op: 'update', id: 'brand', changes: {locked: false}}]) {
    assert.throws(() => prepareProposal({document: seed(), baseRevision: 0, commands: [command as never]}));
  }
});
test('Existing barcode payload changes are flagged for explicit UI confirmation', () => {
  const result = prepareProposal({document: seed(), baseRevision: 0, commands: [{op: 'update', id: 'barcode', changes: {content: 'NEW123'}}]});
  assert.equal(result.proposal!.changesBarcodePayload, true); assert.equal(result.document.objects.find(item => item.kind === 'barcode')!.content, 'A50001');
});
test('ChatGPT proposals preserve square QR geometry', () => {
  const document = seed();
  const next=prepareProposal({document,baseRevision:0,commands:[{op:'update',id:'barcode',changes:{symbology:'qrcode'}}]}).proposal!.previewDocument.objects.find(o=>o.id==='barcode')!;assert.equal(next.width,next.height);
});
