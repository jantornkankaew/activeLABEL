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
 const [slideDir,setSlideDir]=useState<'next'|'prev'>('next');
 const [animKey,setAnimKey]=useState(0);
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

 function goToSerial(index:number,forcedDir?:'next'|'prev'){
  const target=Math.max(0,Math.min(serialCount-1,Math.floor(index)));
  if(target!==clampedPreviewIndex){
   setSlideDir(forcedDir??(target>clampedPreviewIndex?'next':'prev'));
   setAnimKey(k=>k+1);
   setPreviewIndex(target);
   setJumpDraft(String(target+1));
  }
 }

 function updateCopies(next:number){
  const bounded=Math.max(1,Math.min(100,Math.floor(Number.isFinite(next)?next:1)));
  setCopies(bounded);
 }

 function updateSerialCount(next:number){
  const bounded=Math.max(1,Math.min(500,Math.floor(Number.isFinite(next)?next:1)));
  setSerialCount(bounded);
  if(previewIndex>=bounded){
   setSlideDir('prev');
   setAnimKey(k=>k+1);
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

 const nextResolvedDoc=useMemo(()=>{
  if(clampedPreviewIndex+1<serialCount){
   try{
    return resolveDocument(doc,values,clampedPreviewIndex+1);
   }catch{
    return null;
   }
  }
  return null;
 },[doc,values,clampedPreviewIndex,serialCount]);

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
   if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)){
    e.preventDefault();
    if(e.key==='ArrowLeft'&&clampedPreviewIndex>0)goToSerial(clampedPreviewIndex-1,'prev');
    if(e.key==='ArrowRight'&&clampedPreviewIndex<serialCount-1)goToSerial(clampedPreviewIndex+1,'next');
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
 },[clampedPreviewIndex,serialCount]);

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

    <div className="print-dialog-body">
     {/* Left: Photo Album Preview Stage & Navigator */}
     <div className="print-album-viewport">
      <div className="print-album-stage">
       {/* Floating Side Flippers */}
       {clampedPreviewIndex>0&&(
        <button
         type="button"
         className="album-stage-flipper flipper-prev"
         aria-label="ฉลากก่อนหน้า"
         title="ฉลากก่อนหน้า (Arrow Left)"
         disabled={busy}
         onClick={()=>goToSerial(clampedPreviewIndex-1,'prev')}
        >
         <ChevronLeft size={20}/>
        </button>
       )}

       <div
        className="album-3d-scene"
        style={{
         aspectRatio:`${doc.width}/${doc.height}`,
         width:`min(100%, ${Math.max(180,Math.min(360,260*doc.width/doc.height))}px)`,
        }}
       >
        {/* Background Stack Layer 2 (Deep stack) */}
        {serialCount-clampedPreviewIndex>2&&(
         <div className="album-stack-layer layer-deep" aria-hidden="true"/>
        )}

        {/* Background Stack Layer 1 (Next upcoming card) */}
        {clampedPreviewIndex+1<serialCount&&(
         <div className="album-stack-layer layer-next" aria-hidden="true">
          {nextResolvedDoc&&(
           <div className="album-peek-content">
            <LabelSvg doc={nextResolvedDoc} fonts={fontStyles}/>
           </div>
          )}
         </div>
        )}

        {/* Active Top Card */}
        <div
         key={animKey}
         ref={preview}
         className={`print-album-card ${slideDir==='next'?'flip-next':'flip-prev'}`}
        >
         {/* Gloss light sweep overlay */}
         <div className="photo-gloss-sweep" aria-hidden="true"/>

         {/* 4 Album Photo Mounting Corners */}
         <div className="album-corner top-left" aria-hidden="true"/>
         <div className="album-corner top-right" aria-hidden="true"/>
         <div className="album-corner bottom-left" aria-hidden="true"/>
         <div className="album-corner bottom-right" aria-hidden="true"/>

         {/* Embossed Serial Badge Stamp */}
         {serialCount>1&&(
          <div className="album-serial-stamp" aria-hidden="true">
           #{String(clampedPreviewIndex+1).padStart(Math.max(2,String(serialCount).length),'0')}
          </div>
         )}

         <LabelSvg doc={resolved.doc} fonts={fontStyles}/>
        </div>
       </div>

       {clampedPreviewIndex<serialCount-1&&(
        <button
         type="button"
         className="album-stage-flipper flipper-next"
         aria-label="ฉลากถัดไป"
         title="ฉลากถัดไป (Arrow Right)"
         disabled={busy}
         onClick={()=>goToSerial(clampedPreviewIndex+1,'next')}
        >
         <ChevronRight size={20}/>
        </button>
       )}
      </div>

      {/* Album Dots Indicator (if 2 to 12 serials) */}
      {serialCount>1&&serialCount<=12&&(
       <div className="album-dots-bar" aria-label="Label page dots">
        {Array.from({length:serialCount}).map((_,i)=>(
         <button
          key={i}
          type="button"
          className={`album-dot ${i===clampedPreviewIndex?'active':''}`}
          aria-label={`ฉลากใบที่ ${i+1}`}
          title={`ไปที่ฉลากใบที่ ${i+1}`}
          disabled={busy}
          onClick={()=>goToSerial(i,i>clampedPreviewIndex?'next':'prev')}
         />
        ))}
       </div>
      )}

      {/* Floating Serial Navigator */}
      <div className="print-serial-nav" aria-label="Serial preview navigation">
       <button
        type="button"
        className="serial-nav-btn"
        aria-label="ฉลากแรก"
        title="เลื่อนไปฉลากแรก (ใบที่ 1)"
        disabled={busy||clampedPreviewIndex<=0}
        onClick={()=>goToSerial(0,'prev')}
       >
        <ChevronsLeft size={15}/>
       </button>
       <button
        type="button"
        className="serial-nav-btn"
        aria-label="ฉลากก่อนหน้า"
        title="ฉลากก่อนหน้า"
        disabled={busy||clampedPreviewIndex<=0}
        onClick={()=>goToSerial(clampedPreviewIndex-1,'prev')}
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
           const target=parsed-1;
           if(target!==clampedPreviewIndex){
            setSlideDir(target>clampedPreviewIndex?'next':'prev');
            setAnimKey(k=>k+1);
            setPreviewIndex(target);
           }
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
        onClick={()=>goToSerial(clampedPreviewIndex+1,'next')}
       >
        <ChevronRight size={15}/>
       </button>
       <button
        type="button"
        className="serial-nav-btn"
        aria-label="ฉลากสุดท้าย"
        title={`เลื่อนไปฉลากสุดท้าย (ใบที่ ${serialCount})`}
        disabled={busy||clampedPreviewIndex>=serialCount-1}
        onClick={()=>goToSerial(serialCount-1,'next')}
       >
        <ChevronsRight size={15}/>
       </button>
      </div>

      <div className="print-specs-pill">
       <span>{Number(doc.width.toFixed(2))} × {Number(doc.height.toFixed(2))} mm</span>
       <span className="dot-sep">·</span>
       <span>{labelDpi} DPI</span>
      </div>
     </div>

     {/* Right: Controls & Variables Sidebar */}
     <div className="print-sidebar">
      {/* Quantity Card */}
      <section className="print-card print-card-qty" aria-label="Print quantity settings">
       <div className="print-card-header">
        <h4>จำนวนพิมพ์</h4>
        <span className="print-badge-total">รวม {totalLabels} ดวง</span>
       </div>

       <div className="print-qty-rows">
        <div className="print-qty-row">
         <div className="print-qty-meta">
          <span className="print-qty-title">จำนวน Serial</span>
          <span className="print-qty-desc">รันเลขต่อเนื่อง (ฉลาก 1..{serialCount})</span>
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

        <div className="print-qty-row">
         <div className="print-qty-meta">
          <span className="print-qty-title">จำนวน Copy</span>
          <span className="print-qty-desc">พิมพ์ซ้ำ {copies} ใบต่อฉลาก</span>
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
       </div>
      </section>

      {/* Variables Card (Scrollable, bounded height) */}
      {asked.length>0&&(
       <section className="print-card print-card-vars" aria-labelledby="print-values-title">
        <div className="print-card-header">
         <h4 id="print-values-title">กรอกข้อมูลตัวแปร</h4>
         <span className="print-badge-vars">{asked.length} รายการ</span>
        </div>
        <p className="print-card-sub">ข้อมูลตัวแปรสำหรับฉลาก (บันทึกอัตโนมัติ)</p>
        <div className="print-variables-scroll">
         {asked.map((variable,index)=>{
          const empty=!(values[variable.name]??'').trim();
          return (
           <div key={variable.name} className="print-var-item">
            <label htmlFor={`var-input-${variable.name}`}>
             <span className="print-var-name">
              {index+1}. {variable.label||variable.name}
              <b aria-hidden="true">*</b>
             </span>
             <input
              id={`var-input-${variable.name}`}
              aria-label={`Print variable ${variable.name}`}
              required
              aria-invalid={empty}
              value={values[variable.name]??''}
              placeholder={`กรอก ${variable.label||variable.name}`}
              onChange={e=>
               setValues(current=>({...current,[variable.name]:e.target.value}))
              }
              onBlur={()=>remember(variable.name)}
             />
            </label>
            {empty&&<small className="print-var-required">จำเป็นต้องกรอก</small>}
           </div>
          );
         })}
        </div>
       </section>
      )}

      {/* Barcode & Status Alerts */}
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
     </div>
    </div>

    {/* Dialog Footer with Cancel and Print buttons side-by-side */}
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
     <div className="print-footer-actions">
      <button
       type="button"
       className="btn-print-cancel"
       disabled={busy}
       onClick={onClose}
      >
       ยกเลิก
      </button>
      <button
       type="button"
       className="primary btn-print-submit"
       disabled={busy||preflight.errors.length>0||missingValues.length>0}
       onClick={()=>void print()}
      >
       <Printer size={16}/>
       {busy?'กำลังเตรียมพิมพ์…':totalLabels>1?`Print (${totalLabels} ดวง)`:'Print…'}
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}
