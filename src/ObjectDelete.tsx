import {useEffect,useRef,useState} from 'react';
import {Trash2} from 'lucide-react';
import type {Command,LabelDocument,LabelObject} from './core';
import './object-delete.css';
type Target={item:LabelObject;documentId:string;revision:number};
export function useObjectDelete(doc:LabelDocument|null,item:LabelObject|undefined,enabled:boolean,commit:(commands:Command[],revision?:number)=>boolean,onDeleted:()=>void){
 const [target,setTarget]=useState<Target|null>(null);
 function request(){if(enabled&&doc&&item&&!item.locked)setTarget({item:structuredClone(item),documentId:doc.id,revision:doc.revision});}
 useEffect(()=>{if(target&&(!enabled||doc?.id!==target.documentId||doc.revision!==target.revision))setTarget(null);},[doc?.id,doc?.revision,enabled,target]);
 useEffect(()=>{function key(event:KeyboardEvent){const node=event.target;if(event.key!=='Delete'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||!enabled||!item||item.locked||target)return;if(node instanceof Element&&(node.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),dialog,[role="dialog"]')||document.querySelector('dialog[open],[role="dialog"]')))return;event.preventDefault();request();}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 function confirm(){if(!target||!enabled||doc?.id!==target.documentId||doc.revision!==target.revision)return;if(commit([{op:'remove',id:target.item.id}],target.revision)){setTarget(null);onDeleted();}}
 return {request,dialog:target?<ObjectDeleteDialog name={target.item.name} onCancel={()=>setTarget(null)} onConfirm={confirm}/>:null};
}
function ObjectDeleteDialog({name,onCancel,onConfirm}:{name:string;onCancel:()=>void;onConfirm:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);const cancel=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const node=dialog.current!;node.showModal();cancel.current?.focus();return()=>node.close();},[]);
 return <dialog ref={dialog} className="object-delete-dialog" aria-labelledby="object-delete-title" aria-describedby="object-delete-description" onCancel={event=>{event.preventDefault();onCancel();}}><div className="object-delete-icon"><Trash2 size={24}/></div><h2 id="object-delete-title">ลบวัตถุนี้?</h2><p id="object-delete-description">นำ <strong>{name}</strong> ออกจากฉลาก<br/><span>เรียกคืนได้ด้วย Undo</span></p><div className="object-delete-actions"><button ref={cancel} onClick={onCancel}>ยกเลิก</button><button className="object-delete-confirm" onClick={onConfirm}><Trash2 size={16}/> ลบวัตถุ</button></div></dialog>;
}
