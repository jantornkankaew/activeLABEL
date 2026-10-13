import {resizeObject,type ResizeHandle} from './resizeObject';
import {barcodeProfile,barcodeMagnification,barcodeScaleLimits} from './barcodes';
import {dragLineEnd} from './lineGeometry';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type {Command,LabelDocument,LabelObject} from './core';
import {proportionalScale,snapCoordinate,resizeExtent,integerPercent} from './canvasGeometry';
type Drag={item:LabelObject;mode:'move'|'resize';handle:ResizeHandle;x:number;y:number;rect:DOMRect;pointerId:number;documentId:string};
export function useCanvasInteraction(doc:LabelDocument|null,select:(id:string)=>void,commit:(commands:Command[],revision?:number)=>boolean,enabled:boolean,snap:boolean,step:number){
 const drag=useRef<Drag|null>(null);const previewRef=useRef<LabelDocument|null>(null);const [preview,setPreview]=useState<LabelDocument|null>(null);
 useEffect(()=>{drag.current=null;previewRef.current=null;setPreview(null);},[doc?.id,enabled]);
 function start(event:PointerEvent<SVGElement>,mode:'move'|'resize'){
  const id=event.currentTarget.dataset.id??event.currentTarget.parentElement?.dataset.id;if(!doc||!id)return;select(id);const item=doc.objects.find(o=>o.id===id);if(!enabled||!item||item.locked)return;
  const svg=event.currentTarget.ownerSVGElement;if(!svg)return;drag.current={item:structuredClone(item),mode,handle:(event.currentTarget.dataset.handle??'se') as ResizeHandle,x:event.clientX,y:event.clientY,rect:svg.getBoundingClientRect(),pointerId:event.pointerId,documentId:doc.id};event.currentTarget.setPointerCapture(event.pointerId);event.stopPropagation();
 }
 function move(event:PointerEvent){const current=drag.current;if(!doc||!current||event.pointerId!==current.pointerId||current.documentId!==doc.id)return;
  const next=structuredClone(doc);const item=next.objects.find(o=>o.id===current.item.id)!;const dx=(event.clientX-current.x)*doc.width/current.rect.width;const dy=(event.clientY-current.y)*doc.height/current.rect.height;
  if(current.mode==='move'){item.x=snapCoordinate(current.item.x+dx,step,snap);item.y=snapCoordinate(current.item.y+dy,step,snap);if(item.kind!=='barcode'){item.x=Math.max(0,Math.min(doc.width-item.width,item.x));item.y=Math.max(0,Math.min(doc.height-item.height,item.y));}}
  else if(item.kind==='line'){Object.assign(item,dragLineEnd(current.item,dx,dy,doc.width,doc.height,step,snap));}
  else Object.assign(item,resizeObject(current.item,current.handle,dx,dy,doc,snap,step));

  previewRef.current=next;setPreview(next);
 }
 function finish(){const current=drag.current;const next=previewRef.current;if(doc&&current&&next&&current.documentId===doc.id){const item=next.objects.find(o=>o.id===current.item.id)!;const changes=current.mode==='move'?{x:item.x,y:item.y}:{x:item.x,y:item.y,width:item.width,height:item.height,...(item.line?{line:item.line}:{}),...(item.kind==='barcode'?{barcodeScale:item.barcodeScale}:{}),...(item.kind==='text'?{fontSize:item.fontSize}:{})};if(Object.entries(changes).some(([key,value])=>current.item[key as keyof LabelObject]!==value))commit([{op:'update',id:item.id,changes}],doc.revision);}drag.current=null;previewRef.current=null;setPreview(null);}
 function cancel(){drag.current=null;previewRef.current=null;setPreview(null);}
 return {preview,onPointerDown:(e:PointerEvent<SVGGElement>)=>start(e,'move'),onResizeStart:(e:PointerEvent<SVGRectElement>)=>start(e,'resize'),onPointerMove:move,onPointerUp:finish,onPointerCancel:cancel};
}
