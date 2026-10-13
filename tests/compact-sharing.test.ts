import test from 'node:test';
import assert from 'node:assert/strict';
import {zlibSync,strToU8} from 'fflate';
import {seed,object} from '../src/core';
import {shareURL,documentFromShareHash} from '../src/sharing';
test('compressed sharing reduces a real label link by at least 60% and opens legacy links',()=>{
 const doc=seed();doc.title='ฉลากสินค้า';const old='#share='+encodeURIComponent(JSON.stringify(doc));const url=shareURL(doc);assert(url.length<old.length*.4);assert.match(new URL(url).hash,/^#share=z2\.[A-Za-z0-9_-]+$/);assert.deepEqual(documentFromShareHash(new URL(url).hash),doc);assert.deepEqual(documentFromShareHash(old),doc);
});
test('compressed sharing preserves fonts, freeform endpoints, barcode scale and overflow',()=>{
 const doc={...seed(),objects:[object('line',{line:{startX:0,startY:5,endX:10,endY:0},width:10,height:5}),object('barcode',{symbology:'qrcode',content:'ภาษาไทย ABC',barcodeScale:300,x:-5,y:20})]};assert.deepEqual(documentFromShareHash(new URL(shareURL(doc)).hash),doc);
});
test('malformed, unknown and oversized share data fail without opening a document',()=>{
 for(const hash of ['#print=x','#share=z1.','#share=z1.%20','#share=z1.A','#share=z1.ABCD','#share=z2.ABCD','#share=%7Bbroken','#share='+ 'A'.repeat(16001)])assert.equal(documentFromShareHash(hash),null);
 const compressed=zlibSync(strToU8(' '.repeat(500_000)));const encoded=Buffer.from(compressed).toString('base64url');assert.equal(documentFromShareHash('#share=z1.'+encoded),null);
 assert.throws(()=>shareURL({...seed(),objects:[object('box',{name:'x'.repeat(200_001)})]}),/ใหญ่เกิน/);
});
