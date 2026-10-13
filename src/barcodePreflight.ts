import {exceedsLabel} from './labelBounds';
import {linePoints} from './lineGeometry';
import type {LabelDocument,LabelObject} from './core';
import {barcodeMagnification,barcodeProfile,barcodeScaleLimits,retailBarcode} from './barcodes';
type Zone={x:number;y:number;width:number;height:number};
function segmentInZone(zone:Zone,x1:number,y1:number,x2:number,y2:number){let low=0,high=1;for(const [start,end,min,max] of [[x1,x2,zone.x-.1,zone.x+zone.width+.1],[y1,y2,zone.y-.1,zone.y+zone.height+.1]]){const delta=end-start;if(Math.abs(delta)<1e-10){if(start<min||start>max)return false;}else{const a=(min-start)/delta,b=(max-start)/delta;low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));if(low>high)return false;}}return true;}
function inkInZone(other:LabelObject,zone:Zone){if(other.kind==='line'){const p=linePoints(other);return segmentInZone(zone,p.startX,p.startY,p.endX,p.endY);}if(other.kind==='box'){const {x,y,width:w,height:h}=other;return [[x,y,x+w,y],[x+w,y,x+w,y+h],[x+w,y+h,x,y+h],[x,y+h,x,y]].some(([a,b,c,d])=>segmentInZone(zone,a,b,c,d));}return other.x<zone.x+zone.width-1e-7&&other.x+other.width>zone.x+1e-7&&other.y<zone.y+zone.height-1e-7&&other.y+other.height>zone.y+1e-7;}
export function barcodePreflight(doc:LabelDocument,dpi:number){
 if(![203,300,600].includes(dpi))throw Error('Unsupported printer DPI');const errors:string[]=[],warnings:string[]=[];
 for(const item of doc.objects.filter(o=>o.kind==='barcode')){const p=barcodeProfile(item.symbology,item.content);const scale=barcodeMagnification(item);const limits=barcodeScaleLimits(item.symbology);const x=p.moduleMm*scale/100;const dots=x*dpi/25.4;
 if(exceedsLabel(item,doc))errors.push(`${item.name}: บาร์โค้ดล้นฉลาก กรุณาย่อหรือย้ายกลับเข้าฉลากก่อนพิมพ์`);
 if(retailBarcode(item.symbology)&&(scale<limits.min-1e-7||scale>limits.max+1e-7))errors.push(`${item.name}: EAN/UPC retail ต้องมี magnification ${limits.min}–${limits.max}% (ปัจจุบัน ${scale.toFixed(2)}%)`);
 if(dots<1-1e-7)errors.push(`${item.name}: โมดูลแคบกว่า 1 dot ที่ ${dpi} DPI กรุณาเพิ่ม ratio`);
 else if(Math.abs(dots-Math.round(dots))>.001)warnings.push(`${item.name}: X = ${dots.toFixed(3)} dots/module ที่ ${dpi} DPI ใช้ “ปรับ ratio ให้เหมาะกับ DPI” เพื่อลดความคลาดเคลื่อนจากการ rasterize`);
 if(['code39','code93'].includes(item.symbology)){const minimum=item.symbology==='code39'?Math.max(5,.15*(item.width-(p.quiet.left+p.quiet.right)*x)):Math.max(5.08,.15*item.width);const actual=p.barHeightMm*scale/100;if(actual<minimum-.01)warnings.push(`${item.name}: ความสูงแท่ง ${actual.toFixed(3)} mm ต่ำกว่าคำแนะนำ ${minimum.toFixed(3)} mm ของ ${item.symbology}; เพิ่ม ratio และตรวจข้อกำหนดงานที่ใช้`);}
 const q=[{x:item.x,y:item.y,width:p.quiet.left*x,height:item.height},{x:item.x+item.width-p.quiet.right*x,y:item.y,width:p.quiet.right*x,height:item.height},...(p.quiet.top?[{x:item.x,y:item.y,width:item.width,height:p.quiet.top*x},{x:item.x,y:item.y+item.height-p.quiet.bottom*x,width:item.width,height:p.quiet.bottom*x}]:[])];
 // The barcode SVG paints an opaque white background, hiding earlier layers.
 const above=doc.objects.slice(doc.objects.indexOf(item)+1);
 const enclosing=(other:LabelObject)=>other.kind==='box'&&other.x<=item.x+1e-7&&other.y<=item.y+1e-7&&other.x+other.width>=item.x+item.width-1e-7&&other.y+other.height>=item.y+item.height-1e-7;
 if(above.some(other=>enclosing(other)&&q.some(zone=>inkInZone(other,zone))))warnings.push(`${item.name}: กรอบชิดขอบบาร์โค้ด ควรเว้นระยะเพิ่มเพื่อให้สแกนง่าย`);
 if(above.some(other=>!enclosing(other)&&inkInZone(other,item)))errors.push(`${item.name}: มีวัตถุอื่นทับพื้นที่ว่างรอบบาร์โค้ดหรือตัวรหัส กรุณาย้ายวัตถุก่อนพิมพ์`);
 }
 return {errors,warnings};
}
