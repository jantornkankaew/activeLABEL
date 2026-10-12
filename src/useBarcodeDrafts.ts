import {useState} from 'react';
import type {LabelDocument} from './core';
import type {Symbology} from './barcodes';
export type BarcodeDraft={content:string;type:Symbology;error:string};
export function useBarcodeDrafts(doc:LabelDocument|null){
 const [drafts,setDrafts]=useState<Record<string,BarcodeDraft>>({});const key=(id:string)=>JSON.stringify([doc?.id,id]);
 const getDraft=(id:string)=>drafts[key(id)];
 function setDraft(id:string,next:BarcodeDraft){const idKey=key(id);setDrafts(previous=>{const old=previous[idKey];if(old&&old.content===next.content&&old.type===next.type&&old.error===next.error)return previous;return {...previous,[idKey]:next};});}
 return {getDraft,setDraft,invalid:doc?.objects.some(item=>item.kind==='barcode'&&Boolean(getDraft(item.id)?.error))??false};
}
