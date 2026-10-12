import {useState, type CSSProperties, type RefObject, type ReactNode} from 'react';
import {barcodeTypes,barcodeRatio,type Symbology} from './barcodes';
import {fontNames,type FontName} from './typography';
import type {LabelDocument,LabelObject} from './core';
import './editor-controls.css';

export function FontPicker({item,disabled,onUpdate}:{item:LabelObject;disabled?:boolean;onUpdate:(changes:Partial<LabelObject>)=>void}) {
 return <><label>Font name<select aria-label="Font name" value={item.fontName??'Noto Sans'} disabled={disabled} onChange={e=>onUpdate({fontName:e.target.value as FontName})}>{fontNames.map(name=><option key={name}>{name}</option>)}</select></label><p className="automatic-size">ขนาดข้อความอัตโนมัติ: {item.width.toFixed(2)} × {item.height.toFixed(2)} mm</p></>;
}
export function BarcodeEditor({item,doc,disabled,onUpdate}:{item:LabelObject;doc:LabelDocument;disabled?:boolean;onUpdate:(changes:Partial<LabelObject>)=>boolean|void}) {
 const [content,setContent]=useState(item.content);const [type,setType]=useState<Symbology>(item.symbology);
 return <form className="barcode-editor" onSubmit={e=>{e.preventDefault();const changes:Partial<LabelObject>={content,symbology:type};onUpdate(changes);}}>
 <label>Barcode data<input aria-label="Barcode data" value={content} disabled={disabled} onChange={e=>setContent(e.target.value)}/></label><label>Symbology<select aria-label="Barcode type" disabled={disabled} value={type} onChange={e=>setType(e.target.value as Symbology)}>{barcodeTypes.map(t=><option key={t.value} value={t.value}>{t.name}</option>)}</select></label><button disabled={disabled} type="submit">Apply barcode</button><p className="automatic-size">เปลี่ยนประเภทและข้อมูลแล้วกด Apply · ข้อมูลเดิมจะคงอยู่จนกว่าค่าจะถูกต้อง</p><p className="automatic-size">🔒 ล็อกสัดส่วน {barcodeRatio(item.symbology,item.content).toFixed(3)} : 1 · เปลี่ยนกว้างหรือสูง อีกด้านปรับอัตโนมัติ</p></form>;
}
export function LabelSizeDialog({doc,onResize,onClose}:{doc:LabelDocument;onResize:(width:number,height:number)=>boolean;onClose:()=>void}) {
 const [width,setWidth]=useState(doc.width);const [height,setHeight]=useState(doc.height);const [error,setError]=useState('');
 return <div className="size-backdrop" onKeyDown={e=>{if(e.key==='Escape')onClose();}}><form className="size-dialog" role="dialog" aria-modal="true" aria-labelledby="size-title" onSubmit={e=>{e.preventDefault();if(onResize(width,height))onClose();else setError('ปรับขนาดไม่ได้ ตรวจว่าขนาด 10–300 mm และวัตถุทั้งหมดอยู่ภายในฉลาก');}}><h2 id="size-title">Label size</h2><p>ตั้งขนาดฉลากจริงเป็นมิลลิเมตร</p><label>Width (mm)<input autoFocus aria-label="Label width" type="number" min="10" max="300" step="0.1" required value={width} onChange={e=>setWidth(Number(e.target.value))}/></label><label>Height (mm)<input aria-label="Label height" type="number" min="10" max="300" step="0.1" required value={height} onChange={e=>setHeight(Number(e.target.value))}/></label><label>Presets<select value="custom" onChange={e=>{const [w,h]=e.target.value.split('x').map(Number);if(w){setWidth(w);setHeight(h);}}}><option value="custom">Custom size</option>{['50x30','60x40','100x50'].map(v=><option key={v} value={v}>{v.replace('x',' × ')} mm</option>)}</select></label>{error&&<p role="alert">{error}</p>}<div><button type="button" onClick={onClose}>Cancel</button><button type="submit">Apply size</button></div></form></div>;
}
export function RulerCanvas({doc,paperRef,style,children,onSize}:{doc:LabelDocument;paperRef:RefObject<HTMLDivElement|null>;style?:CSSProperties;children:ReactNode;onSize:()=>void}) {
 const [cursor,setCursor]=useState<{x:number;y:number}|null>(null);
 const ticks=(length:number)=>Array.from({length:Math.floor(length/5)+1},(_,i)=>i*5);
 return <div className="ruler-frame" style={style}>
 <div className="ruler-corner">mm</div><div className="ruler-horizontal" aria-label="Horizontal ruler">{ticks(doc.width).map(v=><span key={v} style={{left:`${v/doc.width*100}%`}}>{v%10===0?v:''}</span>)}{cursor&&<i style={{left:`${cursor.x/doc.width*100}%`}}/>}</div>
 <div className="ruler-vertical" aria-label="Vertical ruler">{ticks(doc.height).map(v=><span key={v} style={{top:`${v/doc.height*100}%`}}>{v%10===0?v:''}</span>)}{cursor&&<i style={{top:`${cursor.y/doc.height*100}%`}}/>}</div>
 <div ref={paperRef} className="editor-paper" style={{aspectRatio:`${doc.width}/${doc.height}`}} onDoubleClick={onSize} onPointerMove={e=>{const svg=paperRef.current?.querySelector('svg');if(!svg)return;const r=svg.getBoundingClientRect();setCursor({x:Math.max(0,Math.min(doc.width,(e.clientX-r.left)*doc.width/r.width)),y:Math.max(0,Math.min(doc.height,(e.clientY-r.top)*doc.height/r.height))});}} onPointerLeave={()=>setCursor(null)}>{children}</div>
 <div className="cursor-position" aria-label="Cursor position">{cursor?`X ${cursor.x.toFixed(2)} · Y ${cursor.y.toFixed(2)} mm`:'Double-click label to set size'}</div></div>;
}
export function JobPicker({doc,documents,disabled,onOpen,onNew}:{doc:LabelDocument;documents:LabelDocument[];disabled?:boolean;onOpen:(id:string)=>void;onNew:()=>void}) {
 return <div className="job-picker"><label>ไฟล์งาน<select aria-label="Open label file" disabled={disabled} value={doc.id} onChange={e=>onOpen(e.target.value)}>{documents.map(d=><option key={d.id} value={d.id}>{d.title} · {d.width} × {d.height} mm</option>)}</select></label><button disabled={disabled} onClick={onNew}>+ New label</button><small>บันทึกอัตโนมัติ · ดาวน์โหลด JSON เพื่อสำรองไฟล์</small></div>;
}
