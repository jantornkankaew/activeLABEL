import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,object,seed,validate} from '../src/core';
import {resolveDocument,renderTemplate,usedVariables} from '../src/variables';
import {resizeObject} from '../src/resizeObject';
import {vectorObject} from '../src/renderer';
import {documentFromShareHash,shareURL} from '../src/sharing';

test('text supports italic, underline, fixed frames and internal alignment',()=>{
 const base={...seed(),width:100,height:60,objects:[object('text',{id:'t',content:'Hello',x:10,y:10})]};
 const doc=apply(base,[{op:'update',id:'t',changes:{italic:true,underline:true,autoSize:false,width:40,height:8,textAlign:'center'}}]);const item=doc.objects[0];
 assert.equal(item.width,40);assert.equal(item.height,8);const svg=vectorObject(item)!;assert.equal(svg.props.fontStyle,'italic');assert.equal(svg.props.textDecoration,'underline');assert.equal(svg.props.textAnchor,'middle');assert.equal(svg.props.x,30);
 const resized=resizeObject(item,'e',10,0,doc);assert.equal(resized.fontSize,item.fontSize);assert.equal(resized.width,50);
 const auto=apply(doc,[{op:'update',id:'t',changes:{autoSize:true}}]).objects[0];assert.notEqual(auto.width,40);validate({...doc,objects:[item]});
});

test('templates safely concatenate variables for text and barcode without changing source formula',()=>{
 const text=object('text',{id:'t',template:'LOT {{lot}} / {{date}}',content:'LOT 001 / 2026'});const barcode=object('barcode',{id:'b',symbology:'code128',template:'{{prefix}}-{{lot}}',content:'SKU-001',barcodeScale:100,x:3,y:20});
 const doc={...seed(),width:100,height:70,variables:[{name:'lot',label:'Lot',value:'001',prompt:true},{name:'date',label:'Date',value:'2026',prompt:false},{name:'prefix',label:'Prefix',value:'SKU',prompt:true}],objects:[text,barcode]};
 assert.equal(renderTemplate('{{prefix}}-{{lot}}',{prefix:'SKU',lot:'9'}),'SKU-9');assert.deepEqual(usedVariables(doc).map(v=>v.name),['lot','date','prefix']);
 const resolved=resolveDocument(doc,{lot:'009',prefix:'ITEM'});assert.equal(resolved.objects[0].content,'LOT 009 / 2026');assert.equal(resolved.objects[1].content,'ITEM-009');assert.equal(resolved.objects[1].template,'{{prefix}}-{{lot}}');assert.equal(doc.objects[1].content,'SKU-001');
 assert.throws(()=>resolveDocument({...doc,objects:[{...text,template:'{{missing}}'}]}),/missing/);
 const opened=documentFromShareHash(new URL(shareURL(doc)).hash)!;assert.deepEqual(opened,doc);
});

test('barcode formulas are revalidated with print values',()=>{
 const code=object('barcode',{id:'ean',symbology:'ean13',content:'4006381333931',template:'{{ean}}',barcodeScale:100});const doc={...seed(),width:100,height:60,variables:[{name:'ean',label:'EAN',value:'4006381333931',prompt:true}],objects:[code]};
 assert.equal(resolveDocument(doc,{ean:'5901234123457'}).objects[0].content,'5901234123457');assert.throws(()=>resolveDocument(doc,{ean:'123'}),/13 digits/);
});
