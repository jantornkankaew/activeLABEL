import {barcodeMagnification,barcodeProfile,barcodeScaleLimits,validateBarcode} from './barcodes';
import {sizeText,type LabelDocument,type LabelVariable} from './core';
import type {LabelFormula} from './formulaEngine';
import {resolveVariableValuesWithFormulas} from './formulaEngine';

export const variableNamePattern=/^[A-Za-z_][A-Za-z0-9_]{0,31}$/;
export type SimpleVariableBinding={name:string;prefix:string;suffix:string};
export function variableNames(template:string){return [...new Set([...template.matchAll(/\{\{\s*([A-Za-z0-9_:]+)\s*\}\}/g)].map(match=>match[1]))];}
export function renderTemplate(template:string,values:Record<string,string>){return template.replace(/\{\{\s*([A-Za-z0-9_:]+)\s*\}\}/g,(_,name)=>values[name]??'');}
export function simpleVariableBinding(template:string|undefined):SimpleVariableBinding|null {if(!template)return null;const tokens=[...template.matchAll(/\{\{\s*([A-Za-z0-9_:]+)\s*\}\}/g)];if(tokens.length!==1)return null;const token=tokens[0];return {prefix:template.slice(0,token.index),name:token[1],suffix:template.slice(token.index!+token[0].length)};}
export function variableTemplate(binding:SimpleVariableBinding){return `${binding.prefix}{{${binding.name}}}${binding.suffix}`;}
export function variableValues(variables:LabelVariable[]=[],overrides:Record<string,string>={},formulas:LabelFormula[]=[],serialIndex=0){return resolveVariableValuesWithFormulas(variables,formulas,overrides,new Date(),serialIndex);}
export function usedVariables(doc:LabelDocument){const names=new Set(doc.objects.flatMap(item=>variableNames(item.template??'')));return (doc.variables??[]).filter(variable=>names.has(variable.name));}
export function resolveDocument(doc:LabelDocument,overrides:Record<string,string>={},serialIndex=0):LabelDocument{
 const values=variableValues(doc.variables,overrides,doc.formulas,serialIndex);const missing=[...new Set(doc.objects.flatMap(item=>variableNames(item.template??'')))].filter(name=>!(name in values));if(missing.length)throw Error(`ยังไม่มี Variable: ${missing.join(', ')}`);const next=structuredClone(doc);
 next.objects=next.objects.map(item=>{if(!item.template)return item;const content=renderTemplate(item.template,values);if(item.kind==='barcode'){validateBarcode(item.symbology,content);const scale=item.barcodeScale??barcodeMagnification(item);const limits=barcodeScaleLimits(item.symbology);const bounded=Math.max(limits.min,Math.min(limits.max,scale));const profile=barcodeProfile(item.symbology,content);return {...item,content,barcodeScale:bounded,width:profile.width*bounded/100,height:profile.height*bounded/100};}return sizeText({...item,content});});
 return next;
}
