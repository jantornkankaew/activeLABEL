import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,object,seed,migrateDocument,restoreRevision} from '../src/core';
import {barcodeTypes,validateBarcode,encodeBarcode,retailBarcode} from '../src/barcodes';
import {mergeJobs,readJobs,newJob} from '../src/jobLibrary';
import {textMetrics} from '../src/typography';

test('Text content, font, weight and size recompute bounds through the shared transaction',()=>{
 const d=seed();const first=d.objects.find(o=>o.id==='sku')!;
 const n=apply(d,[{op:'update',id:first.id,changes:{content:'WWWWW',fontName:'Noto Sans Mono',fontSize:4,width:.1,height:.1}}]);const next=n.objects.find(o=>o.id===first.id)!;
 assert.deepEqual({width:next.width,height:next.height},(({width,height})=>({width,height}))(textMetrics(next.content,4,'Noto Sans Mono',false)));
 assert(next.width>.1);assert(next.height>.1);assert.equal(first.content,'SKU A50001');
 assert.throws(()=>apply(d,[{op:'update',id:first.id,changes:{content:'W'.repeat(100)}}]),/bounds/);
 assert.throws(()=>apply(d,[{op:'update',id:first.id,changes:{fontName:'Unknown font' as never}}]));
 const thai=object('text',{content:'กาแฟคั่วกลาง'});assert(thai.width>0);assert(thai.height>thai.fontSize);
});
test('All advertised symbologies encode actual SVG and invalid retail data stays rejected',()=>{
 const payloads:Record<string,string>={code128:'SKU001',code39:'SKU001',code93:'SKU001',ean13:'4006381333931',ean8:'96385074',upca:'036000291452',upce:'04252614',interleaved2of5:'001234',qrcode:'กาแฟ',datamatrix:'SKU001',pdf417:'SKU001'};
 for(const {value} of barcodeTypes){validateBarcode(value,payloads[value]);assert.match(encodeBarcode(value,payloads[value]),/<svg/);}
 for(const type of ['ean13','ean8','upca','upce'] as const){assert.throws(()=>validateBarcode(type,'123'));const valid=payloads[type];assert.throws(()=>validateBarcode(type,valid.slice(0,-1)+((Number(valid.at(-1))+1)%10)));}
 assert.throws(()=>validateBarcode('code39','lowercase'));assert.throws(()=>validateBarcode('interleaved2of5','123'));
});
test('Named jobs preserve independent contents and recover legacy font fields',()=>{
 const a=seed();const b=newJob(2);let jobs=mergeJobs([a],b);const edited=apply(a,[{op:'update',id:'price',changes:{content:'99.00'}}]);jobs=mergeJobs(jobs,edited);
 assert.equal(jobs.length,2);assert.equal(jobs.find(d=>d.id===b.id)!.objects.length,0);assert.equal(jobs.find(d=>d.id===a.id)!.objects.find(o=>o.id==='price')!.content,'99.00');
 const old=structuredClone(a);old.objects.forEach(o=>delete o.fontName);const migrated=migrateDocument(old);assert.equal(migrated.objects[0].fontName,'Noto Sans');assert.equal(old.objects[0].fontName,undefined);
 assert.equal(readJobs([a,{bad:true},b]).length,2);assert.equal(readJobs([a,a]).length,1);
});

test('Barcode resize scales both axes uniformly for every encoder, including payload-dependent ratios',()=>{
 const payloads:Record<string,string>={code128:'SKU001',code39:'SKU001',code93:'SKU001',ean13:'4006381333931',ean8:'96385074',upca:'036000291452',upce:'04252614',interleaved2of5:'001234',qrcode:'กาแฟ',datamatrix:'SKU001',pdf417:'SKU001'};
 for(const {value} of barcodeTypes){const barcode=object('barcode',{symbology:value,content:payloads[value],x:1,y:1,width:40,height:15});const doc={...newJob(1),width:100,height:100,objects:[barcode]};
 const wider=apply(doc,[{op:'update',id:barcode.id,changes:{width:barcode.width*1.5}}]).objects[0];assert(Math.abs(wider.height/barcode.height-1.5)<1e-9);assert.equal(wider.content,barcode.content);
 if(retailBarcode(value)){assert.throws(()=>apply(doc,[{op:'update',id:barcode.id,changes:{height:barcode.height*.5}}]),/magnification/);}else{const shorter=apply(doc,[{op:'update',id:barcode.id,changes:{height:barcode.height*.5}}]).objects[0];assert(Math.abs(shorter.width/barcode.width-.5)<1e-9);}
 assert.throws(()=>apply(doc,[{op:'update',id:barcode.id,changes:{width:barcode.width*2,height:barcode.height}}]),/aspect ratio/);
 const restored=restoreRevision({...doc,revision:1},doc);assert.equal(restored.objects[0].width,barcode.width);
 }
 const legacy=seed();const old=legacy.objects.find(o=>o.kind==='barcode')!;old.width=42;old.height=8;const migrated=migrateDocument(legacy).objects.find(o=>o.id===old.id)!;assert(migrated.width<=42);assert(migrated.height<=8);assert.equal(migrated.content,old.content);
 const doc=seed();doc.width=200;const existing=doc.objects.find(o=>o.kind==='barcode')!;const changed=apply(doc,[{op:'update',id:existing.id,changes:{content:'LONGER-PAYLOAD-123'}}]).objects.find(o=>o.id===existing.id)!;assert.equal(changed.barcodeScale,existing.barcodeScale);assert.equal(changed.content,'LONGER-PAYLOAD-123');
 assert.throws(()=>apply(doc,[{op:'update',id:existing.id,changes:{width:200}}]),/bounds/);
});
