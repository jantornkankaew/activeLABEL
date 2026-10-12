import {useState} from 'react';
import type {LabelDocument} from './core';
import {shareURL} from './sharing';
export function ShareDialog({doc,onClose}:{doc:LabelDocument;onClose:()=>void}){
 const [status,setStatus]=useState('');let url='',error='';try{url=shareURL(doc);}catch(e){error=(e as Error).message;}
 const file=()=>new File([JSON.stringify(doc,null,2)],'labelcraft.json',{type:'application/json'});
 async function copy(){try{await navigator.clipboard.writeText(url);setStatus('คัดลอกลิงก์แล้ว');}catch{setStatus('คัดลอกอัตโนมัติไม่ได้ เลือกลิงก์แล้วคัดลอกเองได้');}}
 async function share(){try{const f=file();if(navigator.canShare?.({files:[f]}))await navigator.share({title:doc.title,files:[f]});else if(url&&navigator.share)await navigator.share({title:doc.title,url});else{setStatus('เบราว์เซอร์นี้ไม่มีหน้าต่างแชร์ ใช้ Copy link หรือ Download file');return;}setStatus('ปิดหน้าต่างแชร์แล้ว');}catch(e){setStatus((e as Error).name==='AbortError'?'ยกเลิกการแชร์':(e as Error).message);}}
 function download(){const u=URL.createObjectURL(file());const a=document.createElement('a');a.href=u;a.download='labelcraft.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);setStatus('ดาวน์โหลดไฟล์สำหรับแชร์แล้ว');}
 return <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><h2 id="share-title">Share label</h2><p>ผู้รับเปิดลิงก์เพื่อรับสำเนาฉลากที่แก้ไขได้ หรือเปิดไฟล์ JSON จาก File → Open file</p><p>ลิงก์มีข้อมูลฉลาก ผู้ที่ได้รับลิงก์จะอ่านข้อมูลได้ การแก้ไขภายหลังไม่ซิงก์ระหว่างกัน</p>{url?<label>Share link<input aria-label="Share link" readOnly value={url} onFocus={e=>e.currentTarget.select()}/></label>:<p role="status">{error}</p>}<div className="modal-actions"><button onClick={onClose}>Close</button><button onClick={download}>Download file</button><button disabled={!url} onClick={()=>void copy()}>Copy link</button><button onClick={()=>void share()}>Share…</button></div>{status&&<p role="status">{status}</p>}</div></div>;
}
