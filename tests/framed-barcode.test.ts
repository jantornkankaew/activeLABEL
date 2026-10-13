import test from 'node:test';
import assert from 'node:assert/strict';
import {object,seed,apply} from '../src/core';
import {barcodeProfile} from '../src/barcodes';
import {barcodePreflight} from '../src/barcodePreflight';

for(const symbology of ['qrcode','datamatrix','code128'] as const){
 test(`${symbology}: an enclosing transparent frame prints, crossing ink still blocks`,()=>{
  const code=object('barcode',{id:'code',symbology,content:'SAMPLE',barcodeScale:100,x:10,y:10});
  const frame=object('box',{id:'frame',x:code.x,y:code.y,width:code.width,height:code.height});
  const doc={...seed(),width:100,height:70,objects:[code,frame]};
  const tight=barcodePreflight(doc,300);
  assert.deepEqual(tight.errors,[]);assert(tight.warnings.some(w=>w.includes('กรอบชิด')));
  const clear=apply(doc,[{op:'update',id:'frame',changes:{x:9,y:9,width:code.width+2,height:code.height+2}}]);
  assert.deepEqual(barcodePreflight(clear,300).errors,[]);
  assert(!barcodePreflight(clear,300).warnings.some(w=>w.includes('กรอบชิด')));
  const inset=barcodeProfile(symbology,'SAMPLE').quiet.left*.33+.1;
  const cut=apply(doc,[{op:'update',id:'frame',changes:{x:code.x+inset,width:code.width-inset}}]);
  assert(barcodePreflight(cut,300).errors.some(e=>e.includes('ทับพื้นที่')));
  assert.equal(clear.objects[0].content,'SAMPLE');assert.equal(clear.objects[0].width,code.width);
 });
}
test('preflight follows opaque barcode background and actual stroke geometry',()=>{
 const code=object('barcode',{id:'code',symbology:'qrcode',content:'SAMPLE',barcodeScale:100,x:10,y:10});
 const line=object('line',{x:11,y:11,width:4,height:4,line:{startX:0,startY:0,endX:4,endY:4}});
 const doc={...seed(),width:100,height:70,objects:[line,code]};
 assert.deepEqual(barcodePreflight(doc,300).errors,[],'lower ink is hidden by barcode background');
 assert(barcodePreflight({...doc,objects:[code,line]},300).errors.length>0,'visible line crossing modules blocks');
 const innerBox=object('box',{x:12,y:12,width:2,height:2});
 assert(barcodePreflight({...doc,objects:[code,innerBox]},300).errors.length>0,'box inside actual modules is not an enclosing frame');
});

test('QR frame inset into white padding remains printable until its stroke touches modules',()=>{
 const code=object('barcode',{id:'qr',symbology:'qrcode',content:'SAMPLE',barcodeScale:200,x:10,y:10});
 const padding=barcodeProfile('qrcode','SAMPLE').quiet.left*.33*2;
 for(const inset of [.001,.05,.5,1,padding-.11]){
  const frame=object('box',{x:code.x+inset,y:code.y+inset,width:code.width-2*inset,height:code.height-2*inset});
  const result=barcodePreflight({...seed(),width:100,height:80,objects:[code,frame]},203);
  assert.deepEqual(result.errors,[],`white-margin inset ${inset}`);
  assert(result.warnings.some(w=>w.includes('กรอบชิด')));
 }
 for(const inset of [padding-.09,padding,padding+.2]){
  const frame=object('box',{x:code.x+inset,y:code.y+inset,width:code.width-2*inset,height:code.height-2*inset});
  assert(barcodePreflight({...seed(),width:100,height:80,objects:[code,frame]},203).errors.length>0,`stroke intersects module area at ${inset}`);
 }
});
