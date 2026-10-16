import {useObjectDelete} from './ObjectDelete';
import {ShareDialog} from './ShareDialog';
import {MeasurementInput,useMeasurements} from './MeasurementContext';
import {displayMeasurement} from './units';
import {AnchorControls} from './AnchorControls';
import {alignmentCommands,type Alignment} from './alignment';
import {useBarcodeDrafts,type BarcodeDraft} from './useBarcodeDrafts';
import {DesignSurface,type GridSettings} from './DesignSurface';
import {FileMenu,DocumentTabs} from './FileMenu';
import {useCanvasInteraction} from './useCanvasInteraction';
import {snapCoordinate} from './canvasGeometry';
import {PrintDialog} from './PrintDialog';
import {fontStyles} from './fontStyles';
import {useEffect,useRef,useState} from 'react';
import {Copy,AlignLeft,AlignCenter,AlignRight,MousePointer2,Layers,SlidersHorizontal,X,ChevronUp,ChevronDown,Undo2,Redo2,Printer,Share2,Download,Upload,Type,Barcode,ImageIcon,Minus,Square,Sparkles,Send,Trash2,Lock,Unlock,Settings,ExternalLink} from 'lucide-react';
import {apply,defaultDocumentSettings,demoCommands,object,restoreRevision,seed,validate,type Command,type LabelDocument,type LabelObject,type Kind} from './core';
import {LabelSvg,exportSvg} from './renderer';
import {AIConnectionSettings} from './AIConnectionSettings';
import {connectionURL,type AIProvider,type AIConnections} from './aiConnection';
import {FontPicker,FontSizePicker,BarcodeEditor,LabelSizeDialog} from './EditorControls';
import {barcodeMagnification} from './barcodes';
import {loadLocalJobs,mergeJobs,newJob} from './jobLibrary';
import {migrateDocument} from './core';
import {VariablesDialog} from './VariablesDialog';
import {FormulaBuilderDialog} from './FormulaBuilderDialog';
import {CloseProjectDialog} from './CloseProjectDialog';
import type {LabelFormula} from './formulaEngine';
import {renderTemplate,simpleVariableBinding,variableTemplate,variableValues} from './variables';
import {cloudWorkspace,cloudWorkspaceConfigured,currentCloudSession,loadCloudWorkspace,saveCloudWorkspace,signInCloud,signOutCloud} from './cloudWorkspace';
import type {Session} from '@supabase/supabase-js';
import {useSyncEngine} from './syncEngine';
import {NetworkStatusBadge} from './NetworkStatusBadge';
import {usePwaInstall} from './usePwaInstall';
import {PwaInstallDialog} from './PwaInstallDialog';
type Message={role:'user'|'assistant';text:string};

function download(name:string,data:string,type:string){const u=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function FormulaField({item,doc,onUpdate,onManageVariables,onManageFormulas}:{item:LabelObject;doc:LabelDocument;onUpdate:(changes:Partial<LabelObject>)=>boolean|void;onManageVariables:()=>void;onManageFormulas:(targetFormulaId?:string)=>void}){
 const values=variableValues(doc.variables,{},doc.formulas);
 const simple=simpleVariableBinding(item.template);
 let selectedValue='fixed';
 let activeFormulaId:string|undefined=undefined;
 if(item.template){
  if(simple){
   if(simple.name.startsWith('formula:')){
    const rawFid=simple.name.slice(8);
    const match=(doc.formulas??[]).find(f=>f.id===rawFid||f.name===rawFid);
    selectedValue=match?`formula:${match.id}`:`formula:${rawFid}`;
    activeFormulaId=match?.id??rawFid;
   }else{
    const formulaMatch=(doc.formulas??[]).find(f=>f.id===simple.name||f.name===simple.name);
    if(formulaMatch){selectedValue=`formula:${formulaMatch.id}`;activeFormulaId=formulaMatch.id;}
    else{selectedValue=`var:${simple.name}`;}
   }
  }else{
   const formulaMatch=(doc.formulas??[]).find(f=>item.template!.includes(`formula:${f.id}`)||item.template!.includes(`formula:${f.name}`));
   if(formulaMatch){selectedValue=`formula:${formulaMatch.id}`;activeFormulaId=formulaMatch.id;}
   else{
    const varMatch=(doc.variables??[]).find(v=>item.template!.includes(`{{${v.name}}}`));
    if(varMatch)selectedValue=`var:${varMatch.name}`;
   }
  }
 }
 function applyTemplate(templateStr:string|undefined){
  if(!templateStr){onUpdate({template:undefined,content:item.content});return;}
  onUpdate({template:templateStr,content:renderTemplate(templateStr,values)});
 }
 function handleSelect(val:string){
  if(val==='action:add_variable'){onManageVariables();return;}
  if(val==='action:add_formula'){onManageFormulas();return;}
  if(val==='fixed'){applyTemplate(undefined);return;}
  if(val.startsWith('var:')){applyTemplate(variableTemplate({name:val.slice(4),prefix:'',suffix:''}));return;}
  if(val.startsWith('formula:')){applyTemplate(`{{formula:${val.slice(8)}}}`);return;}
 }
 function affix(changes:{prefix?:string;suffix?:string}){if(!simple)return;applyTemplate(variableTemplate({...simple,...changes}));}
 const isFixed=selectedValue==='fixed';
 const isVar=selectedValue.startsWith('var:');
 const isFormula=selectedValue.startsWith('formula:');
 const activeFormula=isFormula&&activeFormulaId?(doc.formulas??[]).find(f=>f.id===activeFormulaId||f.name===activeFormulaId):undefined;
 const currentPreview=item.template?renderTemplate(item.template,values):item.content;

 return <div className="binding-panel">
  <label>Value source
   <select aria-label="Value source" className="value-source-select" value={selectedValue} disabled={item.locked} onChange={e=>handleSelect(e.target.value)}>
    <option value="fixed">Fixed value</option>
    <option disabled>──────────</option>
    <optgroup label="Variable">
     {(doc.variables??[]).map(v=><option key={v.name} value={`var:${v.name}`}>{v.label||v.name}</option>)}
     <option value="action:add_variable">+ Variable</option>
    </optgroup>
    <option disabled>──────────</option>
    <optgroup label="Formula">
     {(doc.formulas??[]).map(f=><option key={f.id} value={`formula:${f.id}`}>{f.name}</option>)}
     <option value="action:add_formula">+ Formula</option>
    </optgroup>
   </select>
  </label>
  {isFixed&&item.kind==='text'&&<label className="fixed-text-value">Text<input aria-label="Text value" value={item.content} disabled={item.locked} onChange={e=>onUpdate({content:e.target.value,template:undefined})}/></label>}
  {isVar&&<><div className="binding-affixes"><label>Prefix<input aria-label="Variable prefix" value={simple?.prefix??''} placeholder="Optional" disabled={item.locked} onChange={e=>affix({prefix:e.target.value})}/></label><label>Suffix<input aria-label="Variable suffix" value={simple?.suffix??''} placeholder="Optional" disabled={item.locked} onChange={e=>affix({suffix:e.target.value})}/></label></div><div className="binding-preview-badge"><span className="badge-label">Preview:</span><strong className="badge-value">{currentPreview||'—'}</strong></div></>}
  {isFormula&&<div className="formula-source-card"><div className="formula-source-header"><span className="formula-source-title">🧩 {activeFormula?activeFormula.name:'LEGO Formula'}</span><span className="formula-block-count">{activeFormula?.blocks.length??0} blocks</span></div><div className="binding-preview-badge formula-preview"><span className="badge-label">Live result:</span><strong className="badge-value">{currentPreview||'—'}</strong></div><button type="button" className="edit-formula-btn" disabled={item.locked} onClick={()=>onManageFormulas(activeFormula?.id)}>✏️ Edit Formula</button></div>}
  <div className="value-source-shortcuts"><button type="button" className="btn-shortcut" disabled={item.locked} onClick={onManageVariables} title="Manage variables or combine formulas">+ Variable</button><button type="button" className="btn-shortcut" disabled={item.locked} onClick={()=>onManageFormulas()} title="Create or edit LEGO formulas">+ Formula</button></div>
 </div>;
}
function QuickTextControls({item,disabled,onUpdate}:{item:LabelObject;disabled:boolean;onUpdate:(changes:Partial<LabelObject>)=>boolean|void}){
 const autoSize=item.autoSize!==false;
 const alignmentIcons={left:AlignLeft,center:AlignCenter,right:AlignRight};
 return <div className="quick-text"><FontPicker item={item} disabled={disabled} onUpdate={onUpdate} hideLabel/><FontSizePicker item={item} disabled={disabled} onUpdate={onUpdate} hideLabel/><div className="quick-btn-group" aria-label="Text style"><button type="button" aria-label="Quick bold" aria-pressed={item.bold} className={item.bold?'chosen':''} disabled={disabled} onClick={()=>onUpdate({bold:!item.bold})}><b>B</b></button><button type="button" aria-label="Quick italic" aria-pressed={Boolean(item.italic)} className={item.italic?'chosen':''} disabled={disabled} onClick={()=>onUpdate({italic:!item.italic})}><i>I</i></button><button type="button" aria-label="Quick underline" aria-pressed={Boolean(item.underline)} className={item.underline?'chosen':''} disabled={disabled} onClick={()=>onUpdate({underline:!item.underline})}><u>U</u></button></div><span className="context-divider"/><label className="switch-toggle" title="Auto size text frame"><input aria-label="Quick auto size" type="checkbox" checked={autoSize} disabled={disabled} onChange={event=>onUpdate({autoSize:event.target.checked})}/><span className="switch-pill"><span className="switch-knob"/></span><span className="switch-label">Auto size</span></label>{!autoSize&&<><span className="context-divider"/><div className="quick-btn-group" aria-label="Text alignment">{([ 'left','center','right'] as const).map(value=>{const Icon=alignmentIcons[value];return <button key={value} type="button" title={`Align ${value}`} aria-label={`Quick align ${value}`} aria-pressed={(item.textAlign??'left')===value} className={(item.textAlign??'left')===value?'chosen':''} disabled={disabled} onClick={()=>onUpdate({textAlign:value})}><Icon size={14}/></button>;})}</div></>}</div>;
}
function Inspector({item,doc,onUpdate,onDelete,draft,onDraftChange,onManageVariables,onManageFormulas}:{item:LabelObject;doc:LabelDocument;onUpdate:(changes:Partial<LabelObject>)=>boolean|void;onDelete:()=>void;draft?:BarcodeDraft;onDraftChange:(draft:BarcodeDraft)=>void;onManageVariables:()=>void;onManageFormulas:(targetFormulaId?:string)=>void}){
 const {settings:measurements}=useMeasurements();
 const geometry=item.kind==='text'&&item.autoSize===false?(['x','y','width','height'] as const):item.kind==='text'||item.kind==='barcode'?(['x','y'] as const):(['x','y','width','height'] as const);
 const alignmentIcons={left:AlignLeft,center:AlignCenter,right:AlignRight};
 return <section className="inspector"><header className="property-header"><div><h3>Properties</h3><span>{item.kind}</span></div><button className="lock-btn" aria-label={item.locked?'Unlock':'Lock'} title={item.locked?'Unlock object':'Lock object'} onClick={()=>onUpdate({locked:!item.locked})}>{item.locked?<Lock size={14}/>:<Unlock size={14}/>}</button></header>
 <div className="property-section"><div className="property-section-header"><h4>Content</h4><button type="button" className="property-remove-btn" disabled={item.locked} title="Remove object" aria-label="Remove object" onClick={onDelete}><Trash2 size={14}/></button></div><label>Object name<input value={item.name} onChange={e=>onUpdate({name:e.target.value})}/></label>{(item.kind==='text'||item.kind==='barcode')&&<FormulaField item={item} doc={doc} onUpdate={onUpdate} onManageVariables={onManageVariables} onManageFormulas={onManageFormulas}/>} {item.kind==='barcode'&&<BarcodeEditor key={item.id} item={item} doc={doc} disabled={item.locked||Boolean(item.template)} onUpdate={onUpdate} draft={draft} onDraftChange={onDraftChange}/>}</div>
 <div className="property-section"><h4>Position & size</h4><div className="field-grid">{geometry.map(k=><MeasurementInput key={k} label={k.toUpperCase()} value={item[k]} minMm={k==='x'||k==='y'?0:.1} disabled={item.locked} onChange={mm=>onUpdate({[k]:mm})}/>)}</div>{item.kind==='text'&&item.autoSize!==false&&<p className="property-measure">Auto · {displayMeasurement(item.width,{unit:'mm',dpi:203})} × {displayMeasurement(item.height,{unit:'mm',dpi:203})} mm</p>}{item.kind==='barcode'&&<p className="property-measure">🔒 {displayMeasurement(item.width,measurements)} × {displayMeasurement(item.height,measurements)} {measurements.unit} · สัดส่วนคงที่ {Math.round(barcodeMagnification(item))}%</p>}</div>
 {item.kind==='text'&&<div className="property-section typography-section"><h4>Typography</h4><FontPicker item={item} disabled={item.locked} onUpdate={onUpdate}/><div className="type-row"><FontSizePicker item={item} disabled={item.locked} onUpdate={onUpdate}/><label>Style<div className="quick-btn-group" aria-label="Text style"><button type="button" aria-label="Bold" aria-pressed={item.bold} className={item.bold?'chosen':''} onClick={()=>onUpdate({bold:!item.bold})}><b>B</b></button><button type="button" aria-label="Italic" aria-pressed={Boolean(item.italic)} className={item.italic?'chosen':''} onClick={()=>onUpdate({italic:!item.italic})}><i>I</i></button><button type="button" aria-label="Underline" aria-pressed={Boolean(item.underline)} className={item.underline?'chosen':''} onClick={()=>onUpdate({underline:!item.underline})}><u>U</u></button></div></label></div><div className="text-frame-controls"><label className="switch-toggle" title="Auto size text frame"><input aria-label="Auto size" type="checkbox" checked={item.autoSize!==false} onChange={e=>onUpdate({autoSize:e.target.checked})}/><span className="switch-pill"><span className="switch-knob"/></span><span className="switch-label">Auto size</span></label>{item.autoSize===false&&<div className="quick-btn-group" aria-label="Text alignment">{(['left','center','right'] as const).map(value=>{const Icon=alignmentIcons[value];return <button key={value} type="button" aria-label={`Text align ${value}`} aria-pressed={(item.textAlign??'left')===value} className={(item.textAlign??'left')===value?'chosen':''} onClick={()=>onUpdate({textAlign:value})}><Icon size={14}/></button>;})}</div>}</div></div>}
 <div className="property-section layout-section"><AnchorControls item={item} doc={doc} disabled={item.locked} onUpdate={onUpdate}/></div></section>;
}
export default function App(){
 const {settings:measurements,setSettings:setMeasurements}=useMeasurements();
 const [initial]=useState(loadLocalJobs);const [jobs,setJobs]=useState(initial.documents);const [doc,setDoc]=useState(initial.document);const [sizeOpen,setSizeOpen]=useState(false);const [shareOpen,setShareOpen]=useState(false);const [variablesOpen,setVariablesOpen]=useState(false); const [formulaBuilderOpen,setFormulaBuilderOpen]=useState(false);const [targetFormulaId,setTargetFormulaId]=useState<string|undefined>(undefined);const [closingDocId,setClosingDocId]=useState<string|null>(null);const docRef=useRef(doc);docRef.current=doc;
 const [selected,setSelected]=useState<string|null>(null);const [past,setPast]=useState<LabelDocument[]>([]);const [future,setFuture]=useState<LabelDocument[]>([]);
 const initialSettings=initial.document.settings??defaultDocumentSettings;const [grid,setGrid]=useState<GridSettings>({visible:initialSettings.gridVisible,snap:initialSettings.snapToGrid,step:initialSettings.gridStep});const barcodeDrafts=useBarcodeDrafts(doc);const invalidBarcode=barcodeDrafts.invalid;const [notice,setNotice]=useState('');const [layersOpen,setLayersOpen]=useState(false);const [propertiesOpen,setPropertiesOpen]=useState(false);const [chatOpen,setChatOpen]=useState(false);const [prompt,setPrompt]=useState('');const [busy,setBusy]=useState(false);
 const [messages,setMessages]=useState<Message[]>([{role:'assistant',text:'อยากปรับอะไรบนฉลาก?'}]);
 const [settings,setSettings]=useState(false);const [printOpen,setPrintOpen]=useState(initial.printRequested);const [provider,setProvider]=useState<AIProvider>('demo');const [connections,setConnections]=useState<AIConnections>({api:{url:'https://localhost:28172',token:''},codex:{url:'https://localhost:28172',token:''}});
 const [cloudSession,setCloudSession]=useState<Session|null>(null);const [cloudLoading,setCloudLoading]=useState(cloudWorkspaceConfigured);
 const [offlineOverride,setOfflineOverride]=useState(false);
 const {
  online,
  syncState,
  pendingCount,
  lastSyncTime,
  offlineSince,
  triggerSync,
  queueSave,
 }=useSyncEngine({
  userId:cloudSession?.user.id,
  cloudSaver:cloudWorkspaceConfigured?saveCloudWorkspace:undefined,
  onNotice:setNotice,
 });
 const {canInstall,hasPrompt,isStandalone,installApp}=usePwaInstall();
 const [pwaDialogOpen,setPwaDialogOpen]=useState(false);
 async function handlePwaInstall(){
  if(hasPrompt){
   const installed=await installApp();
   if(!installed)setPwaDialogOpen(true);
  }else{
   setPwaDialogOpen(true);
  }
 }
 const inputFile=useRef<HTMLInputElement>(null);const imageFile=useRef<HTMLInputElement>(null);const canvas=useRef<HTMLDivElement>(null);const chatEnd=useRef<HTMLDivElement>(null);
 const interaction=useCanvasInteraction(doc,setSelected,commit,!busy,grid.snap,grid.step);
 const item=doc.objects.find(o=>o.id===selected);
 const deletion=useObjectDelete(doc,item,!busy&&!interaction.preview&&!settings&&!printOpen&&!shareOpen&&!sizeOpen&&!variablesOpen,commit,()=>setSelected(null));
 const documents=mergeJobs(jobs,doc);
 const closingDoc=documents.find(d=>d.id===closingDocId);
 function confirmCloseProject(){
  if(!closingDocId)return;
  const targetId=closingDocId;const targetTitle=closingDoc?.title||'Untitled label';const remaining=documents.filter(d=>d.id!==targetId);
  setClosingDocId(null);
  if(remaining.length===0){const fresh=newJob(1);setJobs([fresh]);openJob(fresh);setNotice(`ปิดโปรเจค "${targetTitle}" และสร้างโปรเจคว่างใหม่แล้ว`);}
  else{setJobs(remaining);if(targetId===doc.id){const closedIndex=documents.findIndex(d=>d.id===targetId);const nextActive=remaining[Math.min(closedIndex,remaining.length-1)];openJob(nextActive);}else{try{localStorage.setItem('labelcraft-jobs-v1',JSON.stringify({version:1,activeId:doc.id,documents:remaining}));}catch{}}setNotice(`ปิดโปรเจค "${targetTitle}" แล้ว`);}
 }
 useEffect(()=>{if(!cloudWorkspaceConfigured)return;let current=true;async function open(session:Session|null){if(!current)return;setCloudSession(session);if(!session){setCloudLoading(false);return;}setCloudLoading(true);try{const remote=await loadCloudWorkspace(session.user.id);if(!current)return;if(remote.documents.length){const active=remote.documents.find(value=>value.id===remote.activeId)??remote.documents[0];setJobs(remote.documents);setDoc(active);docRef.current=active;}else await saveCloudWorkspace(session.user.id,documents,doc.id);}catch(error){if(current)setNotice(`Cloud sync: ${(error as Error).message}`);}finally{if(current)setCloudLoading(false);}}currentCloudSession().then(open).catch(error=>{if(current){setNotice(`Cloud login: ${(error as Error).message}`);setCloudLoading(false);}});const {data}=cloudWorkspace!.auth.onAuthStateChange((_event,session)=>{void open(session);});return()=>{current=false;data.subscription.unsubscribe();};},[]);
 useEffect(()=>{const next=mergeJobs(jobs,doc);setJobs(next);try{const p=JSON.stringify({version:1,activeId:doc.id,documents:next});localStorage.setItem('activelabel-jobs-v1',p);localStorage.setItem('labelcraft-jobs-v1',p);}catch{setNotice('บันทึกอัตโนมัติไม่สำเร็จ กรุณาดาวน์โหลด JSON');}if(!cloudSession)return;const timer=setTimeout(()=>{queueSave(next,doc.id);},500);return()=>clearTimeout(timer);},[doc,cloudSession,queueSave]);
 useEffect(()=>{const settings=doc.settings??defaultDocumentSettings;setMeasurements({unit:settings.unit,dpi:settings.dpi});setGrid({visible:settings.gridVisible,snap:settings.snapToGrid,step:settings.gridStep});},[doc.id,doc.settings?.unit,doc.settings?.dpi,doc.settings?.gridVisible,doc.settings?.snapToGrid,doc.settings?.gridStep]);
 function openJob(next:LabelDocument){if(busy)return;const settings=next.settings??defaultDocumentSettings;setJobs(mergeJobs(jobs,doc));setMeasurements({unit:settings.unit,dpi:settings.dpi});setGrid({visible:settings.gridVisible,snap:settings.snapToGrid,step:settings.gridStep});setDoc(next);docRef.current=next;setPast([]);setFuture([]);setSelected(null);}
 function createJob(){if(documents.length>=50){setNotice('รองรับสูงสุด 50 ไฟล์งาน ดาวน์โหลด JSON เพื่อสำรองงาน');return;}openJob(newJob(documents.length+1));}

 useEffect(()=>{if(location.hash.startsWith('#print=')||location.hash.startsWith('#share=')||location.hash.startsWith('#bridge='))history.replaceState(null,'',location.pathname+location.search);},[]);
 useEffect(()=>{chatEnd.current?.scrollIntoView({block:'nearest'});},[messages]);
 useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setPropertiesOpen(false);setLayersOpen(false);setChatOpen(false);}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(t);},[notice]);
 function commit(commands:Command[],base=docRef.current.revision){try{const previous=docRef.current;const next=apply(previous,commands,base);setPast(p=>[...p.slice(-49),previous]);setFuture([]);docRef.current=next;setDoc(next);return true;}catch(e){setNotice((e as Error).message);return false;}}
 function undo(){if(!past.length)return;setFuture(f=>[doc,...f]);setDoc(restoreRevision(doc,past[past.length-1]));setPast(past.slice(0,-1));}
 function redo(){if(!future.length)return;setPast(p=>[...p,doc]);setDoc(restoreRevision(doc,future[0]));setFuture(future.slice(1));}
 function update(changes:Partial<LabelObject>){if(changes.x!==undefined)changes.x=snapCoordinate(changes.x,grid.step,grid.snap);if(changes.y!==undefined)changes.y=snapCoordinate(changes.y,grid.step,grid.snap);if(item)return commit([{op:'update',id:item.id,changes}]);}
 function updateGrid(next:GridSettings){setGrid(next);const current=docRef.current.settings??defaultDocumentSettings;commit([{op:'setDocumentSettings',settings:{...current,gridVisible:next.visible,snapToGrid:next.snap,gridStep:next.step}}]);}
 function updateMeasurements(next:{unit:'mm'|'cm'|'inch'|'dot';dpi:number}){const current=docRef.current.settings??defaultDocumentSettings;commit([{op:'setDocumentSettings',settings:{...current,unit:next.unit,dpi:next.dpi as 203|300|600}}]);}
 function alignSelected(alignment:Alignment){if(!item)return;try{commit(alignmentCommands(docRef.current,[item.id],alignment));}catch(error){setNotice((error as Error).message);}}
 function add(kind:Kind){if(kind==='image'){imageFile.current?.click();return;}const o=object(kind,{width:Math.min(kind==='barcode'?40:20,doc.width-6),height:Math.min(kind==='line'?.3:kind==='barcode'?8:5,doc.height-6)});if(commit([{op:'add',object:o}]))setSelected(o.id);}
 async function chat(text=prompt){if(!text.trim()||busy)return;setChatOpen(true);setPrompt('');setMessages(m=>[...m,{role:'user',text}]);setBusy(true);const snapshot=structuredClone(docRef.current);try{let result:{commands:Command[];message:string};if(provider!=='demo'){const connection=connections[provider];if(!connection.token)throw Error('ใส่ token ของตัวเชื่อมใน Settings ก่อน');const url=connectionURL(provider,connection.url,window.location.protocol);const r=await fetch(url+'/v1/design',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+connection.token},body:JSON.stringify({prompt:`${text}\nEditor display unit: ${measurements.unit}; dot DPI: ${measurements.dpi}. Document and command geometry always use millimetres; convert requested measurements before proposing commands.`,document:snapshot,selectedId:selected,provider}),signal:AbortSignal.timeout(provider==='codex'?125000:45000)});const b=await r.json();if(!r.ok)throw Error(b.error||'AI request failed');result=b;}else result=demoCommands(text,snapshot,selected);if(!Array.isArray(result.commands)||typeof result.message!=='string')throw Error('Invalid AI response');if(result.commands.length&&!commit(result.commands,snapshot.revision))throw Error('ไม่ได้นำคำสั่งไปใช้ กรุณาตรวจข้อความแจ้งเตือนและลองใหม่');setMessages(m=>[...m,{role:'assistant',text:result.message}]);}catch(e){setMessages(m=>[...m,{role:'assistant',text:(e as Error).message}]);}finally{setBusy(false);}}
 const display=interaction.preview||doc;
 function svgData(){const svg=canvas.current?.querySelector('svg');if(!svg)throw Error('Canvas unavailable');return exportSvg(doc,svg.outerHTML);}
  if(cloudWorkspaceConfigured&&(cloudLoading||!cloudSession)&&!offlineOverride)return <div className="cloud-gate"><div className="cloud-card"><div className="brand-group" style={{justifyContent:'center',marginBottom:34}}><div className="brand" style={{marginBottom:0}}>active<span>LABEL</span></div><a href="https://www.active5.co.th" target="_blank" rel="noopener noreferrer" className="active5-header-credit" title="ลิขสิทธิ์ บริษัท แอคทีฟ ไฟว์ จำกัด (Active5 Co., Ltd.) — www.active5.co.th"><span className="active5-copy">© Active5</span><span className="active5-sep">·</span><span className="active5-domain">www.active5.co.th</span><ExternalLink size={10} className="active5-ext-icon"/></a></div>{cloudLoading?<p role="status">Loading workspace…</p>:<><h1>Your labels, on every device</h1><p>Sign in to open the same files and settings everywhere.</p><button className="primary" onClick={()=>signInCloud().catch(error=>setNotice((error as Error).message))}>Continue with GitHub</button><button type="button" className="secondary" style={{marginTop:8}} onClick={()=>setOfflineOverride(true)}>ทำงานแบบออฟไลน์ (Continue Offline)</button></>}{notice&&<p role="alert">{notice}</p>}</div></div>;
  return <div className="atelier"><header><div className="brand-group"><div className="brand">active<span>LABEL</span></div><a href="https://www.active5.co.th" target="_blank" rel="noopener noreferrer" className="active5-header-credit" title="ลิขสิทธิ์ บริษัท แอคทีฟ ไฟว์ จำกัด (Active5 Co., Ltd.) — www.active5.co.th"><span className="active5-copy">© Active5</span><span className="active5-sep">·</span><span className="active5-domain">www.active5.co.th</span><ExternalLink size={10} className="active5-ext-icon"/></a></div><FileMenu documents={documents} disabled={busy} onNew={createJob} onOpen={id=>{const next=documents.find(d=>d.id===id);if(next)openJob(next);}} onImport={()=>inputFile.current?.click()} onSave={()=>download(doc.title+'.json',JSON.stringify(doc,null,2),'application/json')} onSVG={()=>download(doc.title+'.svg',svgData(),'image/svg+xml')} onCloseActive={()=>setClosingDocId(doc.id)} onInstall={!isStandalone ? handlePwaInstall : undefined}/><input className="title" aria-label="Document name" value={doc.title} onChange={e=>{const next={...doc,title:e.target.value,revision:doc.revision+1};try{validate(next);setPast(p=>[...p.slice(-49),doc]);setFuture([]);setDoc(next);}catch(err){setNotice((err as Error).message);}}}/><div className="history"><button aria-label="Undo" title="Undo" disabled={!past.length} onClick={undo}><Undo2 size={19}/></button><button aria-label="Redo" title="Redo" disabled={!future.length} onClick={redo}><Redo2 size={19}/></button></div><div className="header-actions"><NetworkStatusBadge online={online} syncState={syncState} pendingCount={pendingCount} lastSyncTime={lastSyncTime} offlineSince={offlineSince} onManualSync={triggerSync}/>{!isStandalone&&<button type="button" className="btn-pwa-install" title="ติดตั้ง activeLABEL ลงบนคอมพิวเตอร์ (PWA)" onClick={handlePwaInstall}><Download size={14}/><span className="pwa-btn-text">ติดตั้งแอป</span></button>}<button aria-label="Settings" disabled={busy} onClick={()=>setSettings(true)}><Settings size={18}/></button><button disabled={busy||Boolean(interaction.preview)} onClick={()=>setShareOpen(true)}><Share2 size={16}/> Share</button><button className="primary" disabled={invalidBarcode||busy||Boolean(interaction.preview)} title={invalidBarcode?'แก้ข้อมูลบาร์โค้ดก่อนพิมพ์':'Print label'} onClick={()=>setPrintOpen(true)}><Printer size={17}/> Print</button></div></header><DocumentTabs documents={documents} activeId={doc.id} disabled={busy} onOpen={id=>{const next=documents.find(d=>d.id===id);if(next)openJob(next);}} onNew={createJob} onClose={id=>setClosingDocId(id)}/>
 {cloudSession&&<button className="cloud-account" title={cloudSession.user.email??'Cloud account'} onClick={()=>signOutCloud().catch(error=>setNotice((error as Error).message))}>Cloud · Sign out</button>}
 <main className="studio-main">
 <div className="tool-dock" role="toolbar" aria-label="Add objects"><button aria-label="Select" title="Select" onClick={()=>{setSelected(null);setPropertiesOpen(false);}}><MousePointer2 size={21}/></button>{([[Type,'text','Text'],[Barcode,'barcode','Barcode'],[ImageIcon,'image','Image'],[Minus,'line','Line'],[Square,'box','Box']] as const).map(([Icon,kind,name])=><button key={kind} aria-label={'Add '+name} title={name} disabled={busy} onClick={()=>add(kind)}><Icon size={21}/></button>)}<span className="tool-divider"/><button aria-label="Duplicate object" title="Duplicate" disabled={!item||busy} onClick={()=>{if(!item)return;const copy={...structuredClone(item),id:crypto.randomUUID(),name:item.name+' copy',locked:false};copy.x=Math.max(0,Math.min(doc.width-copy.width,copy.x+2));copy.y=Math.max(0,Math.min(doc.height-copy.height,copy.y+2));if(commit([{op:'add',object:copy}]))setSelected(copy.id);}}><Copy size={20}/></button><button aria-label="Center object" title="Center horizontally" disabled={!item||item.locked||busy} onClick={()=>alignSelected('h-center')}><AlignCenter size={20}/></button><button aria-label="Delete object" title="Delete" disabled={!item||item.locked||busy} onClick={deletion.request}><Trash2 size={20}/></button></div>
 <div className="document-controls"><button aria-expanded={layersOpen} aria-controls="studio-layers" onClick={()=>setLayersOpen(!layersOpen)}><Layers size={17}/> Layers</button><button onClick={()=>setVariablesOpen(true)}>Variables{doc.variables?.length?` · ${doc.variables.length}`:''}</button><button onClick={()=>{setTargetFormulaId(undefined);setFormulaBuilderOpen(true);}}>Formulas{doc.formulas?.length?` · ${doc.formulas.length}`:''}</button><button className="document-size" aria-label="Document property" onClick={()=>setSizeOpen(true)}>{displayMeasurement(doc.width,measurements)} × {displayMeasurement(doc.height,measurements)} {measurements.unit}<SlidersHorizontal size={15}/></button></div>
 {layersOpen&&<aside className="layers-popover" id="studio-layers" aria-label="Layers"><h3>Layers<button aria-label="Close layers" onClick={()=>setLayersOpen(false)}><X size={16}/></button></h3><div className="layers">{doc.objects.map(o=><button key={o.id} className={selected===o.id?'chosen':''} onClick={()=>setSelected(o.id)}>{o.kind==='barcode'?<Barcode size={16}/>:o.kind==='image'?<ImageIcon size={16}/>:o.kind==='box'?<Square size={16}/>:o.kind==='line'?<Minus size={16}/>:<Type size={16}/>}<span>{o.name}</span>{o.locked&&<Lock size={12}/>}</button>)}</div></aside>}
 {item&&<div className="context-bar" aria-label="Selected object controls">{item.kind==='barcode'&&!propertiesOpen?<div className="quick-barcode"><BarcodeEditor key={item.id} item={item} doc={doc} disabled={item.locked||busy} onUpdate={update} draft={barcodeDrafts.getDraft(item.id)} onDraftChange={draft=>barcodeDrafts.setDraft(item.id,draft)}/></div>:item.kind==='text'&&!propertiesOpen?<QuickTextControls item={item} disabled={item.locked||busy} onUpdate={update}/>:<span className="selection-name">{item.name}</span>}<span className="context-divider"/><button className={`context-prop-btn ${propertiesOpen?'chosen':''}`} aria-label="Object properties" title="Object properties" aria-expanded={propertiesOpen} onClick={()=>setPropertiesOpen(!propertiesOpen)}><SlidersHorizontal size={15}/></button></div>}
 {item&&propertiesOpen&&<aside className="properties-popover" aria-label="Object properties"><button className="close-properties" aria-label="Close properties" onClick={()=>setPropertiesOpen(false)}><X size={16}/></button><Inspector key={item.id} item={item} doc={doc} draft={barcodeDrafts.getDraft(item.id)} onDraftChange={draft=>barcodeDrafts.setDraft(item.id,draft)} onUpdate={update} onDelete={deletion.request} onManageVariables={()=>setVariablesOpen(true)} onManageFormulas={id=>{setTargetFormulaId(id);setFormulaBuilderOpen(true);}}/></aside>}
 <div className="workspace"><DesignSurface onBlankPointerDown={()=>setSelected(null)} doc={display} paperRef={canvas} grid={grid} onGrid={updateGrid} onMeasurement={updateMeasurements} onSize={()=>{setSelected(null);setSizeOpen(true);}} onPointerMove={interaction.onPointerMove} onPointerUp={interaction.onPointerUp} onPointerCancel={interaction.onPointerCancel}><LabelSvg guidelines={interaction.guidelines} activeAnchorDrag={interaction.activeAnchorDrag} onAnchorStart={interaction.onAnchorStart} onTextChange={(id,content)=>commit([{op:'update',id,changes:{content,template:undefined}}])} fonts={fontStyles} doc={display} selectedId={selected} grid={grid.visible} gridStep={grid.step} onObjectDoubleClick={id=>{setSelected(id);setPropertiesOpen(true);}} onPointerDown={interaction.onPointerDown} onResizeStart={interaction.onResizeStart}/></DesignSurface></div>
 <aside className={'chat composer'+(chatOpen?' expanded':'')} aria-label="Assistant">
 {chatOpen&&<div className="conversation"><div className="chat-heading"><h2>Assistant</h2><button aria-label="Close conversation" onClick={()=>setChatOpen(false)}><X size={17}/></button></div><div className="messages">{messages.map((m,i)=><div key={i} className={'message '+m.role}><p>{m.text}</p></div>)}{busy&&<p role="status">กำลังประมวลผล…</p>}<div ref={chatEnd}/></div><div className="suggestions">{[['Center barcode','จัดบาร์โค้ดตรงกลาง'],['Add a lot number','เพิ่ม Lot']].map(([label,text])=><button key={text} disabled={busy} onClick={()=>chat(text)}>{label}</button>)}</div></div>}
 <form onSubmit={e=>{e.preventDefault();chat();}}><button type="button" className="provider-switch" title={provider==='demo'?'Demo · คำสั่งทดลอง ไม่ใช้โมเดล AI':'AI connection settings'} disabled={busy} onClick={()=>setSettings(true)}>{provider==='demo'?'Demo':provider==='api'?'API':'Codex'}<ChevronDown size={13}/></button><button type="button" aria-label="Conversation" aria-expanded={chatOpen} onClick={()=>setChatOpen(!chatOpen)}><ChevronUp size={17}/></button><textarea rows={1} aria-label="Chat message" placeholder="Describe a change…" value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();chat();}}}/><button aria-label="Send" className="primary" disabled={busy||!prompt.trim()}><Send size={18}/></button></form></aside></main>
 {shareOpen&&<ShareDialog doc={doc} onClose={()=>setShareOpen(false)}/>}
 {variablesOpen&&<VariablesDialog variables={doc.variables??[]} formulas={doc.formulas??[]} onClose={()=>setVariablesOpen(false)} onSave={variables=>{if(commit([{op:'setVariables',variables}]))setVariablesOpen(false);}}/>}
 {formulaBuilderOpen&&<FormulaBuilderDialog formulas={doc.formulas??[]} variables={doc.variables??[]} initialFormulaId={targetFormulaId} onClose={()=>setFormulaBuilderOpen(false)} onVariablesChange={nextVars=>{commit([{op:'setVariables',variables:nextVars}]);}} onSave={(formulas,nextVars)=>{const cmds:Command[]=[{op:'setFormulas',formulas}];if(nextVars)cmds.push({op:'setVariables',variables:nextVars});if(commit(cmds))setFormulaBuilderOpen(false);}}/>}
 {sizeOpen&&<LabelSizeDialog doc={doc} onResize={(width,height)=>commit([{op:'resize',width,height}])} onClose={()=>setSizeOpen(false)}/>}
 {closingDoc&&<CloseProjectDialog doc={closingDoc} isOnlyDocument={documents.length<=1} onCancel={()=>setClosingDocId(null)} onConfirm={confirmCloseProject}/>}
 {deletion.dialog}{notice&&<div role="status" className="toast">{notice}</div>}
 <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>4_000_000)throw Error('Maximum 4 MB');const d=migrateDocument(JSON.parse(await f.text()));if(documents.length>=50&&!documents.some(job=>job.id===d.id))throw Error('Maximum 50 jobs');if(documents.some(job=>job.id===d.id)){d.id=crypto.randomUUID();}openJob(d);}catch(err){setNotice((err as Error).message);}e.target.value='';}}/>
 <input ref={imageFile} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2_000_000){setNotice('Maximum image size 2 MB');return;}const reader=new FileReader();reader.onload=()=>{const o=object('image',{content:String(reader.result),width:Math.min(15,doc.width-6),height:Math.min(10,doc.height-6),name:f.name});if(commit([{op:'add',object:o}]))setSelected(o.id);};reader.readAsDataURL(f);e.target.value='';}}/>
 {settings&&<AIConnectionSettings provider={provider} connections={connections} onClose={()=>setSettings(false)} onSave={(next, values)=>{setProvider(next);setConnections(values);setSettings(false);}}/>}
 {printOpen&&<PrintDialog doc={doc} onAdjust={commit} onClose={()=>setPrintOpen(false)}/>}
 {pwaDialogOpen&&<PwaInstallDialog hasPrompt={hasPrompt} onInstall={installApp} onClose={()=>setPwaDialogOpen(false)}/>}
 </div>;
}
