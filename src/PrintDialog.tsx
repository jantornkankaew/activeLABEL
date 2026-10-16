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
import {defaultDocumentSettings,type LabelDocument,type Command,type LabelVariable} from './core';
import {LabelSvg,exportSvg} from './renderer';
import {fontStyles} from './fontStyles';
import {openSystemPrint} from './printing';
import {resolveDocument,usedVariables,variableNames,variableValues} from './variables';
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
 const usedOnCanvas=useMemo(
  ()=>new Set(doc.objects.flatMap(item=>variableNames(item.template??''))),
  [doc.objects]
 );
 const asked=useMemo(()=>{
  const explicitVars=new Map<string,LabelVariable>();
  for(const v of doc.variables??[]){
   explicitVars.set(v.name,v);
   explicitVars.set(v.name.toLowerCase(),v);
  }
  const list:LabelVariable[]=[];
  const seen=new Set<string>();
  // 1. Only include explicitly defined variables where prompt === true (ticked "Ask before print")
  for(const v of doc.variables??[]){
   if(v.prompt===true&&!seen.has(v.name.toLowerCase())){
    seen.add(v.name.toLowerCase());
    list.push(v);
   }
  }
  // 2. Scan objects on canvas for ad-hoc undefined variables (exclude formula tokens and system counters)
  for(const obj of doc.objects){
   for(const name of variableNames(obj.template??'')){
    if(name.includes(':')||name.toLowerCase().startsWith('formula'))continue;
    if(name==='serialIndex'||name==='serial'||name==='counter')continue;
    const explicit=explicitVars.get(name)||explicitVars.get(name.toLowerCase());
    if(explicit)continue;
    if(!seen.has(name.toLowerCase())){
     seen.add(name.toLowerCase());
     list.push({name,label:name,value:'',prompt:true});
    }
   }
  }
  return list;
 },[doc.variables,doc.objects]);
 const [values,setValues]=useState(()=>variableValues(doc.variables,{},doc.formulas));
 const [copies,setCopies]=useState(1);
 const [serialCount,setSerialCount]=useState(1);
 const [previewIndex,setPreviewIndex]=useState(0);
 const [jumpDraft,setJumpDraft]=useState('1');
 const [slideDir,setSlideDir]=useState<'next'|'prev'>('next');
 const [animKey,setAnimKey]=useState(0);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const preview=useRef<HTMLDivElement>(null);

 const isRequired=(variable:LabelVariable)=>usedOnCanvas.has(variable.name);
 const missingValues=asked.filter(variable=>isRequired(variable)&&!(values[variable.name]??'').trim());
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

 const prevResolvedDoc=useMemo(()=>{
  if(clampedPreviewIndex>0){
   try{
    return resolveDocument(doc,values,clampedPreviewIndex-1);
   }catch{
    return null;
   }
  }
  return null;
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
  let found=false;
  const variables=(doc.variables??[]).map(variable=>{
   if(variable.name===name){
    found=true;
    return {...variable,value};
   }
   return variable;
  });
  if(!found){
   variables.push({name,label:name,value,prompt:true});
  }
  const changed=!found||variables.some(
   (variable,index)=>variable.value!==(doc.variables??[])[index]?.value
  );
  if(
   changed&&
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
      {/* Left: Photo Album Preview Stage with Floating HUD, Watermark & Minimal Bottom Bar */}
      <div className="print-album-viewport">
       {/* Floating Transparent Quantity HUD */}
       <div className="preview-floating-hud" aria-label="Print quantity HUD">
        <div className="hud-metric">
         <span className="hud-label">Serial</span>
         <div className="hud-stepper">
          <button
           type="button"
           className="hud-step-btn"
           aria-label="Decrease serial count"
           title="ลดจำนวน Serial"
           disabled={busy||serialCount<=1}
           onClick={()=>updateSerialCount(serialCount-1)}
          >
           <Minus size={11}/>
          </button>
          <input
           type="number"
           className="hud-num-input"
           aria-label="จำนวน Serial"
           min={1}
           max={500}
           disabled={busy}
           value={serialCount}
           onChange={e=>updateSerialCount(Number(e.target.value))}
          />
          <button
           type="button"
           className="hud-step-btn"
           aria-label="Increase serial count"
           title="เพิ่มจำนวน Serial"
           disabled={busy||serialCount>=500}
           onClick={()=>updateSerialCount(serialCount+1)}
          >
           <Plus size={11}/>
          </button>
         </div>
        </div>

        <span className="hud-divider" aria-hidden="true"/>

        <div className="hud-metric">
         <span className="hud-label">Copy</span>
         <div className="hud-stepper">
          <button
           type="button"
           className="hud-step-btn"
           aria-label="Decrease copies"
           title="ลดจำนวน Copy"
           disabled={busy||copies<=1}
           onClick={()=>updateCopies(copies-1)}
          >
           <Minus size={11}/>
          </button>
          <input
           type="number"
           className="hud-num-input"
           aria-label="จำนวน Copy"
           min={1}
           max={100}
           disabled={busy}
           value={copies}
           onChange={e=>updateCopies(Number(e.target.value))}
          />
          <button
           type="button"
           className="hud-step-btn"
           aria-label="Increase copies"
           title="เพิ่มจำนวน Copy"
           disabled={busy||copies>=100}
           onClick={()=>updateCopies(copies+1)}
          >
           <Plus size={11}/>
          </button>
         </div>
        </div>

        <span className="hud-total-tag" title={`พิมพ์ทั้งหมด ${totalLabels} ดวง`}>
         รวม {totalLabels} ดวง
        </span>
       </div>

       {/* Top-Right Watermark Label Size & DPI */}
       <div className="preview-watermark-specs" aria-label="Label specifications">
        <span>{Number(doc.width.toFixed(2))} × {Number(doc.height.toFixed(2))} mm</span>
        <span className="specs-dot">·</span>
        <span>{labelDpi} DPI</span>
       </div>

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
          width:`min(100%, ${Math.max(180,Math.min(340,240*doc.width/doc.height))}px)`,
         }}
        >
         {/* Left Card (Previous Label) */}
         {prevResolvedDoc&&(
          <div
           className="album-card-side album-card-prev"
           role="button"
           tabIndex={0}
           aria-label={`ดูฉลากก่อนหน้า ใบที่ ${clampedPreviewIndex}`}
           title={`คลิกเพื่อดูฉลากใบที่ ${clampedPreviewIndex}`}
           onClick={()=>goToSerial(clampedPreviewIndex-1,'prev')}
           onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')goToSerial(clampedPreviewIndex-1,'prev');}}
          >
           <div className="album-side-badge">ฉลากใบที่ {clampedPreviewIndex}</div>
           <LabelSvg doc={prevResolvedDoc} fonts={fontStyles}/>
          </div>
         )}

         {/* Right Card (Next Label) */}
         {nextResolvedDoc&&(
          <div
           className="album-card-side album-card-next"
           role="button"
           tabIndex={0}
           aria-label={`ดูฉลากถัดไป ใบที่ ${clampedPreviewIndex+2}`}
           title={`คลิกเพื่อดูฉลากใบที่ ${clampedPreviewIndex+2}`}
           onClick={()=>goToSerial(clampedPreviewIndex+1,'next')}
           onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')goToSerial(clampedPreviewIndex+1,'next');}}
          >
           <div className="album-side-badge">ฉลากใบที่ {clampedPreviewIndex+2}</div>
           <LabelSvg doc={nextResolvedDoc} fonts={fontStyles}/>
          </div>
         )}

         {/* Active Center Card */}
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

       {/* Ultra-Minimal Bottom Navigation Bar at Very Bottom Edge */}
       <div className="preview-bottom-bar" aria-label="Label preview navigation">
        {serialCount>1&&(
         <div className="minimal-serial-nav">
          <button
           type="button"
           className="min-nav-arrow"
           aria-label="ฉลากแรก"
           title="เลื่อนไปฉลากแรก (ใบที่ 1)"
           disabled={busy||clampedPreviewIndex<=0}
           onClick={()=>goToSerial(0,'prev')}
          >
           <ChevronsLeft size={13}/>
          </button>
          <button
           type="button"
           className="min-nav-arrow"
           aria-label="ฉลากก่อนหน้า"
           title="ฉลากก่อนหน้า"
           disabled={busy||clampedPreviewIndex<=0}
           onClick={()=>goToSerial(clampedPreviewIndex-1,'prev')}
          >
           <ChevronLeft size={13}/>
          </button>

          <div className="min-nav-counter">
           <input
            type="number"
            className="min-jump-input"
            aria-label="หมายเลขฉลาก"
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
           <span className="min-nav-sep">/</span>
           <span className="min-nav-total">{serialCount}</span>
          </div>

          <button
           type="button"
           className="min-nav-arrow"
           aria-label="ฉลากถัดไป"
           title="ฉลากถัดไป"
           disabled={busy||clampedPreviewIndex>=serialCount-1}
           onClick={()=>goToSerial(clampedPreviewIndex+1,'next')}
          >
           <ChevronRight size={13}/>
          </button>
          <button
           type="button"
           className="min-nav-arrow"
           aria-label="ฉลากสุดท้าย"
           title={`เลื่อนไปฉลากสุดท้าย (ใบที่ ${serialCount})`}
           disabled={busy||clampedPreviewIndex>=serialCount-1}
           onClick={()=>goToSerial(serialCount-1,'next')}
          >
           <ChevronsRight size={13}/>
          </button>
         </div>
        )}

        {serialCount>1&&serialCount<=12&&(
         <div className="minimal-dots-strip" aria-label="Serial dots">
          {Array.from({length:serialCount}).map((_,i)=>(
           <button
            key={i}
            type="button"
            className={`min-dot ${i===clampedPreviewIndex?'active':''}`}
            aria-label={`ฉลากใบที่ ${i+1}`}
            title={`ไปที่ฉลากใบที่ ${i+1}`}
            disabled={busy}
            onClick={()=>goToSerial(i,i>clampedPreviewIndex?'next':'prev')}
           />
          ))}
         </div>
        )}
       </div>
      </div>

      {/* Right: Controls & Excel-Themed Variables Table */}
      <div className="print-sidebar">
       {/* Excel-Style Variables Table */}
       {asked.length>0&&(
        <section className="print-card print-card-vars excel-theme" aria-labelledby="print-values-title">
         <div className="print-card-header">
          <div className="excel-header-title">
           <span className="excel-grid-icon" aria-hidden="true">⊞</span>
           <h4 id="print-values-title">กรอกข้อมูลตัวแปร</h4>
          </div>
          <span className="print-badge-vars">{asked.length} รายการ</span>
         </div>
         <p className="print-card-sub">ข้อมูลตัวแปรสำหรับฉลาก (บันทึกอัตโนมัติ)</p>

         <div className="excel-table-wrapper">
          <div className="excel-table" role="table" aria-label="ตารางกรอกข้อมูลตัวแปร">
           <div className="excel-thead" role="rowgroup">
            <div className="excel-tr header-row" role="row">
             <div className="excel-th col-index" role="columnheader">#</div>
             <div className="excel-th col-name" role="columnheader">ตัวแปร (Field)</div>
             <div className="excel-th col-value" role="columnheader">ค่าที่พิมพ์ (Value)</div>
            </div>
           </div>
           <div className="excel-tbody" role="rowgroup">
            {asked.map((variable,index)=>{
             const required=isRequired(variable);
             const empty=required&&!(values[variable.name]??'').trim();
             return (
              <div key={variable.name} className={`excel-tr ${empty?'cell-invalid':''}`} role="row">
               <div className="excel-td col-index" role="cell">{index+1}</div>
               <div className="excel-td col-name" role="cell" title={variable.label||variable.name}>
                <span className="var-label-text">{variable.label||variable.name}</span>
                {required&&<span className="var-req-star" title="จำเป็นต้องระบุ">*</span>}
               </div>
               <div className="excel-td col-value" role="cell">
                <input
                 id={`var-input-${variable.name}`}
                 className="excel-cell-input"
                 aria-label={`Print variable ${variable.name}`}
                 required={required}
                 aria-invalid={empty}
                 value={values[variable.name]??''}
                 placeholder="พิมพ์ค่าที่นี่…"
                 onChange={e=>
                  setValues(current=>({...current,[variable.name]:e.target.value}))
                 }
                 onBlur={()=>remember(variable.name)}
                />
               </div>
              </div>
             );
            })}
           </div>
          </div>
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
