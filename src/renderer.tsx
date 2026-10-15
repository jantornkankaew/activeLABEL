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
import {getAnchorPoint, calculateCurrentMargin, type AnchorSide} from './anchors';

function springPath(x1: number, y1: number, x2: number, y2: number, isCentered = false): { path: string; arrowD?: string; midX: number; midY: number } {
 const dx = x2 - x1;
 const dy = y2 - y1;
 const dist = Math.hypot(dx, dy);
 const midX = (x1 + x2) / 2;
 const midY = (y1 + y2) / 2;
 if (dist < 1) return { path: `M ${x1} ${y1} L ${x2} ${y2}`, midX, midY };
 const ux = dx / dist;
 const uy = dy / dist;
 const px = -uy;
 const py = ux;
 const arrowLen = Math.min(1.4, dist * 0.25);
 const arrowW = Math.min(1.0, dist * 0.2);

 const ax = x2 - ux * arrowLen;
 const ay = y2 - uy * arrowLen;
 const arrowD = `M ${ax + px * arrowW} ${ay + py * arrowW} L ${x2} ${y2} L ${ax - px * arrowW} ${ay - py * arrowW}`;

 if (!isCentered || dist < 3) {
  return { path: `M ${x1} ${y1} L ${ax} ${ay}`, arrowD, midX, midY };
 }

 const lead = Math.min(1.5, dist * 0.1);
 const span = dist - lead - arrowLen;
 const coils = Math.max(4, Math.floor(span / 0.65));
 const step = span / (coils * 2);
 const amp = 0.55;

 let d = `M ${x1} ${y1} L ${x1 + ux * lead} ${y1 + uy * lead}`;
 let cx = x1 + ux * lead;
 let cy = y1 + uy * lead;
 for (let i = 0; i < coils * 2; i++) {
  const sign = (i % 2 === 0) ? 1 : -1;
  cx += ux * step;
  cy += uy * step;
  d += ` L ${cx + px * amp * sign} ${cy + py * amp * sign}`;
 }
 d += ` L ${ax} ${ay}`;
 return { path: d, arrowD, midX, midY };
}

export function bezierWirePath(
 sx: number,
 sy: number,
 tx: number,
 ty: number,
 sourceSide: AnchorSide,
 targetEdge: AnchorSide
): { path: string; arrowD?: string; midX: number; midY: number } {
 const dist = Math.hypot(tx - sx, ty - sy);
 if (dist < 0.5) {
  return { path: `M ${sx} ${sy} L ${tx} ${ty}`, midX: (sx + tx) / 2, midY: (sy + ty) / 2 };
 }

 const outDx = sourceSide === 'left' ? -1 : sourceSide === 'right' ? 1 : 0;
 const outDy = sourceSide === 'top' ? -1 : sourceSide === 'bottom' ? 1 : 0;

 const inDx = targetEdge === 'left' ? -1 : targetEdge === 'right' ? 1 : 0;
 const inDy = targetEdge === 'top' ? -1 : targetEdge === 'bottom' ? 1 : 0;

 const curveLen = Math.max(2.5, Math.min(dist * 0.45, 12));
 const cp1x = sx + outDx * curveLen;
 const cp1y = sy + outDy * curveLen;
 const cp2x = tx + inDx * curveLen;
 const cp2y = ty + inDy * curveLen;

 const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

 const midX = 0.125 * sx + 0.375 * cp1x + 0.375 * cp2x + 0.125 * tx;
 const midY = 0.125 * sy + 0.375 * cp1y + 0.375 * cp2y + 0.125 * ty;

 const vArrX = tx - cp2x;
 const vArrY = ty - cp2y;
 const arrDist = Math.hypot(vArrX, vArrY) || 1;
 const ux = vArrX / arrDist;
 const uy = vArrY / arrDist;
 const px = -uy;
 const py = ux;
 const arrowLen = Math.min(1.4, Math.max(0.8, dist * 0.2));
 const arrowW = Math.min(1.0, Math.max(0.6, dist * 0.15));
 const ax = tx - ux * arrowLen;
 const ay = ty - uy * arrowLen;
 const arrowD = `M ${ax + px * arrowW} ${ay + py * arrowW} L ${tx} ${ty} L ${ax - px * arrowW} ${ay - py * arrowW}`;

 return { path, arrowD, midX, midY };
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

 // Compact, refined Android Studio handles
 const hr = Math.max(0.3, 2.4 / pixelScale);
 const hitR = Math.max(2.5, 12 / pixelScale);
 const strokeW = Math.max(0.08, 1 / pixelScale);

 // 1. Render established anchor lines and badges
 for(const side of sides){
  const a = anchors[side];
  if(!a)continue;
  const sp = getAnchorPoint(item, side);
  const sx = sp.x;
  const sy = sp.y;
  let tx = 0;
  let ty = 0;

  if(a.target === 'parent'){
   if(side === 'top'){
    tx = sx; ty = a.targetEdge === 'bottom' ? doc.height : 0;
   } else if(side === 'bottom'){
    tx = sx; ty = a.targetEdge === 'top' ? 0 : doc.height;
   } else if(side === 'left'){
    tx = a.targetEdge === 'right' ? doc.width : 0; ty = sy;
   } else if(side === 'right'){
    tx = a.targetEdge === 'left' ? 0 : doc.width; ty = sy;
   }
  } else {
   const t = doc.objects.find(o => o.id === a.target);
   if(!t)continue;
   const tp = getAnchorPoint(t, a.targetEdge);
   tx = tp.x;
   ty = tp.y;
  }

  const liveMargin = calculateCurrentMargin(side, a.target, a.targetEdge, item, doc);
  const label = a.margin === 'auto' ? 'auto' : `${liveMargin}mm`;
  const isCentered = (side==='left'||side==='right') ? isHCentered : isVCentered;

  let pathD = '';
  let arrowD: string | undefined;
  let midX = (sx + tx) / 2;
  let midY = (sy + ty) / 2;

  if(a.target !== 'parent'){
   const res = bezierWirePath(sx, sy, tx, ty, side, a.targetEdge);
   pathD = res.path;
   arrowD = res.arrowD;
   midX = res.midX;
   midY = res.midY;
  } else {
   const res = springPath(sx, sy, tx, ty, isCentered);
   pathD = res.path;
   arrowD = res.arrowD;
   midX = res.midX;
   midY = res.midY;
  }

  visuals.push(
   <g key={`anchor-${side}`} data-editor-only="true" pointerEvents="none">
    {/* Target Object Highlight when anchored to another object */}
    {a.target !== 'parent' && (() => {
     const t = doc.objects.find(o => o.id === a.target);
     if (!t) return null;
     return (
      <rect
       key={`target-outline-${side}`}
       x={t.x - 0.4}
       y={t.y - 0.4}
       width={t.width + 0.8}
       height={t.height + 0.8}
       fill="rgba(33, 150, 243, 0.05)"
       stroke="#2196F3"
       strokeWidth={1.2}
       strokeDasharray="3 2"
       rx={0.8}
       vectorEffect="non-scaling-stroke"
      />
     );
    })()}

    {/* The connection wire between objects or to parent edge */}
    <path
     d={pathD}
     className={`canvas-anchor-line ${isCentered && a.target === 'parent' ? 'spring' : ''}`}
     fill="none"
     stroke="#2196F3"
     strokeWidth={1.8}
     vectorEffect="non-scaling-stroke"
    />
    {arrowD && (
     <path
      d={arrowD}
      fill="none"
      stroke="#2196F3"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
     />
    )}

    {/* Source anchor dot */}
    <circle cx={sx} cy={sy} r={hr} fill="#2196F3" stroke="#fff" strokeWidth={1.2} vectorEffect="non-scaling-stroke"/>

    {/* Target anchor dot */}
    <circle cx={tx} cy={ty} r={hr * 1.15} fill="#2196F3" stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke"/>

    {Math.hypot(tx-sx, ty-sy) > 2 && (
     <g transform={`translate(${midX}, ${midY})`}>
      <rect
       x={-14 / pixelScale}
       y={-6.5 / pixelScale}
       width={28 / pixelScale}
       height={13 / pixelScale}
       rx={2.5 / pixelScale}
       fill="#ffffff"
       stroke="#2196F3"
       strokeWidth={1.2}
       vectorEffect="non-scaling-stroke"
      />
      <text
       x={0}
       y={3.2 / pixelScale}
       textAnchor="middle"
       className="canvas-anchor-badge"
       fontSize={Math.max(0.7, 7.5 / pixelScale)}
       fontWeight="600"
       fill="#1976D2"
       fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
       {label}
      </text>
     </g>
    )}
   </g>
  );
 }

 // 2. Android Studio circular constraint handles on the selected object perimeter
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
       data-id={item.id}
       fill="transparent"
       pointerEvents="all"
       style={{cursor:'crosshair'}}
       onPointerDown={e => onAnchorPointerDown?.(e, side)}
       aria-label={`Constraint handle ${side}`}
      />
      {isDraggingThis && (
       <circle
        cx={cx}
        cy={cy}
        r={hr * 2.0}
        fill="none"
        stroke="#2196F3"
        strokeWidth={strokeW}
        strokeOpacity={0.65}
        strokeDasharray="2 1"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
       />
      )}
      {isLinked ? (
       <g pointerEvents="none">
        <circle cx={cx} cy={cy} r={hr} fill="#2196F3" stroke="#fff" strokeWidth={strokeW} vectorEffect="non-scaling-stroke"/>
        <circle cx={cx} cy={cy} r={hr * 0.35} fill="#fff"/>
       </g>
      ) : (
       <g pointerEvents="none">
        <circle cx={cx} cy={cy} r={hr} fill="#fff" stroke="#2196F3" strokeWidth={strokeW} vectorEffect="non-scaling-stroke"/>
        <circle cx={cx} cy={cy} r={hr * 0.35} fill="#2196F3"/>
       </g>
      )}
     </g>
    );
   })}
  </g>
 );

 // 3. Active Drag Visuals: Receptive anchor dots on all other objects, parent rails, dynamic wire, and HUD badge
 if(activeAnchorDrag){
  const isVerticalDrag = activeAnchorDrag.sourceSide === 'top' || activeAnchorDrag.sourceSide === 'bottom';
  const receptiveSides = isVerticalDrag ? (['top', 'bottom'] as const) : (['left', 'right'] as const);
  const otherObjects = doc.objects.filter(o => o.id !== activeAnchorDrag.sourceId);

  // 3a. Receptive anchor targets on all other objects
  visuals.push(
   <g key="receptive-anchor-targets" data-editor-only="true" pointerEvents="none">
    {otherObjects.map(o => {
     const isTargetObj = activeAnchorDrag.targetId === o.id;
     return (
      <g key={`receptive-${o.id}`}>
       {isTargetObj && (
        <rect
         x={o.x - 0.5}
         y={o.y - 0.5}
         width={o.width + 1}
         height={o.height + 1}
         fill="rgba(33, 150, 243, 0.06)"
         stroke="#2196F3"
         strokeWidth="1.4"
         strokeDasharray="3 2"
         rx={0.8}
         vectorEffect="non-scaling-stroke"
        />
       )}
       {receptiveSides.map(side => {
        const pt = getAnchorPoint(o, side);
        const isSnapped = isTargetObj && activeAnchorDrag.targetEdge === side;
        return (
         <g key={`target-dot-${o.id}-${side}`}>
          {isSnapped && (
           <circle
            cx={pt.x}
            cy={pt.y}
            r={hr * 2.2}
            fill="rgba(33, 150, 243, 0.22)"
            stroke="#2196F3"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
           />
          )}
          <circle
           cx={pt.x}
           cy={pt.y}
           r={isSnapped ? hr * 1.25 : hr * 0.95}
           fill={isSnapped ? '#2196F3' : '#ffffff'}
           stroke="#2196F3"
           strokeWidth="1.2"
           vectorEffect="non-scaling-stroke"
          />
          <circle
           cx={pt.x}
           cy={pt.y}
           r={hr * 0.35}
           fill={isSnapped ? '#ffffff' : '#2196F3'}
          />
         </g>
        );
       })}
      </g>
     );
    })}
   </g>
  );

  // 3b. Parent edge guide rail if target is parent
  const isTargetParent = activeAnchorDrag.targetId === 'parent';
  const isSnapped = Boolean(activeAnchorDrag.isSnapped);

  if(isTargetParent){
   visuals.push(
    <g key="parent-edge-rail" data-editor-only="true" pointerEvents="none">
     <line
      x1={activeAnchorDrag.targetEdge === 'right' ? doc.width : 0}
      y1={activeAnchorDrag.targetEdge === 'bottom' ? doc.height : 0}
      x2={activeAnchorDrag.targetEdge === 'left' ? 0 : doc.width}
      y2={activeAnchorDrag.targetEdge === 'top' ? 0 : doc.height}
      stroke="#2196F3"
      strokeOpacity={isSnapped ? 0.95 : 0.45}
      strokeWidth={isSnapped ? 2.4 : 1.6}
      strokeDasharray={isSnapped ? '4 2' : '2 2'}
      vectorEffect="non-scaling-stroke"
     />
    </g>
   );
  }

  // 3c. Dynamic dragging wire to target or mouse cursor
  let endX = activeAnchorDrag.currentX;
  let endY = activeAnchorDrag.currentY;

  if(isSnapped){
   if(!isTargetParent){
    endX = activeAnchorDrag.snapX;
    endY = activeAnchorDrag.snapY;
   } else {
    if(activeAnchorDrag.sourceSide === 'top' || activeAnchorDrag.sourceSide === 'bottom'){
     endX = activeAnchorDrag.currentX;
     endY = activeAnchorDrag.snapY;
    } else {
     endX = activeAnchorDrag.snapX;
     endY = activeAnchorDrag.currentY;
    }
   }
  }

  let dragWireD = '';
  let dragArrowD: string | undefined;

  if(!isTargetParent && isSnapped){
   const res = bezierWirePath(
    activeAnchorDrag.startX,
    activeAnchorDrag.startY,
    endX,
    endY,
    activeAnchorDrag.sourceSide,
    activeAnchorDrag.targetEdge
   );
   dragWireD = res.path;
   dragArrowD = res.arrowD;
  } else if(isTargetParent && isSnapped){
   const res = springPath(
    activeAnchorDrag.startX,
    activeAnchorDrag.startY,
    endX,
    endY,
    false
   );
   dragWireD = res.path;
   dragArrowD = res.arrowD;
  } else {
   const oppSide = activeAnchorDrag.sourceSide === 'top' ? 'bottom' : activeAnchorDrag.sourceSide === 'bottom' ? 'top' : activeAnchorDrag.sourceSide === 'left' ? 'right' : 'left';
   const res = bezierWirePath(
    activeAnchorDrag.startX,
    activeAnchorDrag.startY,
    endX,
    endY,
    activeAnchorDrag.sourceSide,
    oppSide
   );
   dragWireD = res.path;
   dragArrowD = res.arrowD;
  }

  const currentMargin = calculateCurrentMargin(
   activeAnchorDrag.sourceSide,
   activeAnchorDrag.targetId,
   activeAnchorDrag.targetEdge,
   item,
   doc
  );

  const badgeText = isSnapped ? `${activeAnchorDrag.targetName} • ${currentMargin}mm` : `Anchor (${activeAnchorDrag.sourceSide})`;

  visuals.push(
   <g key="active-anchor-drag-wire" data-editor-only="true" pointerEvents="none">
    <path
     d={dragWireD}
     stroke="#2196F3"
     strokeWidth={1.8}
     strokeDasharray={isSnapped ? '3 1.5' : '2 2'}
     fill="none"
     vectorEffect="non-scaling-stroke"
    />
    {dragArrowD && (
     <path
      d={dragArrowD}
      stroke="#2196F3"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
     />
    )}

    {/* Target snap dot following cursor or snapped position */}
    <circle
     cx={endX}
     cy={endY}
     r={isSnapped ? hr * 1.5 : hr * 1.15}
     fill="#2196F3"
     stroke="#fff"
     strokeWidth={1.5}
     vectorEffect="non-scaling-stroke"
    />

    {/* Floating HUD badge */}
    <g transform={`translate(${endX}, ${endY - 8 / pixelScale})`}>
     <rect
      x={-44 / pixelScale}
      y={-15 / pixelScale}
      width={88 / pixelScale}
      height={15 / pixelScale}
      rx={3 / pixelScale}
      fill="#1e293b"
      fillOpacity="0.95"
      stroke="#38bdf8"
      strokeWidth={1.0}
      vectorEffect="non-scaling-stroke"
     />
     <text
      x={0}
      y={-4.5 / pixelScale}
      textAnchor="middle"
      fontSize={7.5 / pixelScale}
      fill="#ffffff"
      fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      fontWeight="500"
     >
      {badgeText}
     </text>
    </g>
   </g>
  );
 }

 return <>{visuals}</>;
}


export function LabelSvg({doc,selectedId,guidelines=[],activeAnchorDrag,onAnchorStart,onPointerDown,onResizeStart,onObjectDoubleClick,onTextChange,grid=false,gridStep=1,fonts=''}:{doc:LabelDocument;fonts?:string;selectedId?:string|null;guidelines?:AlignmentGuideline[];activeAnchorDrag?:import('./useCanvasInteraction').ActiveAnchorDrag|null;onAnchorStart?:(e:React.PointerEvent<SVGElement>,side:import('./anchors').AnchorSide)=>void;grid?:boolean;gridStep?:number;onPointerDown?:PointerEventHandler<SVGGElement>;onResizeStart?:PointerEventHandler<SVGElement>;onObjectDoubleClick?:(id:string)=>void;onTextChange?:(id:string,content:string)=>boolean}){
 const [editing,setEditing]=useState<string|null>(null);useEffect(()=>{setEditing(null);},[doc.id,selectedId]);const edited=doc.objects.find(o=>o.id===editing&&o.kind==='text'&&!o.locked);
 const svgRef=useRef<SVGSVGElement>(null);const [pixelScale,setPixelScale]=useState(5);useEffect(()=>{if(!svgRef.current)return;const observer=new ResizeObserver(([entry])=>setPixelScale(Math.max(.1,entry.contentRect.width/doc.width)));observer.observe(svgRef.current);return()=>observer.disconnect();},[doc.width]);const handleSize=8/pixelScale;
 const gridId=useId().replaceAll(':','')+'-grid';
 const selectedObj = doc.objects.find(o => o.id === selectedId);
 return <svg ref={svgRef} id="label-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${doc.width} ${doc.height}`} aria-label="Label canvas" style={{width:'100%',height:'100%',overflow:onPointerDown?'visible':undefined}}><defs><style>{fonts}</style>{grid&&<pattern data-editor-only="true" id={gridId} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse"><path d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`} fill="none" stroke="#a8c1c7" strokeWidth=".035"/></pattern>}</defs><rect width={doc.width} height={doc.height} fill="white"/>{grid&&<rect data-editor-only="true" width={doc.width} height={doc.height} fill={`url(#${gridId})`} pointerEvents="none"/>}{doc.objects.map((o,index)=><g key={o.id} data-id={o.id} onPointerDown={onPointerDown} onDoubleClick={e=>{e.stopPropagation();onObjectDoubleClick?.(o.id);if(o.kind==='text'&&!o.locked&&onTextChange)setEditing(o.id);}}>{vectorObject(o)}{onPointerDown&&o.kind==='barcode'&&exceedsLabel(o,doc)&&<g data-editor-only="true" pointerEvents="none" aria-label="Barcode outside label"><defs><mask id={`${gridId}-${index}-overflow`} maskUnits="userSpaceOnUse" x={o.x} y={o.y} width={o.width} height={o.height}><rect x={o.x} y={o.y} width={o.width} height={o.height} fill="white"/><rect width={doc.width} height={doc.height} fill="black"/></mask></defs><g mask={`url(#${gridId}-${index}-overflow)`}><rect x={o.x} y={o.y} width={o.width} height={o.height} fill="#fff0f0"/><image x={o.x} y={o.y} width={o.width} height={o.height} href={'data:image/svg+xml;base64,'+btoa(barcodeOverflowSvg(o))} preserveAspectRatio="xMidYMid meet"/><rect x={o.x} y={o.y} width={o.width} height={o.height} fill="none" stroke="#dc2626" strokeWidth=".15"/></g></g>}{onPointerDown&&o.kind==='line'&&<line data-editor-only="true" x1={linePoints(o).startX} y1={linePoints(o).startY} x2={linePoints(o).endX} y2={linePoints(o).endY} stroke="transparent" strokeWidth="2"/>}{onPointerDown&&<rect data-editor-only="true" x={o.x} y={o.y} width={o.width} height={o.height} fill={o.kind==='line'||o.kind==='box'?'none':'transparent'} pointerEvents={o.kind==='line'?'none':o.kind==='box'?'stroke':'all'} stroke={selectedId===o.id?'#3284ff':o.kind==='box'?'transparent':'none'} strokeWidth="1" vectorEffect="non-scaling-stroke"/>}{onResizeStart&&selectedId===o.id&&editing!==o.id&&!o.locked&&(o.kind==='line'?(<rect data-editor-only="true" data-id={o.id} data-handle="se" aria-label="Resize line se" className="canvas-resize-handle canvas-line-resize" style={{cursor:'nwse-resize'}} x={linePoints(o).endX-handleSize/2} y={linePoints(o).endY-handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#3284ff" strokeWidth="1" vectorEffect="non-scaling-stroke" onPointerDown={onResizeStart}/>):(<g data-editor-only="true"><line data-editor-only="true" data-id={o.id} data-handle="n" aria-label={`Resize ${o.kind} top edge`} className="canvas-edge-resize" x1={o.x} y1={o.y} x2={o.x+o.width} y2={o.y} stroke="transparent" strokeWidth={Math.max(1.5,6/pixelScale)} style={{cursor:'ns-resize'}} onPointerDown={onResizeStart}/><line data-editor-only="true" data-id={o.id} data-handle="s" aria-label={`Resize ${o.kind} bottom edge`} className="canvas-edge-resize" x1={o.x} y1={o.y+o.height} x2={o.x+o.width} y2={o.y+o.height} stroke="transparent" strokeWidth={Math.max(1.5,6/pixelScale)} style={{cursor:'ns-resize'}} onPointerDown={onResizeStart}/><line data-editor-only="true" data-id={o.id} data-handle="w" aria-label={`Resize ${o.kind} left edge`} className="canvas-edge-resize-ew" x1={o.x} y1={o.y} x2={o.x} y2={o.y+o.height} stroke="transparent" strokeWidth={Math.max(1.5,6/pixelScale)} style={{cursor:'ew-resize'}} onPointerDown={onResizeStart}/><line data-editor-only="true" data-id={o.id} data-handle="e" aria-label={`Resize ${o.kind} right edge`} className="canvas-edge-resize-ew" x1={o.x+o.width} y1={o.y} x2={o.x+o.width} y2={o.y+o.height} stroke="transparent" strokeWidth={Math.max(1.5,6/pixelScale)} style={{cursor:'ew-resize'}} onPointerDown={onResizeStart}/>{(['nw','ne','se','sw'] as const).map(handle=><rect key={handle} data-editor-only="true" data-id={o.id} data-handle={handle} aria-label={`Resize ${o.kind} ${handle}`} className="canvas-resize-handle" style={{cursor:handle==='nw'||handle==='se'?'nwse-resize':'nesw-resize'}} x={(handle.includes('w')?o.x:o.x+o.width)-handleSize/2} y={(handle.includes('n')?o.y:o.y+o.height)-handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#3284ff" strokeWidth="1" vectorEffect="non-scaling-stroke" onPointerDown={onResizeStart}/>)}</g>))}</g>)}{selectedObj && <AnchorVisuals item={selectedObj} doc={doc} pixelScale={pixelScale} activeAnchorDrag={activeAnchorDrag} onAnchorPointerDown={onAnchorStart}/>}{guidelines.map((g,i)=><line key={`guideline-${g.orientation}-${i}-${g.position}`} data-editor-only="true" className="canvas-guideline" pointerEvents="none" x1={g.orientation==='horizontal'?0:g.position} y1={g.orientation==='horizontal'?g.position:0} x2={g.orientation==='horizontal'?doc.width:g.position} y2={g.orientation==='horizontal'?g.position:doc.height} stroke="#8b5cf6" strokeWidth="1" vectorEffect="non-scaling-stroke"/>)}{edited&&onTextChange&&<InlineText key={edited.id} item={edited} maxWidth={doc.width-edited.x} pixelScale={pixelScale} onChange={value=>onTextChange(edited.id,value)} onEnd={()=>setEditing(null)}/>}</svg>;
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
