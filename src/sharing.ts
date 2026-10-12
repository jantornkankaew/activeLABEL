import {migrateDocument,validate,type LabelDocument} from './core';
import {standaloneURL} from './printing';
export function shareURL(doc:LabelDocument){validate(doc);const url=standaloneURL+'#share='+encodeURIComponent(JSON.stringify(doc));if(url.length>16000)throw Error('ฉลากใหญ่เกินลิงก์ แชร์เป็นไฟล์ JSON แทน');return url;}
export function readSharedDocument(){if(typeof window==='undefined'||!window.location.hash.startsWith('#share='))return null;try{if(window.location.hash.length>16000)return null;return migrateDocument(JSON.parse(decodeURIComponent(window.location.hash.slice(7))));}catch{return null;}}
