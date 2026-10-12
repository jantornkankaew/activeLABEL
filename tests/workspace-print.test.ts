import test from 'node:test';
import assert from 'node:assert/strict';
import {fitScale,snapCoordinate,proportionalScale} from '../src/canvasGeometry';
import {barcodeSuggestion,validateBarcode} from '../src/barcodes';
import {fontNames,textMetrics} from '../src/typography';
import {seed} from '../src/core';
import {mergeJobs,newJob} from '../src/jobLibrary';
import {printHandoffURL,printWindowCSS,localBridgeURL} from '../src/printing';

test('Fit uses the limiting axis without changing physical dimensions, and snapping is optional',()=>{
 assert.equal(fitScale(50,30,578,402),10);assert.equal(fitScale(100,10,578,402),5);assert.equal(fitScale(10,100,578,402),3);assert(fitScale(300,300,1,1)>0);
 assert.equal(snapCoordinate(3.7,1,true),4);assert.equal(snapCoordinate(3.7,1,false),3.7);assert.equal(snapCoordinate(3.7,.5,true),3.5);
 const scale=proportionalScale(20,5,20,5,100,100);assert.equal(scale,2);assert.equal(proportionalScale(20,5,100,100,30,10),1.5);
});
test('Suggested checksum corrections are valid but never mutate existing payloads',()=>{
 for(const [type,data,expected] of [['ean13','4006381333932','4006381333931'],['ean8','9638507','96385074'],['upca','036000291453','036000291452'],['code39','sku001','SKU001'],['interleaved2of5','123','0123']] as const){const suggestion=barcodeSuggestion(type,data)!;assert.equal(suggestion.value,expected);validateBarcode(type,suggestion.value);}
 assert.match(barcodeSuggestion('ean13','SKU001')!.label,/ตัวอย่าง/);
});
test('All nine bundled font choices compute Thai and Latin bounds',()=>{
 assert.equal(fontNames.length,9);for(const name of fontNames){for(const bold of [false,true]){const size=textMetrics('Coffee กาแฟ',3,name,bold);assert(size.width>0&&Number.isFinite(size.width));assert(size.height>=3);}}
});
test('Saving and opening files preserves tab order',()=>{const a=seed();const b=newJob(2);assert.deepEqual(mergeJobs([a,b],{...a,title:'Updated'}).map(d=>d.id),[a.id,b.id]);});
test('Print requests use mm page size and an encoded fragment, without credentials or page scale',()=>{
 const doc=seed();const url=new URL(printHandoffURL(doc));assert.equal(url.origin,'https://jantornkankaew.github.io');assert.equal(url.search,'');assert.deepEqual(JSON.parse(decodeURIComponent(url.hash.slice(7))),doc);assert.match(printWindowCSS(doc),/@page\{size:50mm 30mm;margin:0\}/);assert.match(printWindowCSS(doc),/width:50mm!important;height:30mm!important/);
 assert.equal(localBridgeURL('https://localhost:28171','https:'),'https://localhost:28171');assert.throws(()=>localBridgeURL('http://127.0.0.1:28171','https:'));for(const value of ['https://remote.example','https://user:secret@localhost:28171','https://localhost:28171/?token=abc'])assert.throws(()=>localBridgeURL(value,'https:'));
});
