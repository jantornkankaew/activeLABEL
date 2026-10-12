import type {Command,LabelDocument} from './core';
export type Alignment='left'|'h-center'|'right'|'top'|'v-center'|'bottom';
export function alignmentCommands(doc:LabelDocument,ids:string[],alignment:Alignment):Command[]{
 if(!ids.length)throw Error('Select an object to align');if(!['left','h-center','right','top','v-center','bottom'].includes(alignment))throw Error('Unsupported alignment');
 return [...new Set(ids)].map(id=>{const item=doc.objects.find(o=>o.id===id);if(!item)throw Error('Unknown object');if(item.locked)throw Error('Unlock the object before aligning');
 const changes=alignment==='left'?{x:0}:alignment==='h-center'?{x:(doc.width-item.width)/2}:alignment==='right'?{x:doc.width-item.width}:alignment==='top'?{y:0}:alignment==='v-center'?{y:(doc.height-item.height)/2}:{y:doc.height-item.height};return {op:'update',id,changes};});
}
