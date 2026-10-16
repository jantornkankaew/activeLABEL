import {barcodePreflight} from './barcodePreflight';
import {useEffect,useMemo,useRef,useState} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
 Printer,
 X,
 ChevronLeft,
 ChevronRight,
 ChevronsLeft,
 ChevronsRight,
 Minus,
 Plus,
} from 'lucide-react';
import {defaultDocumentSettings,type LabelDocument,type Command} from './core';
import {LabelSvg,exportSvg} from './renderer';
import {fontStyles} from './fontStyles';
import {openSystemPrint} from './printing';
import {resolveDocument,usedVariables,variableValues} from './variables';
import './print-dialog.css';

export function PrintDialog({
 doc,
 onClose,
 onAdjust,
}:{
 doc:LabelDocument;
 onClose:()=>void;
 onAdjust:(commands:Command[])=>boolean;
}){
 const labelDpi=doc.settings?.dpi??defaultDocumentSettings.dpi;
 const asked=usedVariables(doc).filter(variable=>variable.prompt);
 const [values,setValues]=useState(()=>variableValues(doc.variables));
 const [copies,setCopies]=useState(1);
 const [serialCount,setSerialCount]=useState(1);
 const [previewIndex,setPreviewIndex]=useState(0);
 const [jumpDraft,setJumpDraft]=useState('1');
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const preview=useRef<HTMLDivElement>(null);

 const missingValues=asked.filter(variable=>!(values[variable.name]??'').trim());
 const dialog=useRef<HTMLDivElement>(null);
 const close=useRef(onClose);
 close.current=onClose;
 const preparing=useRef(busy);
 preparing.current=busy;

 const clampedPreviewIndex=Math.max(0,Math.min(serialCount-1,previewIndex));

 useEffect(()=>{
  if(previewIndex!==clampedPreviewIndex){
   setPreviewIndex(clampedPreviewIndex);
  }
  setJumpDraft(String(clampedPreviewIndex+1));
 },[clampedPreviewIndex,previewIndex,serialCount]);

 function goToSerial(index:number){
  const target=Math.max(0,Math.min(serialCount-1,Math.floor(index)));
  setPreviewIndex(target);
  setJumpDraft(String(target+1));
 }

 function updateCopies(next:number){
  const bounded=Math.max(1,Math.min(100,Math.floor(Number.isFinite(next)?next:1)));
  setCopies(bounded);
 }

 function updateSerialCount(next:number){
  const bounded=Math.max(1,Math.min(500,Math.floor(Number.isFinite(next)?next:1)));
  setSerialCount(bounded);
  if(previewIndex>=bounded){
   setPreviewIndex(bounded-1);
   setJumpDraft(String(bounded));
  }
 }

 const resolved=useMemo(()=>{
  try{
   return {doc:resolveDocument(doc,values,clampedPreviewIndex),error:''};
  }catch(error){
   return {doc,error:(error as Error).message};
  }
 },[doc,values,clampedPreviewIndex]);

 const preflight=resolved.error
  ?{errors:[resolved.error],warnings:[]}
  :barcodePreflight(resolved.doc,labelDpi);

 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const root=dialog.current!;
  root.focus();
  function keys(e:KeyboardEvent){
   if(e.key==='Escape'){
    e.preventDefault();
    e.stopPropagation();
    if(!preparing.current)close.current();
   }
   if(e.key==='Tab'){
    const items=Array.from(
     root.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),summary'
     )
    );
    const first=items[0],
     last=items.at(-1);
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){
     e.preventDefault();
     last?.focus();
    }else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root)){
     e.preventDefault();
     first?.focus();
    }
   }
  }
  root.addEventListener('keydown',keys);
  return()=>{
   root.removeEventListener('keydown',keys);
   previous?.focus();
  };
 },[]);

 function remember(name:string){
  const value=values[name]??'';
  const variables=(doc.variables??[]).map(variable=>
   variable.name===name?{...variable,value}:variable
  );
  if(
   variables.some(
    (variable,index)=>variable.value!==(doc.variables??[])[index]?.value
   )&&
   !onAdjust([{op:'setVariables',variables}])
  )
   setStatus('จำค่า Variable ไม่สำเร็จ กรุณาตรวจสอบค่า');
 }

 async function print(){
  if(busy||preflight.errors.length||missingValues.length)return;
  setBusy(true);
  setStatus('');
  try{
   if(serialCount===1){
    const svg=preview.current?.querySelector('svg');
    if(!svg)throw Error('Print preview unavailable');
    await openSystemPrint(resolved.doc,exportSvg(resolved.doc,svg.outerHTML),copies);
   }else{
    const serialSvgs:string[]=[];
    let firstDoc=resolved.doc;
    for(let s=0;s<serialCount;s++){
     const sDoc=resolveDocument(doc,values,s);
     if(s===0)firstDoc=sDoc;
     const check=barcodePreflight(sDoc,labelDpi);
     if(check.errors.length){
      throw Error(`ฉลากใบที่ ${s+1}: ${check.errors[0]}`);
     }
     const rawMarkup=renderToStaticMarkup(<LabelSvg doc={sDoc} fonts={fontStyles}/>);
     serialSvgs.push(exportSvg(sDoc,rawMarkup));
    }
    await openSystemPrint(firstDoc,serialSvgs,copies);
   }
  }catch(error){
   setStatus((error as Error).message);
  }finally{
   setBusy(false);
  }
 }

 const totalLabels=serialCount*copies;

 return (
  <div className="modal-backdrop">
   <div
    ref={dialog}
    tabIndex={-1}
    className="modal print-modal print-compact"
    role="dialog"
    aria-modal="true"
    aria-labelledby="print-title"
   >
    <div className="print-heading">
     <div>
      <h2 id="print-title">Print</h2>
      <p title={doc.title}>{doc.title}</p>
     </div>
     <button aria-label="Close print" disabled={busy} onClick={onClose}>
      <X size={20}/>
     </button>
    </div>

    {asked.length>0&&(
     <section className="print-variables" aria-labelledby="print-values-title">
      <div className="print-variables-heading">
       <h3 id="print-values-title">Before printing</h3>
       <span>
        {asked.length} {asked.length===1?'value':'values'}
       </span>
      </div>
      <p>Enter the information for this label</p>
      <div className="print-variable-grid">
       {asked.map((variable,index)=>{
        const empty=!(values[variable.name]??'').trim();
        return (
         <label key={variable.name}>
          <span>
           {index+1}. {variable.label||variable.name}
           <b aria-hidden="true">*</b>
          </span>
          <input
           aria-label={`Print variable ${variable.name}`}
           required
           aria-invalid={empty}
           value={values[variable.name]??''}
           placeholder={`Enter ${variable.label||variable.name}`}
           onChange={e=>
            setValues(current=>({...current,[variable.name]:e.target.value}))
           }
           onBlur={()=>remember(variable.name)}
          />
          {empty&&<small>Required</small>}
         </label>
        );
       })}
      </div>
     </section>
    )}

    {/* Print Quantity Controls: Copies & Serials */}
    <section className="print-quantity-bar" aria-label="Print quantity settings">
     <div className="print-qty-field">
      <div className="print-qty-label">
       <strong>จำนวน Copy</strong>
       <small>สำเนาต่อใบ</small>
      </div>
      <div className="print-qty-stepper">
       <button
        type="button"
        className="qty-step-btn"
        aria-label="Decrease copies"
        disabled={busy||copies<=1}
        onClick={()=>updateCopies(copies-1)}
       >
        <Minus size={13}/>
       </button>
       <input
        type="number"
        className="qty-number-input"
        aria-label="จำนวน Copy"
        min={1}
        max={100}
        disabled={busy}
        value={copies}
        onChange={e=>updateCopies(Number(e.target.value))}
       />
       <button
        type="button"
        className="qty-step-btn"
        aria-label="Increase copies"
        disabled={busy||copies>=100}
        onClick={()=>updateCopies(copies+1)}
       >
        <Plus size={13}/>
       </button>
      </div>
     </div>

     <div className="print-qty-divider"/>

     <div className="print-qty-field">
      <div className="print-qty-label">
       <strong>จำนวน Serial</strong>
       <small>รันเลขต่อเนื่อง</small>
      </div>
      <div className="print-qty-stepper">
       <button
        type="button"
        className="qty-step-btn"
        aria-label="Decrease serial count"
        disabled={busy||serialCount<=1}
        onClick={()=>updateSerialCount(serialCount-1)}
       >
        <Minus size={13}/>
       </button>
       <input
        type="number"
        className="qty-number-input"
        aria-label="จำนวน Serial"
        min={1}
        max={500}
        disabled={busy}
        value={serialCount}
        onChange={e=>updateSerialCount(Number(e.target.value))}
       />
       <button
        type="button"
        className="qty-step-btn"
        aria-label="Increase serial count"
        disabled={busy||serialCount>=500}
        onClick={()=>updateSerialCount(serialCount+1)}
       >
        <Plus size={13}/>
       </button>
      </div>
     </div>
    </section>

    {/* Label Preview & Serial Navigation */}
    <div className="print-proof">
     <div
      ref={preview}
      className="print-proof-paper"
      style={{
       aspectRatio:`${doc.width}/${doc.height}`,
       width:`min(100%, ${260*doc.width/doc.height}px)`,
      }}
     >
      <LabelSvg doc={resolved.doc} fonts={fontStyles}/>
     </div>

     {/* Serial Preview Navigator */}
     <div className="print-serial-nav" aria-label="Serial preview navigation">
      <button
       type="button"
       className="serial-nav-btn"
       aria-label="ฉลากแรก"
       title="เลื่อนไปฉลากแรก (ใบที่ 1)"
       disabled={busy||clampedPreviewIndex<=0}
       onClick={()=>goToSerial(0)}
      >
       <ChevronsLeft size={15}/>
      </button>
      <button
       type="button"
       className="serial-nav-btn"
       aria-label="ฉลากก่อนหน้า"
       title="ฉลากก่อนหน้า"
       disabled={busy||clampedPreviewIndex<=0}
       onClick={()=>goToSerial(clampedPreviewIndex-1)}
      >
       <ChevronLeft size={15}/>
      </button>

      <div className="serial-nav-jump">
       <span>ฉลากใบที่</span>
       <input
        type="number"
        className="serial-jump-input"
        aria-label="ระบุหมายเลขฉลากที่ต้องการดู"
        min={1}
        max={serialCount}
        disabled={busy}
        value={jumpDraft}
        onChange={e=>{
         const raw=e.target.value;
         setJumpDraft(raw);
         const parsed=parseInt(raw,10);
         if(Number.isFinite(parsed)&&parsed>=1&&parsed<=serialCount){
          setPreviewIndex(parsed-1);
         }
        }}
        onBlur={()=>{
         const parsed=parseInt(jumpDraft,10);
         if(Number.isFinite(parsed)){
          goToSerial(parsed-1);
         }else{
          setJumpDraft(String(clampedPreviewIndex+1));
         }
        }}
        onKeyDown={e=>{
         if(e.key==='Enter'){
          e.preventDefault();
          const parsed=parseInt(jumpDraft,10);
          if(Number.isFinite(parsed))goToSerial(parsed-1);
         }
        }}
       />
       <span>/ {serialCount}</span>
      </div>

      <button
       type="button"
       className="serial-nav-btn"
       aria-label="ฉลากถัดไป"
       title="ฉลากถัดไป"
       disabled={busy||clampedPreviewIndex>=serialCount-1}
       onClick={()=>goToSerial(clampedPreviewIndex+1)}
      >
       <ChevronRight size={15}/>
      </button>
      <button
       type="button"
       className="serial-nav-btn"
       aria-label="ฉลากสุดท้าย"
       title={`เลื่อนไปฉลากสุดท้าย (ใบที่ ${serialCount})`}
       disabled={busy||clampedPreviewIndex>=serialCount-1}
       onClick={()=>goToSerial(serialCount-1)}
      >
       <ChevronsRight size={15}/>
      </button>
     </div>
    </div>

    <div className="print-specs">
     <span>
      {Number(doc.width.toFixed(2))} × {Number(doc.height.toFixed(2))} <small>mm</small>
      <span className="print-dpi-tag">· {labelDpi} DPI</span>
     </span>
     <span className="print-total-summary">
      รวมพิมพ์ <strong>{totalLabels}</strong> ดวง
      <small>
       ({serialCount} Serial × {copies} Copy)
      </small>
     </span>
    </div>

    {preflight.errors.length>0&&(
     <div className="barcode-error" role="alert">
      {preflight.errors.map(message=>(
       <p key={message}>{message}</p>
      ))}
     </div>
    )}
    {preflight.warnings.length>0&&(
     <details className="print-checks">
      <summary>ตรวจบาร์โค้ด ({preflight.warnings.length})</summary>
      {preflight.warnings.map(message=>(
       <p key={message}>{message}</p>
      ))}
     </details>
    )}
    {status&&(
     <p className="print-failure" role="alert">
      {status}
     </p>
    )}

    <div className="print-bottom">
     <details className="print-tips">
      <summary>ตั้งค่าการพิมพ์</summary>
      <p>
       เลือกเครื่องพิมพ์ใน Chrome
       <br/>
       Scale 100% · Margins None
       <br/>
       ขนาดกระดาษตรงกับฉลาก · ปิด Headers and footers
      </p>
      <p>
       ไม่พบเครื่องพิมพ์: Destination → See more… หรือ Print using system dialog…
      </p>
     </details>
     <button
      className="primary"
      disabled={busy||preflight.errors.length>0||missingValues.length>0}
      onClick={()=>void print()}
     >
      <Printer size={16}/>
      {busy?'Preparing…':totalLabels>1?`Print (${totalLabels})…`:'Print…'}
     </button>
    </div>
   </div>
  </div>
 );
}
