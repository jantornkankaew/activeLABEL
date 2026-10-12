import {Unzlib,zlibSync,strToU8,strFromU8} from 'fflate';
import {migrateDocument,validate,type LabelDocument} from './core';
import {standaloneURL} from './printing';
const maxURL=16000,maxDocumentBytes=200_000;
export function shareURL(doc:LabelDocument){
 validate(doc);const bytes=strToU8(JSON.stringify(doc));if(bytes.length>maxDocumentBytes)throw Error('ฉลากใหญ่เกินลิงก์ แชร์เป็นไฟล์ JSON แทน');
 const compressed=zlibSync(bytes,{level:9});if(compressed.length>12000)throw Error('ฉลากใหญ่เกินลิงก์ แชร์เป็นไฟล์ JSON แทน');
 const encoded=btoa(String.fromCharCode(...compressed)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');const url=standaloneURL+'#share=z1.'+encoded;
 if(url.length>maxURL)throw Error('ฉลากใหญ่เกินลิงก์ แชร์เป็นไฟล์ JSON แทน');return url;
}
export function documentFromShareHash(hash:string):LabelDocument|null{
 if(!hash.startsWith('#share=')||hash.length>maxURL)return null;
 try{const value=hash.slice(7);let json:string;
 if(value.startsWith('z1.')){
 const encoded=value.slice(3);if(!encoded||!/^[A-Za-z0-9_-]+$/.test(encoded)||encoded.length%4===1)return null;
 const input=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));let length=0;const chunks:Uint8Array[]=[];let finished=false;
 const decoder=new Unzlib((chunk,final)=>{length+=chunk.length;if(length>maxDocumentBytes)throw Error('Shared document is too large');chunks.push(chunk);finished=final;});
 // Bound each expansion step so a small malicious link cannot allocate an unbounded document.
 for(let offset=0;offset<input.length;offset+=64)decoder.push(input.subarray(offset,offset+64),offset+64>=input.length);
 if(!finished)return null;const output=new Uint8Array(length);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}json=strFromU8(output);
 }else json=decodeURIComponent(value);
 if(strToU8(json).length>maxDocumentBytes)return null;return migrateDocument(JSON.parse(json));
 }catch{return null;}
}
export function readSharedDocument(){return typeof window==='undefined'?null:documentFromShareHash(window.location.hash);}
