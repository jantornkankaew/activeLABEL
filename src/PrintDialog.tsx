import {barcodeDeviceScale,barcodeMagnification} from './barcodes';
import {barcodePreflight} from './barcodePreflight';
import {useMeasurements} from './MeasurementContext';
import {useEffect,useRef,useState} from 'react';
import {Printer,X} from 'lucide-react';
import type {LabelDocument,Command} from './core';
import {LabelSvg} from './renderer';
import {fontStyles} from './fontStyles';
import {openSystemPrint} from './printing';
import './print-dialog.css';
export function PrintDialog({doc,getSVG,onClose,onAdjust}:{doc:LabelDocument;getSVG:()=>string;onClose:()=>void;onAdjust:(commands:Command[])=>boolean}){
 const {settings,setSettings}=useMeasurements();
 const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
 const dialog=useRef<HTMLDivElement>(null);const close=useRef(onClose);close.current=onClose;const preparing=useRef(busy);preparing.current=busy;
 const preflight=barcodePreflight(doc,settings.dpi);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const root=dialog.current!;root.focus();function keys(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!preparing.current)close.current();}if(e.key==='Tab'){const items=Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),summary'));const first=items[0],last=items.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root)){e.preventDefault();first?.focus();}}}root.addEventListener('keydown',keys);return()=>{root.removeEventListener('keydown',keys);previous?.focus();};},[]);
 function adjustDPI(dpi:number){const commands:Command[]=doc.objects.filter(o=>o.kind==='barcode').flatMap(o=>{const next=barcodeDeviceScale(o,dpi);return Math.abs(next-barcodeMagnification(o))<1e-7?[]:[{op:'update' as const,id:o.id,changes:{barcodeScale:next}}];});if(commands.length&&!onAdjust(commands)){setStatus('มีบาร์โค้ดล็อกอยู่ หรือ ratio อยู่นอกช่วง');return false;}setSettings({...settings,dpi});setStatus('');return true;}
 async function print(){if(busy||preflight.errors.length)return;setBusy(true);setStatus('');try{await openSystemPrint(doc,getSVG(),1);}catch(error){setStatus((error as Error).message);}finally{setBusy(false);}}
 return <div className="modal-backdrop"><div ref={dialog} tabIndex={-1} className="modal print-modal print-compact" role="dialog" aria-modal="true" aria-labelledby="print-title">
 <div className="print-heading"><div><h2 id="print-title">Print</h2><p title={doc.title}>{doc.title}</p></div><button aria-label="Close print" disabled={busy} onClick={onClose}><X size={20}/></button></div>
 <div className="print-proof"><div className="print-proof-paper" style={{aspectRatio:`${doc.width}/${doc.height}`,width:`min(100%, ${260*doc.width/doc.height}px)`}}><LabelSvg doc={doc} fonts={fontStyles}/></div></div>
 <div className="print-specs"><span>{Number(doc.width.toFixed(2))} × {Number(doc.height.toFixed(2))} <small>mm</small></span><label>DPI<select aria-label="Print DPI" value={settings.dpi} disabled={busy} onChange={e=>adjustDPI(Number(e.target.value))}>{[203,300,600].map(dpi=><option key={dpi}>{dpi}</option>)}</select></label></div>
 {preflight.errors.length>0&&<div className="barcode-error" role="alert">{preflight.errors.map(message=><p key={message}>{message}</p>)}</div>}
 {preflight.warnings.length>0&&<details className="print-checks"><summary>ตรวจบาร์โค้ด ({preflight.warnings.length})</summary>{preflight.warnings.map(message=><p key={message}>{message}</p>)}</details>}
 {status&&<p className="print-failure" role="alert">{status}</p>}
 <div className="print-bottom"><details className="print-tips"><summary>ตั้งค่าการพิมพ์</summary><p>เลือกเครื่องพิมพ์และจำนวนสำเนาใน Chrome<br/>Scale 100% · Margins None<br/>ขนาดกระดาษตรงกับฉลาก · ปิด Headers and footers</p><p>ไม่พบเครื่องพิมพ์: Destination → See more… หรือ Print using system dialog…</p></details><button className="primary" disabled={busy||preflight.errors.length>0} onClick={()=>void print()}><Printer size={16}/>{busy?'Preparing…':'Print…'}</button></div>
 </div></div>;
}
