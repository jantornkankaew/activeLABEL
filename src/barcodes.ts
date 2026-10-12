import bwipjs from 'bwip-js/browser';
export const barcodeTypes = [{value:'code128',name:'Code 128'},{value:'code39',name:'Code 39'},{value:'code93',name:'Code 93'},{value:'ean13',name:'EAN-13'},{value:'ean8',name:'EAN-8'},{value:'upca',name:'UPC-A'},{value:'upce',name:'UPC-E'},{value:'interleaved2of5',name:'Interleaved 2 of 5'},{value:'qrcode',name:'QR Code'},{value:'datamatrix',name:'Data Matrix'},{value:'pdf417',name:'PDF417'}] as const;
export type Symbology=typeof barcodeTypes[number]['value'];
export const isSquareCode=(type:Symbology)=>type==='qrcode'||type==='datamatrix';
export function encodeBarcode(symbology:Symbology,content:string){return bwipjs.toSVG({bcid:symbology,text:content,scale:3,...(isSquareCode(symbology)||symbology==='pdf417'?{}:{height:10}),includetext:!isSquareCode(symbology)&&symbology!=='pdf417',textxalign:'center',paddingwidth:10,paddingheight:isSquareCode(symbology)?10:2});}
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
