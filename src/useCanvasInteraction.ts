import {resizeObject,type ResizeHandle} from './resizeObject';
import {dragLineEnd} from './lineGeometry';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type {Command,LabelDocument,LabelObject} from './core';
import {snapCoordinate} from './canvasGeometry';
import {computeAlignment,getActiveGuidelines,type AlignmentGuideline} from './guidelines';
import {updateAnchorsOnMove,getAnchorPoint,findCandidateAnchorTarget,calculateCurrentMargin,type AnchorSide,type CandidateTarget} from './anchors';

export interface ActiveAnchorDrag {
  sourceId: string;
  sourceSide: AnchorSide;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetId: string | 'parent';
  targetEdge: AnchorSide;
  targetName?: string;
  snapX: number;
  snapY: number;
}

type Drag={item:LabelObject;mode:'move'|'resize';handle:ResizeHandle;x:number;y:number;rect:DOMRect;pointerId:number;documentId:string};
type AnchorDrag={item:LabelObject;side:AnchorSide;startX:number;startY:number;pointerStartX:number;pointerStartY:number;moved:boolean;target:CandidateTarget|null;rect:DOMRect;pointerId:number;documentId:string};

export function useCanvasInteraction(doc:LabelDocument|null,select:(id:string)=>void,commit:(commands:Command[],revision?:number)=>boolean,enabled:boolean,snap:boolean,step:number){
 const drag=useRef<Drag|null>(null);
 const anchorDrag=useRef<AnchorDrag|null>(null);
 const previewRef=useRef<LabelDocument|null>(null);
 const [preview,setPreview]=useState<LabelDocument|null>(null);
 const [guidelines,setGuidelines]=useState<AlignmentGuideline[]>([]);
 const [activeAnchorDrag,setActiveAnchorDrag]=useState<ActiveAnchorDrag|null>(null);

 useEffect(()=>{
  drag.current=null;
  anchorDrag.current=null;
  previewRef.current=null;
  setPreview(null);
  setGuidelines([]);
  setActiveAnchorDrag(null);
 },[doc?.id,enabled]);

 function start(event:PointerEvent<SVGElement>,mode:'move'|'resize'){
  const id=event.currentTarget.dataset.id??event.currentTarget.parentElement?.dataset.id;if(!doc||!id)return;select(id);const item=doc.objects.find(o=>o.id===id);if(!enabled||!item||item.locked)return;
  const svg=event.currentTarget.ownerSVGElement;if(!svg)return;drag.current={item:structuredClone(item),mode,handle:(event.currentTarget.dataset.handle??'se') as ResizeHandle,x:event.clientX,y:event.clientY,rect:svg.getBoundingClientRect(),pointerId:event.pointerId,documentId:doc.id};event.currentTarget.setPointerCapture(event.pointerId);event.stopPropagation();
 }

 function startAnchor(event:PointerEvent<SVGElement>,side:AnchorSide){
  const id=event.currentTarget.dataset.id;if(!doc||!id)return;const item=doc.objects.find(o=>o.id===id);if(!enabled||!item||item.locked)return;
  const svg=event.currentTarget.ownerSVGElement;if(!svg)return;
  const pt=getAnchorPoint(item,side);
  anchorDrag.current={
   item:structuredClone(item),
   side,
   startX:pt.x,
   startY:pt.y,
   pointerStartX:event.clientX,
   pointerStartY:event.clientY,
   moved:false,
   target:null,
   rect:svg.getBoundingClientRect(),
   pointerId:event.pointerId,
   documentId:doc.id
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  event.stopPropagation();
 }

 function move(event:PointerEvent){
  if(anchorDrag.current&&event.pointerId===anchorDrag.current.pointerId&&doc&&anchorDrag.current.documentId===doc.id){
   const current=anchorDrag.current;
   if(!current.moved&&Math.hypot(event.clientX-current.pointerStartX,event.clientY-current.pointerStartY)>2.5){
    current.moved=true;
   }
   const docX=(event.clientX-current.rect.left)*doc.width/current.rect.width;
   const docY=(event.clientY-current.rect.top)*doc.height/current.rect.height;
   const candidate=findCandidateAnchorTarget(current.side,docX,docY,current.item,doc);
   current.target=candidate;
   setActiveAnchorDrag({
    sourceId:current.item.id,
    sourceSide:current.side,
    startX:current.startX,
    startY:current.startY,
    currentX:docX,
    currentY:docY,
    targetId:candidate.targetId,
    targetEdge:candidate.targetEdge,
    targetName:candidate.targetName,
    snapX:candidate.snapX,
    snapY:candidate.snapY
   });
   return;
  }

  const current=drag.current;if(!doc||!current||event.pointerId!==current.pointerId||current.documentId!==doc.id)return;
  const next=structuredClone(doc);const item=next.objects.find(o=>o.id===current.item.id)!;const dx=(event.clientX-current.x)*doc.width/current.rect.width;const dy=(event.clientY-current.y)*doc.height/current.rect.height;
  if(current.mode==='move'){
   const otherObjects=doc.objects.filter(o=>o.id!==current.item.id);
   const threshold=current.rect.width>0?Math.max(0.4,6*doc.width/current.rect.width):0.6;
   const rawX=current.item.x+dx;const rawY=current.item.y+dy;
   const align=computeAlignment(current.item,otherObjects,rawX,rawY,threshold);
   let targetX=align.guidelines.some(g=>g.orientation==='vertical')?align.snappedX:snapCoordinate(rawX,step,snap);
   let targetY=align.guidelines.some(g=>g.orientation==='horizontal')?align.snappedY:snapCoordinate(rawY,step,snap);
   if(item.kind!=='barcode'){targetX=Math.max(0,Math.min(doc.width-item.width,targetX));targetY=Math.max(0,Math.min(doc.height-item.height,targetY));}
   item.x=targetX;item.y=targetY;
   setGuidelines(getActiveGuidelines(item,otherObjects));
  }
  else {
   setGuidelines([]);
   if(item.kind==='line'){Object.assign(item,dragLineEnd(current.item,dx,dy,doc.width,doc.height,step,snap));}
   else Object.assign(item,resizeObject(current.item,current.handle,dx,dy,doc,snap,step));
  }

  previewRef.current=next;setPreview(next);
 }

 function finish(){
  if(anchorDrag.current&&doc&&anchorDrag.current.documentId===doc.id){
   const current=anchorDrag.current;
   if(!current.moved){
    if(current.item.anchors?.[current.side]){
     const updated={...(current.item.anchors??{})};
     delete updated[current.side];
     const clean=Object.keys(updated).length>0?updated:undefined;
     commit([{op:'update',id:current.item.id,changes:{anchors:clean}}],doc.revision);
    } else {
     const margin=calculateCurrentMargin(current.side,'parent',current.side,current.item,doc);
     const updated={
      ...(current.item.anchors??{}),
      [current.side]:{target:'parent',targetEdge:current.side,margin}
     };
     commit([{op:'update',id:current.item.id,changes:{anchors:updated}}],doc.revision);
    }
   } else if(current.moved&&current.target){
    const margin=calculateCurrentMargin(current.side,current.target.targetId,current.target.targetEdge,current.item,doc);
    const updated={
     ...(current.item.anchors??{}),
     [current.side]:{target:current.target.targetId,targetEdge:current.target.targetEdge,margin}
    };
    commit([{op:'update',id:current.item.id,changes:{anchors:updated}}],doc.revision);
   }
   anchorDrag.current=null;
   setActiveAnchorDrag(null);
   return;
  }

  const current=drag.current;const next=previewRef.current;if(doc&&current&&next&&current.documentId===doc.id){const item=next.objects.find(o=>o.id===current.item.id)!;const updatedAnchors=current.mode==='move'?updateAnchorsOnMove(current.item,item.x,item.y,doc):undefined;const changes=current.mode==='move'?{x:item.x,y:item.y,...(updatedAnchors?{anchors:updatedAnchors}:{})}:{x:item.x,y:item.y,width:item.width,height:item.height,...(item.line?{line:item.line}:{}),...(item.kind==='barcode'?{barcodeScale:item.barcodeScale,barHeightScale:item.barHeightScale}:{}),...(item.kind==='text'?{fontSize:item.fontSize}:{})};if(Object.entries(changes).some(([key,value])=>current.item[key as keyof LabelObject]!==value))commit([{op:'update',id:item.id,changes}],doc.revision);}drag.current=null;previewRef.current=null;setPreview(null);setGuidelines([]);
 }

 function cancel(){
  drag.current=null;
  anchorDrag.current=null;
  previewRef.current=null;
  setPreview(null);
  setGuidelines([]);
  setActiveAnchorDrag(null);
 }

 return {
  preview,
  guidelines,
  activeAnchorDrag,
  onPointerDown:(e:PointerEvent<SVGGElement>)=>start(e,'move'),
  onResizeStart:(e:PointerEvent<SVGRectElement>)=>start(e,'resize'),
  onAnchorStart:(e:PointerEvent<SVGElement>,side:AnchorSide)=>startAnchor(e,side),
  onPointerMove:move,
  onPointerUp:finish,
  onPointerCancel:cancel
 };
}

