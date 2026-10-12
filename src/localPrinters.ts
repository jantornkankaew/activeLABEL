import type * as QZ from 'qz-tray';
import {validate,type LabelDocument} from './core';
import {validatePrintBounds} from './labelBounds';
import {barcodePreflight} from './barcodePreflight';
import {rasterize} from './renderer';
export type PrinterClient={websocket:Pick<QZ.WebSocket,'connect'|'disconnect'|'isActive'|'setClosedCallbacks'>;printers:Pick<QZ.Printers,'find'>;configs:Pick<QZ.Configs,'create'>;print:typeof QZ.print};
export const qzDownloadURL='https://github.com/qzind/tray/releases/tag/v2.3.0';
export function printerNames(value:unknown):string[]{
 if(!Array.isArray(value)||value.length>500||value.some(name=>typeof name!=='string'||!name.trim()||name.length>512||/[\x00-\x1f\x7f]/.test(name)))throw Error('QZ Tray ส่งรายชื่อเครื่องพิมพ์ไม่ถูกต้อง');
 return [...new Set(value as string[])];
}
async function deadline<T>(work:Promise<T>,ms:number,message:string,onTimeout?:()=>void){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{onTimeout?.();reject(Error(message));},ms);})]);}finally{clearTimeout(timer);}}
export class LocalPrinterSession{
 private printing=false;names:string[]=[];onDisconnected?:()=>void;
 constructor(private client:PrinterClient,private render= rasterize){client.websocket.setClosedCallbacks(()=>{this.names=[];this.onDisconnected?.();});}
 get active(){return this.client.websocket.isActive();}
 async discover(){this.names=[];try{
 if(!this.active)await deadline(this.client.websocket.connect({host:['localhost'],usingSecure:true,port:{secure:[8181,8282,8383,8484],insecure:[]},retries:0}),15000,'เชื่อม QZ Tray ไม่สำเร็จ กรุณาติดตั้งและเปิด QZ Tray',()=>{void this.client.websocket.disconnect().catch(()=>{});});
 const found=await deadline(this.client.printers.find(),60000,'ยังไม่ได้รับอนุญาตจาก QZ Tray กรุณาตรวจหน้าต่าง Allow',()=>{void this.client.websocket.disconnect().catch(()=>{});});
 this.names=printerNames(found);return this.names;
 }catch(error){this.names=[];throw error;}}
 async print(doc:LabelDocument,name:string,dpi:number,copies:number,svg:string){
 if(this.printing)throw Error('มีงานพิมพ์กำลังส่งอยู่');this.printing=true;try{return await this.send(doc,name,dpi,copies,svg);}finally{this.printing=false;}
 }
 private async send(doc:LabelDocument,name:string,dpi:number,copies:number,svg:string){
 validate(doc);validatePrintBounds(doc);if(![203,300,600].includes(dpi)||!Number.isInteger(copies)||copies<1||copies>100)throw Error('Invalid printer DPI or copies');
 if(!this.active||!this.names.includes(name))throw Error('เลือกเครื่องพิมพ์จากรายชื่อที่เชื่อมต่อแล้ว');
 const errors=barcodePreflight(doc,dpi).errors;if(errors.length)throw Error(errors.join('\n'));
 // Recheck the actual OS queue before sending, rather than accepting arbitrary destinations.
 await this.discover();if(!this.names.includes(name))throw Error('เครื่องพิมพ์นี้ไม่อยู่ในระบบแล้ว กรุณาค้นหารายชื่อใหม่');
 const png=await this.render(svg,doc.width,doc.height,dpi);if(!this.active)throw Error('QZ Tray ตัดการเชื่อมต่อ ยังไม่ได้ส่งงาน');
 const jobId=crypto.randomUUID();const size={width:doc.width,height:doc.height,custom:true};const config=this.client.configs.create(name,{copies,units:'mm',size,density:dpi/25.4,fallbackDensity:dpi/25.4,margins:0,scaleContent:false,interpolation:'nearest-neighbor',colorType:'blackwhite',jobName:`LabelCraft ${jobId} — ${doc.title}`});
 // Pixel images use the OS driver; never accept raw commands, host addresses or file destinations.
 try{await deadline(this.client.print(config,[{type:'pixel',format:'image',flavor:'base64',data:png}]),30000,'ไม่ทราบผลการส่งงาน ตรวจคิวเครื่องพิมพ์ก่อนพิมพ์ซ้ำ');}
 catch(error){throw Error(`${(error as Error).message} · ตรวจคิวเครื่องพิมพ์ก่อนพิมพ์ซ้ำ`);}
 return jobId;
 }
}
let loaded:Promise<LocalPrinterSession>|undefined;
export function localPrinterSession(){return loaded??=import('qz-tray').then(module=>new LocalPrinterSession(module.default));}
