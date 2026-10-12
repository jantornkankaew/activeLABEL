import bwipjs from 'bwip-js/browser';
export const barcodeTypes = [{value:'code128',name:'Code 128'},{value:'code39',name:'Code 39'},{value:'code93',name:'Code 93'},{value:'ean13',name:'EAN-13'},{value:'ean8',name:'EAN-8'},{value:'upca',name:'UPC-A'},{value:'upce',name:'UPC-E'},{value:'interleaved2of5',name:'Interleaved 2 of 5'},{value:'qrcode',name:'QR Code'},{value:'datamatrix',name:'Data Matrix'},{value:'pdf417',name:'PDF417'}] as const;
export type Symbology=typeof barcodeTypes[number]['value'];
export const isSquareCode=(type:Symbology)=>type==='qrcode'||type==='datamatrix';
export function encodeBarcode(symbology:Symbology,content:string){return bwipjs.toSVG({bcid:symbology,text:content,scale:3,...(isSquareCode(symbology)||symbology==='pdf417'?{}:{height:10}),includetext:!isSquareCode(symbology)&&symbology!=='pdf417',textxalign:'center',paddingwidth:10,paddingheight:2});}
export function validateBarcode(symbology:Symbology,content:string){
 if(!barcodeTypes.some(type=>type.value===symbology))throw Error('Unsupported barcode type');
 if(!content||content.length>300)throw Error('Barcode payload must be 1–300 characters');
 if(symbology==='interleaved2of5'&&(!/^\d+$/.test(content)||content.length%2!==0))throw Error('Interleaved 2 of 5 requires an even number of digits; leading zeros are never added automatically');
 const retail={ean13:13,ean8:8,upca:12,upce:8} as Record<string,number>;
 if(retail[symbology]&&!new RegExp(`^\\d{${retail[symbology]}}$`).test(content))throw Error(`${symbology.toUpperCase()} requires ${retail[symbology]} digits including check digit`);
 try{encodeBarcode(symbology,content);}catch(error){throw Error(String(error).replace(/^Error:\s*/,''));}
}
