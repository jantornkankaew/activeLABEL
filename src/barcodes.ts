import bwipjs from 'bwip-js/browser';
export const barcodeTypes = [{value:'code128',name:'Code 128'},{value:'code39',name:'Code 39'},{value:'code93',name:'Code 93'},{value:'ean13',name:'EAN-13'},{value:'ean8',name:'EAN-8'},{value:'upca',name:'UPC-A'},{value:'upce',name:'UPC-E'},{value:'interleaved2of5',name:'Interleaved 2 of 5'},{value:'qrcode',name:'QR Code'},{value:'datamatrix',name:'Data Matrix'},{value:'pdf417',name:'PDF417'}] as const;
export type Symbology=typeof barcodeTypes[number]['value'];
export const isSquareCode=(type:Symbology)=>type==='qrcode'||type==='datamatrix';
const svgCache=new Map<string,string>();
export function encodeBarcode(symbology:Symbology,content:string){const key=JSON.stringify([symbology,content]);const cached=svgCache.get(key);if(cached)return cached;const svg=bwipjs.toSVG({bcid:symbology,text:content,scale:3,...(isSquareCode(symbology)||symbology==='pdf417'?{}:{height:10}),includetext:!isSquareCode(symbology)&&symbology!=='pdf417',textxalign:'center',paddingwidth:10,paddingheight:isSquareCode(symbology)?10:2});if(svgCache.size>=100)svgCache.delete(svgCache.keys().next().value!);svgCache.set(key,svg);return svg;}
export function validateBarcode(symbology:Symbology,content:string){
 if(!barcodeTypes.some(type=>type.value===symbology))throw Error('Unsupported barcode type');
 if(!content||content.length>300)throw Error('Barcode payload must be 1–300 characters');
 if(symbology==='interleaved2of5'&&(!/^\d+$/.test(content)||content.length%2!==0))throw Error('Interleaved 2 of 5 requires an even number of digits; leading zeros are never added automatically');
 const retail={ean13:13,ean8:8,upca:12,upce:8} as Record<string,number>;
 if(retail[symbology]&&!new RegExp(`^\\d{${retail[symbology]}}$`).test(content))throw Error(`${symbology.toUpperCase()} requires ${retail[symbology]} digits including check digit`);
 try{encodeBarcode(symbology,content);}catch(error){throw Error(String(error).replace(/^Error:\s*/,''));}
}

const ratioCache=new Map<string,number>();
// Ratio includes the encoder's bars/modules, human-readable text and quiet padding.
export function barcodeRatio(symbology:Symbology,content:string):number {
 const key=JSON.stringify([symbology,content]);const cached=ratioCache.get(key);if(cached!==undefined)return cached;
 const svg=encodeBarcode(symbology,content);const match=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
 if(!match||Number(match[2])<=0)throw Error('Barcode dimensions unavailable');
 const ratio=Number(match[1])/Number(match[2]);if(ratioCache.size>=100)ratioCache.delete(ratioCache.keys().next().value!);ratioCache.set(key,ratio);return ratio;
}
export function fitBarcodeBox<T extends {kind:string;symbology:Symbology;content:string;width:number;height:number}>(item:T):T {
 if(item.kind!=='barcode'||!item.content)return item;
 const ratio=barcodeRatio(item.symbology,item.content);const width=Math.min(item.width,item.height*ratio);return {...item,width,height:width/ratio};
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
