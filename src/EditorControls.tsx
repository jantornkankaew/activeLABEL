import type {BarcodeDraft} from './useBarcodeDrafts';
import {useEffect,useRef,useState, type CSSProperties, type RefObject, type ReactNode} from 'react';
import {barcodeTypes,barcodeRatio,validateBarcode,barcodeSuggestion,type Symbology} from './barcodes';
import {fontNames,type FontName} from './typography';
import type {LabelDocument,LabelObject} from './core';
import './editor-controls.css';

export function FontPicker({item,disabled,onUpdate}:{item:LabelObject;disabled?:boolean;onUpdate:(changes:Partial<LabelObject>)=>void}) {
 return <><label>Font name<select aria-label="Font name" value={item.fontName??'Noto Sans'} disabled={disabled} onChange={e=>onUpdate({fontName:e.target.value as FontName})}>{fontNames.map(name=><option key={name}>{name}</option>)}</select></label><p className="automatic-size">ขนาดข้อความอัตโนมัติ: {item.width.toFixed(2)} × {item.height.toFixed(2)} mm</p></>;
}
export function BarcodeEditor({item,disabled,onUpdate,draft,onDraftChange}:{item:LabelObject;doc:LabelDocument;disabled?:boolean;onUpdate:(changes:Partial<LabelObject>)=>boolean|void;draft?:BarcodeDraft;onDraftChange?:(draft:BarcodeDraft)=>void}) {
 const [content,setContent]=useState(draft?.content??item.content);const [type,setType]=useState<Symbology>(draft?.type??item.symbology);const [error,setError]=useState(draft?.error??'');const signature=JSON.stringify([item.id,item.content,item.symbology]);const lastModel=useRef(signature);
 useEffect(()=>{if(lastModel.current===signature)return;lastModel.current=signature;setContent(item.content);setType(item.symbology);setError('');onDraftChange?.({content:item.content,type:item.symbology,error:''});},[signature]);
 function change(nextType:Symbology,nextContent:string){setContent(nextContent);setType(nextType);try{validateBarcode(nextType,nextContent);if((nextType!==item.symbology||nextContent!==item.content)&&onUpdate({content:nextContent,symbology:nextType})===false)throw Error('บาร์โค้ดไม่พอดีกับฉลาก กรุณาลดขนาดหรือย้ายตำแหน่ง');setError('');onDraftChange?.({content:nextContent,type:nextType,error:''});}catch(err){const message=(err as Error).message;setError(message);onDraftChange?.({content:nextContent,type:nextType,error:message});}}
 const suggestion=error?barcodeSuggestion(type,content):undefined;
 return <div className="barcode-editor"><label>Barcode data<input aria-label="Barcode data" aria-invalid={Boolean(error)} aria-describedby={error?'barcode-error':undefined} value={content} disabled={disabled} onChange={e=>change(type,e.target.value)}/></label><label>Symbology<select aria-label="Barcode type" disabled={disabled} value={type} onChange={e=>change(e.target.value as Symbology,content)}>{barcodeTypes.map(t=><option key={t.value} value={t.value}>{t.name}</option>)}</select></label>
 {error?<div className="barcode-error" id="barcode-error" role="alert">{error}<br/>ยังแสดงบาร์โค้ดล่าสุดที่ถูกต้อง กรุณาแก้ข้อมูลก่อนพิมพ์{suggestion&&<><code>{suggestion.value}</code><button disabled={disabled} onClick={()=>change(type,suggestion.value)}>{suggestion.label}</button></>}<button disabled={disabled} onClick={()=>change(item.symbology,item.content)}>กลับไปค่าล่าสุด</button></div>:<div className="barcode-status">✓ อัปเดตอัตโนมัติ</div>}
 <p className="automatic-size">🔒 ล็อกสัดส่วน {barcodeRatio(item.symbology,item.content).toFixed(3)} : 1 · ปรับกว้าง/สูง หรือดึงมุมบาร์โค้ด</p></div>;
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
