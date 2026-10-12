import type {LabelObject} from './core';
import {snapCoordinate} from './canvasGeometry';
export type LinePoints={startX:number;startY:number;endX:number;endY:number};
export function linePoints(item:LabelObject){const p=item.line??{startX:0,startY:0,endX:item.width,endY:0};return {startX:item.x+p.startX,startY:item.y+p.startY,endX:item.x+p.endX,endY:item.y+p.endY};}
export function dragLineEnd(item:LabelObject,dx:number,dy:number,width:number,height:number,step:number,snap:boolean){
 const p=linePoints(item);const endX=Math.max(0,Math.min(width,snapCoordinate(p.endX+dx,step,snap)));const endY=Math.max(0,Math.min(height,snapCoordinate(p.endY+dy,step,snap)));
 if(Math.hypot(endX-p.startX,endY-p.startY)<.1)return {x:item.x,y:item.y,width:item.width,height:item.height,...(item.line?{line:item.line}:{})};
 const w=Math.max(.1,Math.abs(endX-p.startX)),h=Math.max(.1,Math.abs(endY-p.startY));const x=Math.min(Math.min(endX,p.startX),width-w),y=Math.min(Math.min(endY,p.startY),height-h);
 return {x,y,width:w,height:h,line:{startX:p.startX-x,startY:p.startY-y,endX:endX-x,endY:endY-y}};
}
