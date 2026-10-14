import {barcodeMagnification,barcodeProfile,barcodeScaleLimits,validateBarcode} from './barcodes';
import {sizeText,type LabelDocument,type LabelVariable} from './core';

export const variableNamePattern=/^[A-Za-z_][A-Za-z0-9_]{0,31}$/;
export function variableNames(template:string){return [...new Set([...template.matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g)].map(match=>match[1]))];}
export function renderTemplate(template:string,values:Record<string,string>){return template.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g,(_,name)=>values[name]??'');}
export function variableValues(variables:LabelVariable[]=[],overrides:Record<string,string>={}){return Object.fromEntries(variables.map(variable=>[variable.name,overrides[variable.name]??variable.value]));}
export function usedVariables(doc:LabelDocument){const names=new Set(doc.objects.flatMap(item=>variableNames(item.template??'')));return (doc.variables??[]).filter(variable=>names.has(variable.name));}
export function resolveDocument(doc:LabelDocument,overrides:Record<string,string>={}):LabelDocument{
 const values=variableValues(doc.variables,overrides);const missing=[...new Set(doc.objects.flatMap(item=>variableNames(item.template??'')))].filter(name=>!(name in values));if(missing.length)throw Error(`ยังไม่มี Variable: ${missing.join(', ')}`);const next=structuredClone(doc);
 next.objects=next.objects.map(item=>{if(!item.template)return item;const content=renderTemplate(item.template,values);if(item.kind==='barcode'){validateBarcode(item.symbology,content);const scale=item.barcodeScale??barcodeMagnification(item);const limits=barcodeScaleLimits(item.symbology);const bounded=Math.max(limits.min,Math.min(limits.max,scale));const profile=barcodeProfile(item.symbology,content);return {...item,content,barcodeScale:bounded,width:profile.width*bounded/100,height:profile.height*bounded/100};}return sizeText({...item,content});});
 return next;
}
