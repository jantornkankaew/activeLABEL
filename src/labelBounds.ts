import type {LabelDocument,LabelObject} from './core';
export function exceedsLabel(item:LabelObject,doc:Pick<LabelDocument,'width'|'height'>){return item.x<-.001||item.y<-.001||item.x+item.width>doc.width+.001||item.y+item.height>doc.height+.001;}
export function validatePrintBounds(doc:LabelDocument){const item=doc.objects.find(o=>exceedsLabel(o,doc));if(item)throw Error(`${item.name}: บาร์โค้ดล้นฉลาก กรุณาย่อหรือย้ายกลับเข้าฉลากก่อนพิมพ์`);}
export function barcodeOverflowMargins(doc:LabelDocument){let left=0,top=0,right=0,bottom=0;for(const o of doc.objects.filter(o=>o.kind==='barcode')){left=Math.max(left,-o.x);top=Math.max(top,-o.y);right=Math.max(right,o.x+o.width-doc.width);bottom=Math.max(bottom,o.y+o.height-doc.height);}return {left,top,right,bottom};}
