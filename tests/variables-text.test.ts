import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,object,seed,validate} from '../src/core';
import {resolveDocument,renderTemplate,simpleVariableBinding,usedVariables,variableTemplate} from '../src/variables';
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

test('simple variable bindings preserve editable prefix and suffix',()=>{
 const binding=simpleVariableBinding('LOT-{{lot}}-TH');assert.deepEqual(binding,{prefix:'LOT-',name:'lot',suffix:'-TH'});assert.equal(variableTemplate({...binding!,prefix:'BATCH '}),'BATCH {{lot}}-TH');assert.equal(simpleVariableBinding('{{lot}}{{lot}}'),null);assert.equal(simpleVariableBinding('{{lot}}/{{date}}'),null);
});

test('remembering variables updates linked design objects including locked objects',()=>{
 const text=object('text',{id:'t',template:'Price {{price}} THB',content:'Price 100 THB',locked:true});const barcode=object('barcode',{id:'b',template:'P{{price}}',content:'P100',locked:true,x:3,y:15});const doc={...seed(),width:100,height:60,variables:[{name:'price',label:'Price',value:'100',prompt:true}],objects:[text,barcode]};
 const remembered=apply(doc,[{op:'setVariables',variables:[{name:'price',label:'Price',value:'250',prompt:true}]}]);assert.equal(remembered.variables?.[0].value,'250');assert.equal(remembered.objects[0].content,'Price 250 THB');assert.equal(remembered.objects[1].content,'P250');assert.equal(remembered.objects[0].locked,true);
});

test('barcode formulas are revalidated with print values',()=>{
 const code=object('barcode',{id:'ean',symbology:'ean13',content:'4006381333931',template:'{{ean}}',barcodeScale:100});const doc={...seed(),width:100,height:60,variables:[{name:'ean',label:'EAN',value:'4006381333931',prompt:true}],objects:[code]};
 assert.equal(resolveDocument(doc,{ean:'5901234123457'}).objects[0].content,'5901234123457');assert.throws(()=>resolveDocument(doc,{ean:'123'}),/13 digits/);
});

test('usedVariables identifies variables referenced across formulas, variable values and objects',()=>{
 const text=object('text',{id:'t',template:'SKU: {{sku}}',content:'SKU: ABC'});
 const doc={
  ...seed(),
  variables:[
   {name:'sku',label:'SKU',value:'ABC',prompt:true},
   {name:'price',label:'Price',value:'100',prompt:true},
   {name:'duration',label:'Duration',value:'10',prompt:true},
   {name:'unused',label:'Unused',value:'xyz',prompt:false},
  ],
  formulas:[
   {id:'f1',name:'F1',blocks:[
    {id:'b1',category:'numeric' as const,functionName:'math_op',params:{op:'+',left:'{{price}}',right:'50'}},
    {id:'b2',category:'numeric' as const,functionName:'set_variable',params:{variable:'duration',value:'20'}},
   ]},
  ],
  objects:[text],
 };
 const names=usedVariables(doc).map(v=>v.name);
 assert.ok(names.includes('sku'), 'sku is in canvas text');
 assert.ok(names.includes('price'), 'price is used in formula');
 assert.ok(names.includes('duration'), 'duration is targeted in formula block');
 assert.equal(names.includes('unused'), false, 'unused is not referenced');
});

