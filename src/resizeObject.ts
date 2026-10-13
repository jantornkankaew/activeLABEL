import {barcodeMagnification,barcodeProfile,barcodeScaleLimits} from './barcodes';
import {sizeText,type LabelDocument,type LabelObject} from './core';
import {snapCoordinate} from './canvasGeometry';
export type ResizeHandle='nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w';
export const resizeHandles:ResizeHandle[]=['nw','n','ne','e','se','s','sw','w'];
export function resizeObject(original:LabelObject,handle:ResizeHandle,dx:number,dy:number,doc:LabelDocument,snap=false,step=1):LabelObject{
 const o={...original};const sx=handle.includes('w')?-1:handle.includes('e')?1:0,sy=handle.includes('n')?-1:handle.includes('s')?1:0;
 const anchorX=o.x+o.width*(sx<0?1:sx>0?0:.5),anchorY=o.y+o.height*(sy<0?1:sy>0?0:.5);
 let width=Math.max(.1,o.width+sx*dx),height=Math.max(.1,o.height+sy*dy);
 if(o.kind==='box'){
  if(sx)width=Math.max(.1,Math.abs(snapCoordinate(anchorX+sx*width,step,snap)-anchorX));
  if(sy)height=Math.max(.1,Math.abs(snapCoordinate(anchorY+sy*height,step,snap)-anchorY));
  if(sx)width=Math.min(width,sx<0?anchorX:doc.width-anchorX);if(sy)height=Math.min(height,sy<0?anchorY:doc.height-anchorY);
 }else{
  let factor=sx&&sy?(o.width*width+o.height*height)/(o.width**2+o.height**2):sx?width/o.width:height/o.height;
  if(o.kind==='barcode'){const limits=barcodeScaleLimits(o.symbology);o.barcodeScale=Math.max(limits.min,Math.min(limits.max,Math.round(barcodeMagnification(o)*factor)));const p=barcodeProfile(o.symbology,o.content);width=p.width*o.barcodeScale/100;height=p.height*o.barcodeScale/100;}
  else{const maxX=sx<0?anchorX:sx>0?doc.width-anchorX:2*Math.min(anchorX,doc.width-anchorX);const maxY=sy<0?anchorY:sy>0?doc.height-anchorY:2*Math.min(anchorY,doc.height-anchorY);factor=Math.min(factor,maxX/o.width,maxY/o.height);if(o.kind==='text'){o.fontSize=Math.max(.5,Math.min(30,o.fontSize*factor));const measured=sizeText(o);width=measured.width;height=measured.height;}else{width=o.width*factor;height=o.height*factor;}}
 }
 o.width=width;o.height=height;o.x=anchorX-width*(sx<0?1:sx>0?0:.5);o.y=anchorY-height*(sy<0?1:sy>0?0:.5);return o;
}
