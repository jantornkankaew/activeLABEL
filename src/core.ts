import type {LinePoints} from './lineGeometry';
import {fontNames,textMetrics,type FontName} from './typography';
import {barcodeTypes,barcodeRatio,fitBarcodeBox,validateBarcode,type Symbology} from './barcodes';
export type Kind = 'text' | 'barcode' | 'image' | 'box' | 'line';
export type LabelObject = {id:string; name:string; kind:Kind; x:number; y:number; width:number; height:number; content:string; fontSize:number; bold:boolean; locked:boolean; symbology:Symbology; fontName?:FontName; line?:LinePoints;};
export type LabelDocument = {schemaVersion:1; id:string; revision:number; title:string; width:number; height:number; objects:LabelObject[]};
export type Command = {op:'add'; object:LabelObject} | {op:'update'; id:string; changes:Partial<Omit<LabelObject,'id'|'kind'>>} | {op:'remove'; id:string} | {op:'resize'; width:number; height:number};
export const uid=()=>globalThis.crypto.randomUUID();
export function object(kind:Kind, changes:Partial<LabelObject>={}):LabelObject {const next=sizeText({id:uid(),name:kind,kind,x:3,y:3,width:kind==='barcode'?40:20,height:kind==='barcode'?8:5,content:kind==='barcode'?'A50001':kind==='text'?'New text':'',fontSize:3,bold:false,locked:false,symbology:'code128',fontName:'Noto Sans',...changes});try{return fitBarcodeBox(next);}catch{return next;} }
export function seed():LabelDocument{return {schemaVersion:1,id:uid(),revision:0,title:'Product label',width:50,height:30,objects:[object('text',{id:'brand',name:'Brand',content:'ACTIVE 5',width:27,height:5,fontSize:4.5,bold:true}),object('text',{id:'price',name:'Price',content:'129.00 THB',x:32,width:16,height:4,fontSize:2.7,bold:true}),object('text',{id:'name',name:'Product name',content:'Product label',y:9,width:42,height:4,fontSize:3.2}),object('text',{id:'sku',name:'SKU',content:'SKU A50001',y:14,width:42,height:3,fontSize:2.5}),object('barcode',{id:'barcode',name:'Barcode',x:4,y:19,width:42,height:8,content:'A50001'})]};}
export function sizeText(o:LabelObject):LabelObject {return o.kind==='text'?{...o,fontName:o.fontName??'Noto Sans',...(({width,height})=>({width,height}))(textMetrics(o.content,o.fontSize,o.fontName,o.bold))}:o;}
export function migrateDocument(doc:LabelDocument):LabelDocument {validate(doc,false);const next=structuredClone(doc);next.objects=next.objects.map(o=>fitBarcodeBox(sizeText(o)));validate(next);return next;}
const updateKeys=new Set(['name','x','y','width','height','content','fontSize','fontName','bold','locked','symbology','line']);
export function validate(doc:LabelDocument,checkBarcodeRatio=true):void {
 if(doc.schemaVersion!==1||typeof doc.id!=='string'||!Number.isInteger(doc.revision)||doc.revision<0||typeof doc.title!=='string'||doc.title.length>120)throw Error('Invalid document header');
 if(!Number.isFinite(doc.width)||!Number.isFinite(doc.height)||doc.width<10||doc.height<10||doc.width>300||doc.height>300)throw Error('Label size must be 10–300 mm');
 if(!Array.isArray(doc.objects)||doc.objects.length>100)throw Error('Maximum 100 objects');
 const ids=new Set<string>();
 for(const o of doc.objects){if(!o||typeof o.id!=='string'||ids.has(o.id))throw Error('Invalid or duplicate object ID');ids.add(o.id);
 if(!['text','barcode','image','box','line'].includes(o.kind))throw Error('Unsupported object type');
 if(typeof o.content!=='string'||typeof o.name!=='string'||o.content.length>3_000_000||typeof o.locked!=='boolean'||typeof o.bold!=='boolean'||!barcodeTypes.some(t=>t.value===o.symbology)||(o.fontName!==undefined&&!fontNames.includes(o.fontName)))throw Error('Invalid object properties');
 for(const n of [o.x,o.y,o.width,o.height,o.fontSize])if(!Number.isFinite(n))throw Error('Invalid numeric value');
 if(o.x<0||o.y<0||o.width<=0||o.height<=0||o.x+o.width>doc.width+.001||o.y+o.height>doc.height+.001)throw Error(`${o.name} exceeds label bounds`);
 if(o.line!==undefined){const p=o.line;if(o.kind!=='line'||!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==4||Object.keys(p).some(k=>!['startX','startY','endX','endY'].includes(k))||![p.startX,p.startY,p.endX,p.endY].every(Number.isFinite)||Math.min(p.startX,p.endX)<0||Math.min(p.startY,p.endY)<0||Math.max(p.startX,p.endX)>o.width+.001||Math.max(p.startY,p.endY)>o.height+.001||Math.hypot(p.endX-p.startX,p.endY-p.startY)<.1)throw Error('Invalid line endpoints');}
 if(o.fontSize<.5||o.fontSize>30)throw Error('Font size must be 0.5–30 mm');
 if(o.kind==='image'&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(o.content))throw Error('Image must be an uploaded PNG, JPEG or WebP');
 if(o.kind==='barcode'){validateBarcode(o.symbology,o.content);if(checkBarcodeRatio&&Math.abs(o.height-o.width/barcodeRatio(o.symbology,o.content))>.001)throw Error('Barcode aspect ratio must match its encoded geometry');}
 }
}
export function apply(doc:LabelDocument,commands:Command[],baseRevision=doc.revision):LabelDocument {
 if(baseRevision!==doc.revision)throw Error('Document changed while processing. Please try again.');
 if(!Array.isArray(commands)||commands.length<1||commands.length>50)throw Error('Invalid command count');
 const next=structuredClone(doc);
 for(const c of commands){if(c.op==='resize'){next.width=c.width;next.height=c.height;}else if(c.op==='add'){next.objects.push(fitBarcodeBox(c.object));}else if(c.op==='update'||c.op==='remove'){const i=next.objects.findIndex(o=>o.id===c.id);if(i<0)throw Error('Unknown object');const unlockOnly=c.op==='update'&&c.changes.locked===false&&Object.keys(c.changes).length===1;if(next.objects[i].locked&&!unlockOnly)throw Error('Unlock the object before editing');if(c.op==='remove')next.objects.splice(i,1);else {for(const k of Object.keys(c.changes))if(!updateKeys.has(k))throw Error('Unsupported property');const previous=next.objects[i];const oldWidth=previous.width,oldHeight=previous.height;Object.assign(next.objects[i],c.changes);if(previous.kind==='line'&&previous.line&&c.changes.line===undefined){const p=previous.line;previous.line={startX:p.startX*(previous.width/oldWidth),endX:p.endX*(previous.width/oldWidth),startY:p.startY*(previous.height/oldHeight),endY:p.endY*(previous.height/oldHeight)};}
 if(previous.kind==='barcode'){const ratio=barcodeRatio(previous.symbology,previous.content);
 if(c.changes.width!==undefined&&c.changes.height===undefined)previous.height=previous.width/ratio;
 else if(c.changes.height!==undefined&&c.changes.width===undefined)previous.width=previous.height*ratio;
 else if(c.changes.content!==undefined||c.changes.symbology!==undefined)next.objects[i]=fitBarcodeBox(previous);
 }}}else throw Error('Unsupported operation');}
 next.objects=next.objects.map(sizeText);next.revision=doc.revision+1;validate(next);return next;
}
export function restoreRevision(current:LabelDocument,snapshot:LabelDocument):LabelDocument {const d=structuredClone(snapshot);d.revision=current.revision+1;validate(d);return d;}
// A transparent offline command demo, not a language model. Production AI uses the Go API.
export function demoCommands(prompt:string,doc:LabelDocument,selectedId:string|null):{commands:Command[];message:string} {
 const p=prompt.toLowerCase();let target=doc.objects.find(o=>o.id===selectedId);
 if(/price|ราคา/.test(p))target=doc.objects.find(o=>o.id==='price'||o.name==='Price');
 if(/barcode|บาร์โค้ด/.test(p))target=doc.objects.find(o=>o.kind==='barcode');
 if(/create|สร้าง/.test(p)){const d=seed();return {commands:[...doc.objects.map(o=>({op:'remove' as const,id:o.id})),{op:'resize',width:50,height:30},...d.objects.map(o=>({op:'add' as const,object:o}))],message:'สร้างฉลากตัวอย่าง 50 × 30 มม. แล้ว แก้ไขต่อบนหน้าจอได้'};}
 if(/lot|ล็อต/.test(p))return {commands:[{op:'add',object:object('text',{name:'Lot',content:'LOT: SAMPLE',x:3,y:doc.height-2.5,width:25,height:2,fontSize:1.6})}],message:'เพิ่ม Lot ตัวอย่างแล้ว โปรดใส่ค่าจริงก่อนพิมพ์'};
 if(/center|กลาง/.test(p)&&target)return {commands:[{op:'update',id:target.id,changes:{x:(doc.width-target.width)/2}}],message:'จัดวัตถุให้อยู่กึ่งกลางแนวนอนแล้ว'};
 if(/right|ขวา/.test(p)&&target)return {commands:[{op:'update',id:target.id,changes:{x:Math.max(0,doc.width-target.width-2),y:/top|บน/.test(p)?2:target.y}}],message:'ย้ายวัตถุแล้ว สามารถ Undo ได้'};
 if(/left|ซ้าย/.test(p)&&target)return {commands:[{op:'update',id:target.id,changes:{x:2}}],message:'ย้ายวัตถุไปด้านซ้ายแล้ว'};
 if(/bold|หนา/.test(p)&&target?.kind==='text')return {commands:[{op:'update',id:target.id,changes:{bold:true}}],message:'ปรับข้อความเป็นตัวหนาแล้ว'};
 throw Error('โหมดทดลองรองรับสร้างฉลาก ย้ายราคา จัดบาร์โค้ดกึ่งกลาง เพิ่ม Lot และตัวหนา เชื่อม Go API เพื่อใช้ AI จริง');
}
