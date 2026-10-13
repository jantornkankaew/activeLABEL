import {barcodeDeviceScale,barcodeMagnification} from './barcodes';
import {barcodePreflight} from './barcodePreflight';
import {useMeasurements} from './MeasurementContext';
import {useState} from 'react';
import {Printer} from 'lucide-react';
import type {LabelDocument,Command} from './core';
import {LabelSvg} from './renderer';
import {fontStyles} from './fontStyles';
import {openSystemPrint} from './printing';
export function PrintDialog({doc,getSVG,onClose,onAdjust}:{doc:LabelDocument;getSVG:()=>string;onClose:()=>void;onAdjust:(commands:Command[])=>boolean}){
 const {settings,setSettings}=useMeasurements();
 const [copies,setCopies]=useState(1);const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
 const preflight=barcodePreflight(doc,settings.dpi);
 function adjustDPI(dpi:number){const commands:Command[]=doc.objects.filter(o=>o.kind==='barcode').flatMap(o=>{const next=barcodeDeviceScale(o,dpi);return Math.abs(next-barcodeMagnification(o))<1e-7?[]:[{op:'update' as const,id:o.id,changes:{barcodeScale:next}}];});if(commands.length&&!onAdjust(commands)){setStatus('มีบาร์โค้ดล็อกอยู่ หรือ ratio อยู่นอกช่วง');return false;}setSettings({...settings,dpi});setStatus('');return true;}
 async function print(){if(busy||preflight.errors.length||!Number.isInteger(copies)||copies<1||copies>100)return;setBusy(true);setStatus('');try{await openSystemPrint(doc,getSVG(),copies);setStatus('เรียกหน้าต่างพิมพ์แล้ว · ตรวจสถานะที่คิวเครื่องพิมพ์');}catch(error){setStatus((error as Error).message);}finally{setBusy(false);}}
 return <div className="modal-backdrop"><div className="modal print-modal" role="dialog" aria-modal="true" aria-labelledby="print-title"><h2 id="print-title">Print label</h2>
 <div className="system-printer-card"><Printer size={22}/><div><strong>เลือกเครื่องพิมพ์ผ่าน Chrome</strong><p>ไม่ต้องติดตั้งตัวเชื่อม</p></div></div>
 <div className="print-options"><label>DPI<select aria-label="Print DPI" value={settings.dpi} disabled={busy} onChange={e=>adjustDPI(Number(e.target.value))}>{[203,300,600].map(dpi=><option key={dpi}>{dpi}</option>)}</select></label><label>Copies<input aria-label="Copies" type="number" min="1" max="100" step="1" value={copies} disabled={busy} onChange={e=>setCopies(Number(e.target.value))}/></label></div>
 <div className="print-preview" style={{aspectRatio:`${doc.width}/${doc.height}`}}><LabelSvg doc={doc} fonts={fontStyles}/></div><p className="print-dimensions">{doc.width.toFixed(2)} × {doc.height.toFixed(2)} mm</p>
 {preflight.errors.length>0&&<div className="barcode-error" role="alert">{preflight.errors.map(message=><p key={message}>{message}</p>)}</div>}
 {preflight.warnings.length>0&&<details className="barcode-details"><summary>ตรวจบาร์โค้ด ({preflight.warnings.length})</summary>{preflight.warnings.map(message=><p key={message}>{message}</p>)}</details>}
 <details className="printer-help"><summary>ไม่พบเครื่องพิมพ์?</summary><p>ใน Chrome เลือก Destination → See more… หรือ Print using system dialog… เครื่องพิมพ์ต้องถูกเพิ่มในระบบปฏิบัติการก่อน</p></details>
 <details className="barcode-details"><summary>ตั้งค่ากระดาษ</summary><p>ขนาดกระดาษและ DPI ให้ตรงกับเครื่องพิมพ์ · Scale 100% · Margins None · ปิด Headers and footers</p><p>Copies ใน Chrome = 1 — แอปเตรียมจำนวนหน้าตาม Copies ด้านบนแล้ว</p></details>
 {status&&<p className="print-status" role="status">{status}</p>}<div className="modal-actions"><button disabled={busy} onClick={onClose}>Close</button><button className="primary" disabled={busy||preflight.errors.length>0||!Number.isInteger(copies)||copies<1||copies>100} onClick={()=>void print()}><Printer size={16}/>{busy?'Preparing…':'เลือกเครื่องพิมพ์…'}</button></div></div></div>;
}
