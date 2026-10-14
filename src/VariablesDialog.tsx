import {useState} from 'react';
import {Plus,Trash2,X} from 'lucide-react';
import type {LabelVariable} from './core';
import {variableNamePattern} from './variables';
import './variables.css';

export function VariablesDialog({variables,onSave,onClose}:{variables:LabelVariable[];onSave:(variables:LabelVariable[])=>void;onClose:()=>void}){
 const [rows,setRows]=useState(()=>structuredClone(variables));const [error,setError]=useState('');
 function update(index:number,changes:Partial<LabelVariable>){setRows(value=>value.map((row,i)=>i===index?{...row,...changes}:row));setError('');}
 function save(){if(rows.some(row=>!variableNamePattern.test(row.name))){setError('Name ใช้ A–Z, 0–9 และ _ โดยต้องขึ้นต้นด้วยตัวอักษรหรือ _');return;}if(new Set(rows.map(row=>row.name)).size!==rows.length){setError('Variable name ซ้ำกัน');return;}onSave(rows);}
 return <div className="modal-backdrop"><div className="modal variable-modal" role="dialog" aria-modal="true" aria-labelledby="variable-title"><div className="variable-heading"><h2 id="variable-title">Variables</h2><button aria-label="Close variables" onClick={onClose}><X size={18}/></button></div><div className="variable-list">{rows.map((row,index)=><div className="variable-row" key={index}><label>Name<input aria-label={`Variable ${index+1} name`} value={row.name} onChange={e=>update(index,{name:e.target.value})}/></label><label>Label<input aria-label={`Variable ${index+1} label`} value={row.label} onChange={e=>update(index,{label:e.target.value})}/></label><label>Default<input aria-label={`Variable ${index+1} default`} value={row.value} onChange={e=>update(index,{value:e.target.value})}/></label><label className="variable-prompt"><input type="checkbox" checked={row.prompt} onChange={e=>update(index,{prompt:e.target.checked})}/> Ask before print</label><button aria-label={`Remove variable ${row.name||index+1}`} onClick={()=>setRows(value=>value.filter((_,i)=>i!==index))}><Trash2 size={15}/></button></div>)}</div><button className="add-variable" onClick={()=>setRows(value=>[...value,{name:`variable_${value.length+1}`,label:`Variable ${value.length+1}`,value:'',prompt:true}])}><Plus size={15}/> Add variable</button>{error&&<p className="variable-error" role="alert">{error}</p>}<div className="modal-actions"><button onClick={onClose}>Cancel</button><button className="primary" onClick={save}>Save</button></div></div></div>;
}
