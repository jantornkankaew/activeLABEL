import {resizeHandles} from './resizeObject';
import {exceedsLabel} from './labelBounds';
import {linePoints} from './lineGeometry';
import {encodeBarcode,barcodeMagnification,isLinearBarcode,type BarTopStyle} from './barcodes';
import {textMetrics,fontStack} from './typography';
import type {LabelDocument,LabelObject} from './core';
import {useId,useRef,useState,useEffect,type PointerEventHandler} from 'react';
export function shapeBarcodeTop(svg:string,heightScale=100,style:BarTopStyle='flat'):string {
 if(heightScale===100&&style==='flat')return svg;const view=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg),transform=/scale\(([\d.]+)\)/.exec(svg),bars=[...svg.matchAll(/M(-?[\d.]+) (-?[\d.]+)L\1 (-?[\d.]+)/g)];if(!view||!transform||!bars.length)return svg;const outerHeight=Number(view[2]),unitScale=Number(transform[1]),barTop=Math.min(...bars.map(match=>Number(match[3]))),barBottom=Math.max(...bars.map(match=>Number(match[2]))),crop=(barBottom-barTop)*unitScale*(1-heightScale/100),innerTop=barTop+crop/unitScale,newHeight=outerHeight-crop;let bubbles='';
 const shaped=svg.replace(/<path stroke="(#(?:[0-9A-Fa-f]{6}))" stroke-width="([\d.]+)" d="([^"]+)" \/>/g,(_whole:string,color:string,widthText:string,path:string)=>{const stroke=Number(widthText),amplitude=Math.min(24,Math.max(4,(outerHeight/unitScale-innerTop)*.12));const next=path.replace(/M(-?[\d.]+) (-?[\d.]+)L\1 (-?[\d.]+)/g,(_line:string,xText:string,bottomText:string)=>{const x=Number(xText);let offset=0;if(style==='wave')offset=(Math.sin(x/22)+1)*amplitude/2;else if(style==='zigzag'){const phase=((x/30)%2+2)%2;offset=(phase<=1?phase:2-phase)*amplitude;}else if(style==='sawtooth')offset=(((x/36)%1)+1)%1*amplitude;const top=innerTop+offset;if(style==='bubble'){const radius=stroke/2;bubbles+=`<circle cx="${x}" cy="${innerTop+radius}" r="${radius}" fill="${color}"/>`;return `M${xText} ${bottomText}L${xText} ${innerTop+radius}`;}return `M${xText} ${bottomText}L${xText} ${top}`;});return `<path stroke="${color}" stroke-width="${widthText}" d="${next}" />`;});
 const withBubbles=bubbles?shaped.replace(/(<g transform="[^"]+">)/,`$1${bubbles}`):shaped;return withBubbles.replace(`viewBox="0 0 ${view[1]} ${view[2]}"`,`viewBox="0 ${crop} ${view[1]} ${newHeight}"`).replace(`<rect width="${view[1]}" height="${view[2]}" fill="white"/>`,`<rect y="${crop}" width="${view[1]}" height="${newHeight}" fill="white"/>`);
}
export function barcodeSvg(o:LabelObject):string {const base=encodeBarcode(o.symbology,o.content);return isLinearBarcode(o.symbology)?shapeBarcodeTop(base,o.barHeightScale??100,o.barTopStyle??'flat'):base;}
export function barcodeOverflowSvg(o:LabelObject){return barcodeSvg(o).replace('<svg ', '<svg fill="#dc2626" ').replaceAll('#000000','#dc2626');}
function BarcodeVector({item,color}:{item:LabelObject;color?:string}){let source=barcodeSvg(item);if(color)source=source.replaceAll('#000000',color);const viewBox=/viewBox="([^"]+)"/.exec(source)?.[1]??`0 0 ${item.width} ${item.height}`,body=source.slice(source.indexOf('>')+1,source.lastIndexOf('</svg>'));return <svg data-barcode-vector="true" x={item.x} y={item.y} width={item.width} height={item.height} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" overflow="hidden" dangerouslySetInnerHTML={{__html:body}}/>;}
export function vectorObject(o:LabelObject){switch(o.kind){case 'text':{const align=o.textAlign??'left';return <text x={align==='center'?o.x+o.width/2:align==='right'?o.x+o.width:o.x} y={o.y+textMetrics(o.content,o.fontSize,o.fontName,o.bold).baseline} textAnchor={align==='center'?'middle':align==='right'?'end':'start'} fontSize={o.fontSize} fontFamily={fontStack(o.fontName)} style={{fontKerning:'none',fontVariantLigatures:'none'}} fontWeight={o.bold?700:400} fontStyle={o.italic?'italic':'normal'} textDecoration={o.underline?'underline':'none'}>{o.content}</text>;}case 'barcode':return <BarcodeVector item={o}/>;case 'image':return <image x={o.x} y={o.y} width={o.width} height={o.height} href={o.content} preserveAspectRatio="xMidYMid meet"/>;case 'box':return <rect x={o.x} y={o.y} width={o.width} height={o.height} fill="none" stroke="black" strokeWidth="0.2"/>;case 'line':{const p=linePoints(o);return <line x1={p.startX} y1={p.startY} x2={p.endX} y2={p.endY} stroke="black" strokeWidth="0.2"/>;}}}
import type {AlignmentGuideline} from './guidelines';

function springPath(x1: number, y1: number, x2: number, y2: number, isCentered = false): string {
 const dx = x2 - x1;
 const dy = y2 - y1;
 const dist = Math.hypot(dx, dy);
 if (dist < 4 || !isCentered) return `M ${x1} ${y1} L ${x2} ${y2}`;
 const ux = dx / dist;
 const uy = dy / dist;
 const px = -uy;
 const py = ux;
 const lead = Math.min(2, dist * 0.15);
 const span = dist - lead * 2;
 const coils = Math.max(3, Math.min(8, Math.floor(span / 2)));
 const step = span / (coils * 2);
 const amp = 0.8;

 let d = `M ${x1} ${y1} L ${x1 + ux * lead} ${y1 + uy * lead}`;
 let cx = x1 + ux * lead;
 let cy = y1 + uy * lead;
 for (let i = 0; i < coils * 2; i++) {
  const sign = (i % 2 === 0) ? 1 : -1;
  cx += ux * step;
  cy += uy * step;
  d += ` L ${cx + px * amp * sign} ${cy + py * amp * sign}`;
 }
 d += ` L ${x2 - ux * lead} ${y2 - uy * lead} L ${x2} ${y2}`;
 return d;
}

function AnchorVisuals({
 item,
 doc,
 pixelScale = 5,
 activeAnchorDrag,
 onAnchorPointerDown
}:{
 item: LabelObject;
 doc: LabelDocument;
 pixelScale?: number;
 activeAnchorDrag?: import('./useCanvasInteraction').ActiveAnchorDrag | null;
 onAnchorPointerDown?: (e: React.PointerEvent<SVGElement>, side: import('./anchors').AnchorSide) => void;
}){
 const visuals: React.JSX.Element[] = [];
 const {x,y,width:w,height:h,anchors={}}=item;
 const isHCentered = Boolean(anchors.left && anchors.right);
 const isVCentered = Boolean(anchors.top && anchors.bottom);
 const sides = ['top','bottom','left','right'] as const;

 const hr = Math.max(0.35, 3.2 / pixelScale);
 const hitR = Math.max(1.2, 7.5 / pixelScale);
 const strokeW = Math.max(0.08, 1 / pixelScale);

 for(const side of sides){
  const a = anchors[side];
  if(!a)continue;
  let sx=0, sy=0, tx=0, ty=0;
  if(side==='top'){
   sx = x + w/2; sy = y;
   if(a.target==='parent'){
    tx = sx; ty = a.targetEdge==='bottom'?doc.height:0;
   } else {
    const t = doc.objects.find(o=>o.id===a.target);
    if(!t)continue;
    tx = sx; ty = a.targetEdge==='bottom'?t.y+t.height:t.y;
   }
  } else if(side==='bottom'){
   sx = x + w/2; sy = y + h;
   if(a.target==='parent'){
    tx = sx; ty = a.targetEdge==='top'?0:doc.height;
   } else {
    const t = doc.objects.find(o=>o.id===a.target);
    if(!t)continue;
    tx = sx; ty = a.targetEdge==='bottom'?t.y+t.height:t.y;
   }
  } else if(side==='left'){
   sx = x; sy = y + h/2;
   if(a.target==='parent'){
    tx = a.targetEdge==='right'?doc.width:0; ty = sy;
   } else {
    const t = doc.objects.find(o=>o.id===a.target);
    if(!t)continue;
    tx = a.targetEdge==='right'?t.x+t.width:t.x; ty = sy;
   }
  } else if(side==='right'){
   sx = x + w; sy = y + h/2;
   if(a.target==='parent'){
    tx = a.targetEdge==='left'?0:doc.width; ty = sy;
   } else {
    const t = doc.objects.find(o=>o.id===a.target);
    if(!t)continue;
    tx = a.targetEdge==='right'?t.x+t.width:t.x; ty = sy;
   }
  }
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;
  const label = a.margin === 'auto' ? 'auto' : `${a.margin}mm`;
  const isCentered = (side==='left'||side==='right') ? isHCentered : isVCentered;
  const pathD = springPath(sx, sy, tx, ty, isCentered);

  visuals.push(
   <g key={`anchor-${side}`} data-editor-only="true" pointerEvents="none">
    <path d={pathD} className={`canvas-anchor-line ${isCentered ? 'spring' : ''}`} fill="none" strokeWidth={strokeW} vectorEffect="non-scaling-stroke"/>
    <circle cx={sx} cy={sy} r={Math.max(0.2, 2.2 / pixelScale)} fill="#00866c"/>
    <circle cx={tx} cy={ty} r={Math.max(0.25, 2.8 / pixelScale)} fill="#fff" stroke="#00866c" strokeWidth={strokeW} vectorEffect="non-scaling-stroke"/>
    {Math.hypot(tx-sx, ty-sy) > 2.5 && (
     <text x={midX} y={midY + (side==='left'||side==='right'?-0.6:0.5)} className="canvas-anchor-badge" fontSize={Math.max(0.8, 8 / pixelScale)}>{label}</text>
    )}
   </g>
  );
 }

 // 4 Android Studio circular constraint handles on the object perimeter (pixel-scaled, draggable)
 const handleDefs = [
  {side:'top' as const, cx:x+w/2, cy:y},
  {side:'bottom' as const, cx:x+w/2, cy:y+h},
  {side:'left' as const, cx:x, cy:y+h/2},
  {side:'right' as const, cx:x+w, cy:y+h/2}
 ];

 visuals.push(
  <g key="anchor-handles" data-editor-only="true">
   {handleDefs.map(({side, cx, cy}) => {
    const isLinked = Boolean(anchors[side]);
    const isDraggingThis = activeAnchorDrag?.sourceSide === side;
    return (
     <g key={side} className="canvas-anchor-handle-wrap" data-id={item.id}>
      <circle
       cx={cx}
       cy={cy}
       r={hitR}
       fill="transparent"
       style={{cursor:'crosshair'}}
       onPointerDown={e => onAnchorPointerDown?.(e, side)}
       aria-label={`Constraint handle ${side}`}
      />
      {isDraggingThis && (
       <circle
        cx={cx}
        cy={cy}
        r={hr * 1.8}
        fill="none"
        stroke="#00866c"
        strokeWidth={strokeW}
        strokeOpacity={0.6}
        strokeDasharray="2 1"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
       />
      )}
      {isLinked ? (
       <g pointerEvents="none">
        <circle cx={cx} cy={cy} r={hr} fill="#00866c" stroke="#fff" strokeWidth={strokeW} vectorEffect="non-scaling-stroke"/>
        <circle cx={cx} cy={cy} r={hr * 0.42} fill="#fff"/>
       </g>
      ) : (
       <g pointerEvents="none">
        <circle cx={cx} cy={cy} r={hr} fill="#fff" stroke="#00866c" strokeWidth={strokeW} vectorEffect="non-scaling-stroke"/>
        <circle cx={cx} cy={cy} r={hr * 0.35} fill="#00866c"/>
       </g>
      )}
     </g>
    );
   })}
  </g>
 );

 // Active Drag Visuals: Dynamic connection wire, target edge snapping, and floating pill badge
 if(activeAnchorDrag){
  const targetObj = activeAnchorDrag.targetId !== 'parent'
   ? doc.objects.find(o => o.id === activeAnchorDrag.targetId)
   : null;

  visuals.push(
   <g key="active-anchor-drag" data-editor-only="true" pointerEvents="none">
    {activeAnchorDrag.targetId === 'parent' && (
     <line
      x1={activeAnchorDrag.targetEdge === 'right' ? doc.width : 0}
      y1={activeAnchorDrag.targetEdge === 'bottom' ? doc.height : 0}
      x2={activeAnchorDrag.targetEdge === 'left' ? 0 : doc.width}
      y2={activeAnchorDrag.targetEdge === 'top' ? 0 : doc.height}
      stroke="#00866c"
      strokeWidth={2.8 / pixelScale}
      strokeDasharray="4 2"
      vectorEffect="non-scaling-stroke"
     />
    )}

    {targetObj && (
     <g>
      <rect
       x={targetObj.x - 0.5}
       y={targetObj.y - 0.5}
       width={targetObj.width + 1}
       height={targetObj.height + 1}
       fill="rgba(0, 134, 108, 0.08)"
       stroke="#00866c"
       strokeWidth={1.5 / pixelScale}
       strokeDasharray="3 2"
       rx={1}
       vectorEffect="non-scaling-stroke"
      />
      <line
       x1={activeAnchorDrag.targetEdge === 'right' ? targetObj.x + targetObj.width : targetObj.x}
       y1={activeAnchorDrag.targetEdge === 'bottom' ? targetObj.y + targetObj.height : targetObj.y}
       x2={activeAnchorDrag.targetEdge === 'left' ? targetObj.x : targetObj.x + targetObj.width}
       y2={activeAnchorDrag.targetEdge === 'top' ? targetObj.y : targetObj.y + targetObj.height}
       stroke="#00866c"
       strokeWidth={3.2 / pixelScale}
       vectorEffect="non-scaling-stroke"
      />
     </g>
    )}

    <line
     x1={activeAnchorDrag.startX}
     y1={activeAnchorDrag.startY}
     x2={activeAnchorDrag.snapX}
     y2={activeAnchorDrag.snapY}
     stroke="#00866c"
     strokeWidth={1.6 / pixelScale}
     strokeDasharray="3 1.5"
     vectorEffect="non-scaling-stroke"
    />

    <circle
     cx={activeAnchorDrag.snapX}
     cy={activeAnchorDrag.snapY}
     r={4 / pixelScale}
     fill="#00866c"
     stroke="#fff"
     strokeWidth={1.5 / pixelScale}
     vectorEffect="non-scaling-stroke"
    />

    <g transform={`translate(${activeAnchorDrag.snapX}, ${activeAnchorDrag.snapY - 7 / pixelScale})`}>
     <rect
      x={-36 / pixelScale}
      y={-14 / pixelScale}
      width={72 / pixelScale}
      height={14 / pixelScale}
      rx={3 / pixelScale}
      fill="#1e293b"
      fillOpacity="0.95"
     />
     <text
      x="0"
      y={-4 / pixelScale}
      textAnchor="middle"
      fill="#ffffff"
      fontSize={8 / pixelScale}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="600"
     >
      {activeAnchorDrag.targetId === 'parent'
       ? `Snap to Label (${activeAnchorDrag.targetEdge})`
       : `Snap to ${activeAnchorDrag.targetName ?? 'Target'} (${activeAnchorDrag.targetEdge})`}
     </text>
    </g>
   </g>
  );
 }

 return <>{visuals}</>;
}

export function LabelSvg({doc,selectedId,guidelines=[],activeAnchorDrag,onAnchorStart,onPointerDown,onResizeStart,onObjectDoubleClick,onTextChange,grid=false,gridStep=1,fonts=''}:{doc:LabelDocument;fonts?:string;selectedId?:string|null;guidelines?:AlignmentGuideline[];activeAnchorDrag?:import('./useCanvasInteraction').ActiveAnchorDrag|null;onAnchorStart?:(e:React.PointerEvent<SVGElement>,side:import('./anchors').AnchorSide)=>void;grid?:boolean;gridStep?:number;onPointerDown?:PointerEventHandler<SVGGElement>;onResizeStart?:PointerEventHandler<SVGRectElement>;onObjectDoubleClick?:(id:string)=>void;onTextChange?:(id:string,content:string)=>boolean}){
 const [editing,setEditing]=useState<string|null>(null);useEffect(()=>{setEditing(null);},[doc.id,selectedId]);const edited=doc.objects.find(o=>o.id===editing&&o.kind==='text'&&!o.locked);
 const svgRef=useRef<SVGSVGElement>(null);const [pixelScale,setPixelScale]=useState(5);useEffect(()=>{if(!svgRef.current)return;const observer=new ResizeObserver(([entry])=>setPixelScale(Math.max(.1,entry.contentRect.width/doc.width)));observer.observe(svgRef.current);return()=>observer.disconnect();},[doc.width]);const handleSize=8/pixelScale;
 const gridId=useId().replaceAll(':','')+'-grid';
 const selectedObj = doc.objects.find(o => o.id === selectedId);
 return <svg ref={svgRef} id="label-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${doc.width} ${doc.height}`} aria-label="Label canvas" style={{width:'100%',height:'100%',overflow:onPointerDown?'visible':undefined}}><defs><style>{fonts}</style>{grid&&<pattern data-editor-only="true" id={gridId} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse"><path d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`} fill="none" stroke="#a8c1c7" strokeWidth=".035"/></pattern>}</defs><rect width={doc.width} height={doc.height} fill="white"/>{grid&&<rect data-editor-only="true" width={doc.width} height={doc.height} fill={`url(#${gridId})`} pointerEvents="none"/>}{doc.objects.map((o,index)=><g key={o.id} data-id={o.id} onPointerDown={onPointerDown} onDoubleClick={e=>{e.stopPropagation();onObjectDoubleClick?.(o.id);if(o.kind==='text'&&!o.locked&&onTextChange)setEditing(o.id);}}>{vectorObject(o)}{onPointerDown&&o.kind==='barcode'&&exceedsLabel(o,doc)&&<g data-editor-only="true" pointerEvents="none" aria-label="Barcode outside label"><defs><mask id={`${gridId}-${index}-overflow`} maskUnits="userSpaceOnUse" x={o.x} y={o.y} width={o.width} height={o.height}><rect x={o.x} y={o.y} width={o.width} height={o.height} fill="white"/><rect width={doc.width} height={doc.height} fill="black"/></mask></defs><g mask={`url(#${gridId}-${index}-overflow)`}><rect x={o.x} y={o.y} width={o.width} height={o.height} fill="#fff0f0"/><image x={o.x} y={o.y} width={o.width} height={o.height} href={'data:image/svg+xml;base64,'+btoa(barcodeOverflowSvg(o))} preserveAspectRatio="xMidYMid meet"/><rect x={o.x} y={o.y} width={o.width} height={o.height} fill="none" stroke="#dc2626" strokeWidth=".15"/></g></g>}{onPointerDown&&o.kind==='line'&&<line data-editor-only="true" x1={linePoints(o).startX} y1={linePoints(o).startY} x2={linePoints(o).endX} y2={linePoints(o).endY} stroke="transparent" strokeWidth="2"/>}{onPointerDown&&<rect data-editor-only="true" x={o.x} y={o.y} width={o.width} height={o.height} fill={o.kind==='line'||o.kind==='box'?'none':'transparent'} pointerEvents={o.kind==='line'?'none':o.kind==='box'?'stroke':'all'} stroke={selectedId===o.id?'#3284ff':o.kind==='box'?'transparent':'none'} strokeWidth="1" vectorEffect="non-scaling-stroke"/>}{onResizeStart&&selectedId===o.id&&o.kind==='barcode'&&<text data-editor-only="true" aria-label="Barcode resize percentage" pointerEvents="none" x={o.x+o.width-.5} y={Math.min(doc.height-.5,o.y+o.height+2)} textAnchor="end" fontSize="1.5" fontFamily="Arial,sans-serif" fill="#08745b" stroke="white" strokeWidth=".45" paintOrder="stroke">{Number(barcodeMagnification(o).toFixed(2))}%</text>}{onResizeStart&&selectedId===o.id&&editing!==o.id&&!o.locked&&(o.kind==='line'?['se'] as const:resizeHandles).map(handle=><rect key={handle} data-editor-only="true" data-id={o.id} data-handle={handle} aria-label={`Resize ${o.kind} ${handle}`} className={`canvas-resize-handle ${o.kind==='line'?'canvas-line-resize':''}`} style={{cursor:handle==='n'||handle==='s'?'ns-resize':handle==='e'||handle==='w'?'ew-resize':handle==='nw'||handle==='se'?'nwse-resize':'nesw-resize'}} x={(o.kind==='line'?linePoints(o).endX:o.x+o.width*(handle.includes('w')?0:handle.includes('e')?1:.5))-handleSize/2} y={(o.kind==='line'?linePoints(o).endY:o.y+o.height*(handle.includes('n')?0:handle.includes('s')?1:.5))-handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#3284ff" strokeWidth="1" vectorEffect="non-scaling-stroke" onPointerDown={onResizeStart}/>)}</g>)}{selectedObj && <AnchorVisuals item={selectedObj} doc={doc} pixelScale={pixelScale} activeAnchorDrag={activeAnchorDrag} onAnchorPointerDown={onAnchorStart}/>}{guidelines.map((g,i)=><line key={`guideline-${g.orientation}-${i}-${g.position}`} data-editor-only="true" className="canvas-guideline" pointerEvents="none" x1={g.orientation==='horizontal'?0:g.position} y1={g.orientation==='horizontal'?g.position:0} x2={g.orientation==='horizontal'?doc.width:g.position} y2={g.orientation==='horizontal'?g.position:doc.height} stroke="#8b5cf6" strokeWidth="1" vectorEffect="non-scaling-stroke"/>)}{edited&&onTextChange&&<InlineText key={edited.id} item={edited} maxWidth={doc.width-edited.x} pixelScale={pixelScale} onChange={value=>onTextChange(edited.id,value)} onEnd={()=>setEditing(null)}/>}</svg>;
}

function InlineText({item,maxWidth,pixelScale,onChange,onEnd}:{item:LabelObject;maxWidth:number;pixelScale:number;onChange:(value:string)=>boolean;onEnd:()=>void}){
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const node=input.current;if(node){node.focus();node.setSelectionRange(node.value.length,node.value.length);}},[]);
 const width=Math.max(item.width,Math.min(maxWidth,item.width+2));
 // Keep HTML controls in screen pixels, cancelling the SVG scale. Subpixel HTML
 // borders are rounded by Chrome before SVG zoom and otherwise become thick bands.
 return <foreignObject data-editor-only="true" x={item.x} y={item.y} width={width} height={item.height+.5} onPointerDown={e=>e.stopPropagation()} onDoubleClick={e=>e.stopPropagation()}>
 <div style={{width:width*pixelScale,height:item.height*pixelScale,transform:`scale(${1/pixelScale})`,transformOrigin:'0 0'}}>
 <input ref={input} aria-label="Edit text on label" value={item.content} onChange={e=>onChange(e.target.value)} onBlur={onEnd} onKeyDown={e=>{e.stopPropagation();if((e.key==='Enter'||e.key==='Escape')&&!e.nativeEvent.isComposing){e.preventDefault();onEnd();}}} style={{display:'block',boxSizing:'border-box',width:'100%',height:'100%',padding:0,margin:0,border:'1px solid #3284ff',borderRadius:2,outline:'none',outlineOffset:0,boxShadow:'none',background:'white',color:'black',caretColor:'#202124',fontFamily:fontStack(item.fontName),fontSize:item.fontSize*pixelScale,fontWeight:item.bold?700:400,fontStyle:item.italic?'italic':'normal',textDecoration:item.underline?'underline':'none',textAlign:item.textAlign??'left',fontKerning:'none',fontVariantLigatures:'none',lineHeight:`${item.height*pixelScale}px`}}/>
 </div></foreignObject>;
}

export function exportSvg(doc:LabelDocument,markup:string):string {
 const parsed=new DOMParser().parseFromString(markup,'image/svg+xml');const svg=parsed.documentElement;svg.style.overflow='hidden';svg.setAttribute('width',`${doc.width}mm`);svg.setAttribute('height',`${doc.height}mm`);
 svg.querySelectorAll('[data-editor-only], g > rect[fill="transparent"]').forEach(n=>n.remove());
 const neededFonts=new Set(doc.objects.filter(o=>o.kind==='text').flatMap(o=>fontStack(o.fontName).split(',').map(name=>name.trim().replace(/^"|"$/g,'')+':'+(o.bold?700:400))));
 svg.querySelectorAll('defs style').forEach(style=>{style.textContent=(style.textContent?.match(/@font-face\{[^}]+\}/g)??[]).filter(face=>{const family=/font-family:"([^"]+)"/.exec(face)?.[1];const weight=/font-weight:(\d+)/.exec(face)?.[1];return neededFonts.has(family+':'+weight);}).join('\n');});
 return new XMLSerializer().serializeToString(svg);
}

export async function rasterize(svg:string,width:number,height:number,dpi:number):Promise<string>{const image=new Image();const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Image rendering failed'));image.src=url;});const c=document.createElement('canvas');c.width=Math.round(width*dpi/25.4);c.height=Math.round(height*dpi/25.4);if(c.width*c.height>16_000_000)throw Error('Print image is too large');const ctx=c.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];}finally{URL.revokeObjectURL(url);}}
