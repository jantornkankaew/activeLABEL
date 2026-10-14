import bwipjs from 'bwip-js/browser';
export const barcodeTypes = [{value:'code128',name:'Code 128'},{value:'code39',name:'Code 39'},{value:'code93',name:'Code 93'},{value:'ean13',name:'EAN-13'},{value:'ean8',name:'EAN-8'},{value:'upca',name:'UPC-A'},{value:'upce',name:'UPC-E'},{value:'interleaved2of5',name:'Interleaved 2 of 5'},{value:'qrcode',name:'QR Code'},{value:'datamatrix',name:'Data Matrix'},{value:'pdf417',name:'PDF417'}] as const;
export type Symbology=typeof barcodeTypes[number]['value'];
export const isSquareCode=(type:Symbology)=>type==='qrcode'||type==='datamatrix';
export const isLinearBarcode=(type:Symbology)=>!isSquareCode(type)&&type!=='pdf417';
export type BarTopStyle='flat'|'wave'|'zigzag'|'sawtooth'|'bubble';
export const retailBarcode=(type:Symbology)=>['ean13','ean8','upca','upce'].includes(type);
export type BarcodeProfile={svg:string;width:number;height:number;moduleMm:number;barHeightMm:number;quiet:{left:number;right:number;top:number;bottom:number};wideRatio?:number;rowHeightX?:number;reference:string};
const profileCache=new Map<string,BarcodeProfile>();
const X=.33;
export function barcodeProfile(symbology:Symbology,content:string):BarcodeProfile {
 const key=JSON.stringify([symbology,content]);const cached=profileCache.get(key);if(cached)return cached;
 const matrix=isSquareCode(symbology)||symbology==='pdf417';const retail=retailBarcode(symbology);
 const raw=bwipjs.raw({bcid:symbology,text:content,...(symbology==='code93'?{includecheck:true}:{})})[0] as unknown as {sbs?:number[];pixx?:number;pixy?:number;width?:number;height?:number};
 const trailing=raw.sbs&&raw.sbs.length%2===0?raw.sbs.at(-1)!:0;
 const modules=(raw.sbs?.reduce((sum,value)=>sum+value*(symbology==='interleaved2of5'?2:1)-(symbology==='interleaved2of5'?1:0),0)??raw.pixx!)-trailing;
 const quiet=matrix?{left:symbology==='qrcode'?4:symbology==='datamatrix'?1:2,right:symbology==='qrcode'?4:symbology==='datamatrix'?1:2,top:symbology==='qrcode'?4:symbology==='datamatrix'?1:2,bottom:symbology==='qrcode'?4:symbology==='datamatrix'?1:2}:{left:symbology==='ean13'?11:['upca','upce'].includes(symbology)?9:symbology==='ean8'?7:10,right:symbology==='ean13'||symbology==='ean8'||symbology==='upce'?7:symbology==='upca'?9:10,top:0,bottom:0};
 const barHeight=retail?(symbology==='ean8'?18.23:22.85):matrix?0:symbology==='code39'?Math.max(5,.15*modules*X):symbology==='code93'?Math.max(5.08,.15*(modules+20)*X):Math.max(10,.15*modules*X);
 const options={bcid:symbology,text:content,scale:4,...(symbology==='code93'?{includecheck:true}:{}),includetext:!matrix,textsize:12,text1size:12,...(!matrix?{height:barHeight/X*25.4/72}:{}),...(symbology==='pdf417'?{rowmult:3}:{})};
 const source=bwipjs.toSVG(options);const match=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source);if(!match)throw Error('Barcode dimensions unavailable');
 let unit=4,left=0;
 if(matrix)unit=Number(match[1])/raw.pixx!;
 else{let min=Infinity;for(const path of source.matchAll(/<path[^>]*stroke-width="([\d.]+)"[^>]*d="([^"]+)"/g)){for(const move of path[2].matchAll(/M(-?[\d.]+) /g))min=Math.min(min,Number(move[1])-Number(path[1])/2);}if(!Number.isFinite(min))throw Error('Barcode bars unavailable');left=min;}
 const w=modules+quiet.left+quiet.right;
 const h=retail?(symbology==='ean8'?21.31:25.93)/X:Number(match[2])/unit+quiet.top+quiet.bottom;
 let body=source.slice(source.indexOf('>')+1,source.lastIndexOf('</svg>'));
 // BWIPP UPC-E places its outside check digit beyond the 7X right quiet zone.
 // Centre that HRI glyph in the reserved zone; encoded bars stay untouched.
 if(symbology==='upce'){const at=body.lastIndexOf('<path');body=body.slice(0,at)+'<g transform="translate(-12 0)">'+body.slice(at)+'</g>';}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="white"/><g transform="translate(${quiet.left-left/unit} ${quiet.top}) scale(${1/unit})">${body}</g></svg>`;
 const profile:BarcodeProfile={svg,width:w*X,height:h*X,moduleMm:X,barHeightMm:barHeight,quiet,...(['code39','interleaved2of5'].includes(symbology)?{wideRatio:3}:{}),...(symbology==='pdf417'?{rowHeightX:3}:{}),reference:retail?'EAN/UPC retail nominal':'Generic application reference'};
 if(profileCache.size>=100)profileCache.delete(profileCache.keys().next().value!);profileCache.set(key,profile);return profile;
}
export function encodeBarcode(symbology:Symbology,content:string){return barcodeProfile(symbology,content).svg;}
export function barcodeMagnification(item:{symbology:Symbology;content:string;width:number}){return item.width/barcodeProfile(item.symbology,item.content).width*100;}
export function barcodeHeight(item:{symbology:Symbology;content:string;width:number;barHeightScale?:number}){const profile=barcodeProfile(item.symbology,item.content),scale=barcodeMagnification(item)/100;if(!isLinearBarcode(item.symbology))return profile.height*scale;return (profile.height-profile.barHeightMm*(1-(item.barHeightScale??100)/100))*scale;}
export function barcodeScaleLimits(type:Symbology){return retailBarcode(type)?{min:80,max:200}:{min:10,max:1000};}
export function barcodeDeviceScale(item:{symbology:Symbology;content:string;width:number},dpi:number){
 if(![203,300,600].includes(dpi))throw Error('Unsupported printer DPI');const limits=barcodeScaleLimits(item.symbology);const currentX=barcodeMagnification(item)/100*X;const minDots=Math.max(1,Math.ceil(limits.min/100*X*dpi/25.4-1e-9));const maxDots=Math.floor(limits.max/100*X*dpi/25.4+1e-9);const dots=Math.max(minDots,Math.min(maxDots,Math.round(currentX*dpi/25.4)));return dots*25.4/dpi/X*100;
}
export function validateBarcode(symbology:Symbology,content:string){
 if(!barcodeTypes.some(type=>type.value===symbology))throw Error('Unsupported barcode type');
 if(!content||content.length>300)throw Error('Barcode payload must be 1–300 characters');
 if(symbology==='interleaved2of5'&&(!/^\d+$/.test(content)||content.length%2!==0))throw Error('Interleaved 2 of 5 requires an even number of digits; leading zeros are never added automatically');
 const retail={ean13:13,ean8:8,upca:12,upce:8} as Record<string,number>;
 if(retail[symbology]&&!new RegExp(`^\\d{${retail[symbology]}}$`).test(content))throw Error(`${symbology.toUpperCase()} requires ${retail[symbology]} digits including check digit`);
 try{encodeBarcode(symbology,content);}catch(error){throw Error(String(error).replace(/^Error:\s*/,''));}
}

export function barcodeRatio(symbology:Symbology,content:string):number {const p=barcodeProfile(symbology,content);return p.width/p.height;}
export function fitBarcodeBox<T extends {kind:string;symbology:Symbology;content:string;width:number;height:number;barcodeScale?:number}>(item:T,legacy=false):T {
 if(item.kind!=='barcode'||!item.content)return item;const p=barcodeProfile(item.symbology,item.content);const limits=barcodeScaleLimits(item.symbology);
 const scale=item.barcodeScale??Math.min(item.width/p.width,item.height/p.height)*100;const chosen=legacy||item.barcodeScale!==undefined?scale:Math.max(limits.min,Math.min(limits.max,scale));
 const next={...item,width:p.width*chosen/100,...(!legacy||item.barcodeScale!==undefined?{barcodeScale:chosen}:{})};return {...next,height:barcodeHeight(next)};
}
export function barcodeSuggestion(symbology:Symbology,content:string):{value:string;label:string}|undefined {
 const lengths:Partial<Record<Symbology,number>>={ean13:13,ean8:8,upca:12};const length=lengths[symbology];
 if(length&&/^\d+$/.test(content)&&(content.length===length||content.length===length-1)){
  const body=content.slice(0,length-1);const sum=[...body].reverse().reduce((total,digit,index)=>total+Number(digit)*(index%2?1:3),0);return {value:body+((10-sum%10)%10),label:content.length===length?'แก้ check digit อัตโนมัติ':'เติม check digit อัตโนมัติ'};
 }
 if(symbology==='code39'&&content!==content.toUpperCase()&&/^[a-zA-Z0-9 .$/+%\-]+$/.test(content))return {value:content.toUpperCase(),label:'เปลี่ยนเป็นตัวพิมพ์ใหญ่'};
 if(symbology==='interleaved2of5'&&/^\d+$/.test(content)&&content.length%2)return {value:'0'+content,label:'เติม 0 ด้านหน้าให้จำนวนหลักเป็นเลขคู่'};
 const examples:Record<Symbology,string>={code128:'SKU001234',code39:'SKU001234',code93:'SKU001234',ean13:'4006381333931',ean8:'96385074',upca:'036000291452',upce:'04252614',interleaved2of5:'001234',qrcode:'SAMPLE',datamatrix:'SAMPLE',pdf417:'SAMPLE'};
 return {value:examples[symbology],label:'ใช้ข้อมูลตัวอย่าง (เปลี่ยนข้อมูลบาร์โค้ด)'};
}
