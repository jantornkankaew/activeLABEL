import {migrateDocument,seed,validate,type LabelDocument} from './core';
export function mergeJobs(jobs:LabelDocument[],current:LabelDocument){return [...jobs.filter(d=>d.id!==current.id),current];}
export function readJobs(values:unknown):LabelDocument[]{
 if(!Array.isArray(values))return [];const jobs:LabelDocument[]=[];
 for(const value of values.slice(0,50)){try{const d=migrateDocument(value);if(!jobs.some(job=>job.id===d.id))jobs.push(d);}catch{/* Preserve other valid jobs when one file is invalid. */}}
 return jobs;
}
export function loadLocalJobs(){try{const saved=JSON.parse(localStorage.getItem('labelcraft-jobs-v1')||'null');const jobs=readJobs(saved?.documents);if(jobs.length)return {documents:jobs,document:jobs.find(d=>d.id===saved.activeId)??jobs[0]};}catch{/* Try the previous single-document format. */}
 let document:LabelDocument;try{document=migrateDocument(JSON.parse(localStorage.getItem('labelcraft-document')||'null'));}catch{document=seed();}
 return {documents:[document],document};
}
export function newJob(index:number):LabelDocument {const d=seed();d.title=`Untitled label ${index}`;d.objects=[];validate(d);return d;}
