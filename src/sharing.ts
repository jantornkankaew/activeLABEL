import {Unzlib,zlibSync,strToU8,strFromU8} from 'fflate';
import {migrateDocument,validate,type LabelDocument} from './core';
import {standaloneURL} from './printing';
const maxURL=16000,maxDocumentBytes=200_000;

const legacyObjectFields=['id','name','kind','x','y','width','height','content','fontSize','bold','locked','symbology','fontName','line','barcodeScale'] as const;
const textObjectFields=[...legacyObjectFields,'template','italic','underline','autoSize','textAlign'] as const;
const objectFields=[...textObjectFields,'barHeightScale','barTopStyle'] as const;
function compact(doc:LabelDocument){return [doc.id,doc.revision,doc.title,doc.width,doc.height,doc.objects.map(o=>objectFields.map(key=>o[key]??null)),doc.variables??null,doc.settings??null];}
function expand(value:unknown):LabelDocument{if(!Array.isArray(value)||![6,7,8].includes(value.length)||!Array.isArray(value[5]))throw Error('Invalid snapshot');const [id,revision,title,width,height,rows,variables,settings]=value;return {schemaVersion:1,id,revision,title,width,height,objects:rows.map((row:unknown)=>{if(!Array.isArray(row)||row.length!==legacyObjectFields.length&&row.length!==textObjectFields.length&&row.length!==objectFields.length)throw Error('Invalid object');const fields=row.length===legacyObjectFields.length?legacyObjectFields:row.length===textObjectFields.length?textObjectFields:objectFields;return Object.fromEntries(fields.flatMap((key,i)=>row[i]===null?[]:[[key,row[i]]]));}),...(variables?{variables}:{}),...(settings?{settings}:{})} as LabelDocument;}

export function shareURL(doc:LabelDocument){
 validate(doc);const bytes=strToU8(JSON.stringify(doc));if(bytes.length>maxDocumentBytes)throw Error('ฉลากใหญ่เกินลิงก์ แชร์เป็นไฟล์ JSON แทน');
 const compressed=zlibSync(strToU8(JSON.stringify(compact(doc))),{level:9});if(compressed.length>12000)throw Error('ฉลากใหญ่เกินลิงก์ แชร์เป็นไฟล์ JSON แทน');
 const encoded=btoa(String.fromCharCode(...compressed)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');const url=standaloneURL+'#share=z2.'+encoded;
 if(url.length>maxURL)throw Error('ฉลากใหญ่เกินลิงก์ แชร์เป็นไฟล์ JSON แทน');return url;
}
export function documentFromShareHash(hash:string):LabelDocument|null{
 if(!hash.startsWith('#share=')||hash.length>maxURL)return null;
 try{const value=hash.slice(7);let json:string;
 if(value.startsWith('z1.')||value.startsWith('z2.')){
 const encoded=value.slice(3);if(!encoded||!/^[A-Za-z0-9_-]+$/.test(encoded)||encoded.length%4===1)return null;
 const input=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));let length=0;const chunks:Uint8Array[]=[];let finished=false;
 const decoder=new Unzlib((chunk,final)=>{length+=chunk.length;if(length>maxDocumentBytes)throw Error('Shared document is too large');chunks.push(chunk);finished=final;});
 // Bound each expansion step so a small malicious link cannot allocate an unbounded document.
 for(let offset=0;offset<input.length;offset+=64)decoder.push(input.subarray(offset,offset+64),offset+64>=input.length);
 if(!finished)return null;const output=new Uint8Array(length);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}json=strFromU8(output);
 }else json=decodeURIComponent(value);
 if(strToU8(json).length>maxDocumentBytes)return null;return migrateDocument(value.startsWith('z2.')?expand(JSON.parse(json)):JSON.parse(json));
 }catch{return null;}
}
export function readSharedDocument(){return typeof window==='undefined'?null:documentFromShareHash(window.location.hash);}
