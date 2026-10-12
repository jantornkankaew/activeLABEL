import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,object,seed,migrateDocument,restoreRevision} from '../src/core';
import {barcodePreflight} from '../src/barcodePreflight';
import {exceedsLabel,barcodeOverflowMargins} from '../src/labelBounds';
import {printWindowCSS} from '../src/printing';
import {prepareProposal} from '../src/chatgptEngine';
test('overflow stays editable and persistent, preserves payload, blocks print and recovers with undo or shrink',()=>{
 const doc={...seed(),width:50,height:30,objects:[object('barcode',{id:'ean',symbology:'ean13',content:'4006381333931',barcodeScale:100,x:2,y:2})]};
 const large=apply(doc,[{op:'update',id:'ean',changes:{barcodeScale:200}}]);assert(exceedsLabel(large.objects[0],large));assert.equal(large.objects[0].content,doc.objects[0].content);assert(barcodePreflight(large,300).errors.some(e=>e.includes('ล้นฉลาก')));assert.throws(()=>printWindowCSS(large),/ล้นฉลาก/);assert.deepEqual(migrateDocument(large),large);
 const small=apply(large,[{op:'update',id:'ean',changes:{barcodeScale:100}}]);assert(!exceedsLabel(small.objects[0],small));assert.doesNotThrow(()=>printWindowCSS(small));assert(!exceedsLabel(restoreRevision(large,doc).objects[0],doc));
 const moved=apply(large,[{op:'update',id:'ean',changes:{x:-10,y:-5}}]);const margins=barcodeOverflowMargins(moved);assert.equal(margins.left,10);assert.equal(margins.top,5);assert(margins.right>0&&margins.bottom>0);assert.equal(prepareProposal({document:doc,baseRevision:0,commands:[{op:'update',id:'ean',changes:{barcodeScale:200}}]}).proposal!.previewDocument.objects[0].barcodeScale,200);
 assert.throws(()=>apply(doc,[{op:'update',id:'ean',changes:{width:0}}]));assert.throws(()=>apply(doc,[{op:'update',id:'ean',changes:{x:Infinity}}]));assert.throws(()=>apply({...doc,objects:[object('box',{id:'box'})]},[{op:'update',id:'box',changes:{x:-1}}]),/bounds/);
});
