import {validatePrintBounds} from './labelBounds';
import {migrateDocument,validate,type LabelDocument} from './core';
export const standaloneURL='https://jantornkankaew.github.io/labelcraft/';
export function printHandoffURL(doc:LabelDocument){validate(doc);const json=JSON.stringify(doc);if(json.length>200_000)throw Error('ฉลากใหญ่เกินกว่าจะเปิดหน้าพิมพ์ ดาวน์โหลด JSON แล้วเปิดในเว็บแทน');return standaloneURL+'#print='+encodeURIComponent(json);}
export function readPrintHandoff():LabelDocument|null {if(typeof window==='undefined'||!window.location.hash.startsWith('#print='))return null;try{const json=decodeURIComponent(window.location.hash.slice(7));if(json.length>200_000)throw Error('Too large');return migrateDocument(JSON.parse(json));}catch{return null;}}
export function printWindowCSS(doc:LabelDocument){validate(doc);validatePrintBounds(doc);return `@page{size:${doc.width}mm ${doc.height}mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#edf2f4;font:14px Arial,sans-serif}.print-instructions{padding:20px;max-width:720px;margin:auto;line-height:1.8}.print-sheet{width:${doc.width}mm;height:${doc.height}mm;margin:20px auto;background:white;break-after:page;overflow:hidden}.print-sheet:last-child{break-after:auto}.print-sheet svg{display:block;width:${doc.width}mm!important;height:${doc.height}mm!important}@media print{body{background:white}.print-instructions{display:none}.print-sheet{margin:0;break-inside:avoid}}`;}
export async function openSystemPrint(doc:LabelDocument,svg:string,copies:number):Promise<void>{
 validate(doc);validatePrintBounds(doc);if(!Number.isInteger(copies)||copies<1||copies>100)throw Error('Copies must be 1–100');
 const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');if(parsed.querySelector('parsererror')||parsed.documentElement.localName!=='svg')throw Error('Print SVG is invalid');
 // A same-origin print frame uses Chrome's native dialog without a popup or helper.
 const previousFocus=document.activeElement as HTMLElement|null;
 document.querySelectorAll('iframe[data-labelcraft-print]').forEach(frame=>frame.remove());
 const frame=document.createElement('iframe');frame.dataset.labelcraftPrint='';frame.title='LabelCraft print document';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;pointer-events:none;opacity:0';document.body.append(frame);
 const printWindow=frame.contentWindow;const printDoc=frame.contentDocument;
 if(!printWindow||!printDoc){frame.remove();throw Error('เตรียมหน้าพิมพ์ไม่ได้ กรุณาลองอีกครั้ง');}
 printDoc.title=doc.title+' — LabelCraft Print';printDoc.documentElement.lang='th';const style=printDoc.createElement('style');style.textContent=printWindowCSS(doc);printDoc.head.append(style);
 for(let i=0;i<copies;i++){const sheet=printDoc.createElement('div');sheet.className='print-sheet';sheet.append(printDoc.importNode(parsed.documentElement,true));printDoc.body.append(sheet);}
 void printDoc.body.offsetHeight; // Flush layout so the active embedded font loads have started.
 let watch:number|undefined;let deadline:number|undefined;
 const cancelled=new Promise<never>((_,reject)=>{watch=window.setInterval(()=>{if(!frame.isConnected)reject(Error('หน้าพิมพ์ถูกปิด ยังไม่ได้สั่งพิมพ์'));},100);deadline=window.setTimeout(()=>reject(Error('เตรียมหน้าพิมพ์ไม่สำเร็จภายใน 15 วินาที กรุณาปิดหน้าพิมพ์และลองใหม่')),15000);});
 try{await Promise.race([(async()=>{await printDoc.fonts.ready;if(!frame.isConnected)throw Error('หน้าพิมพ์ถูกปิด');await new Promise<void>(resolve=>printWindow.requestAnimationFrame(()=>printWindow.requestAnimationFrame(()=>resolve())));})(),cancelled]);}catch(error){frame.remove();throw error;}finally{window.clearInterval(watch);window.clearTimeout(deadline);}
 if(!frame.isConnected)throw Error('หน้าพิมพ์ถูกปิด');
 printWindow.addEventListener('afterprint',()=>{window.setTimeout(()=>{frame.remove();window.focus();if(previousFocus?.isConnected)previousFocus.focus();},0);},{once:true});
 try{printWindow.focus();printWindow.print();}catch(error){frame.remove();throw error;}
}
export function localBridgeURL(value:string,pageProtocol:string){const url=new URL(value);if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=='/'||!['http:','https:'].includes(url.protocol))throw Error('ใช้ URL ของ print bridge ในเครื่องนี้ เช่น https://localhost:28171');return url.origin;}
