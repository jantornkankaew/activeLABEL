import {createClient,type Session} from '@supabase/supabase-js';
import {readJobs} from './jobLibrary';
import type {LabelDocument} from './core';

const url=import.meta.env.VITE_SUPABASE_URL?.trim();
const key=import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const cloudWorkspaceConfigured=Boolean(url&&key);
export const cloudWorkspace=cloudWorkspaceConfigured?createClient(url!,key!,{auth:{persistSession:true,detectSessionInUrl:true,flowType:'pkce'}}):null;

export type CloudWorkspace={documents:LabelDocument[];activeId:string|null};

export async function currentCloudSession():Promise<Session|null>{
 if(!cloudWorkspace)return null;
 const {data,error}=await cloudWorkspace.auth.getSession();
 if(error)throw error;
 return data.session;
}

export async function signInCloud(){
 if(!cloudWorkspace)throw Error('Cloud workspace is not configured');
 const {error}=await cloudWorkspace.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+location.pathname}});
 if(error)throw error;
}

export async function signOutCloud(){
 if(!cloudWorkspace)return;
 const {error}=await cloudWorkspace.auth.signOut();
 if(error)throw error;
}

export async function loadCloudWorkspace(userId:string):Promise<CloudWorkspace>{
 if(!cloudWorkspace)throw Error('Cloud workspace is not configured');
 const [{data:rows,error:documentError},{data:state,error:stateError}]=await Promise.all([
  cloudWorkspace.from('labelcraft_documents').select('document').eq('owner_id',userId).order('updated_at',{ascending:false}),
  cloudWorkspace.from('labelcraft_user_state').select('active_document_id').eq('owner_id',userId).maybeSingle()
 ]);
 if(documentError)throw documentError;if(stateError)throw stateError;
 return {documents:readJobs((rows??[]).map(row=>row.document)),activeId:state?.active_document_id??null};
}

export async function saveCloudWorkspace(userId:string,documents:LabelDocument[],activeId:string){
 if(!cloudWorkspace)throw Error('Cloud workspace is not configured');
 const now=new Date().toISOString();
 const {error}=await cloudWorkspace.from('labelcraft_documents').upsert(documents.map(document=>({owner_id:userId,document_id:document.id,revision:document.revision,title:document.title,document,updated_at:now})),{onConflict:'owner_id,document_id'});
 if(error)throw error;
 const {error:stateError}=await cloudWorkspace.from('labelcraft_user_state').upsert({owner_id:userId,active_document_id:activeId,updated_at:now},{onConflict:'owner_id'});
 if(stateError)throw stateError;
}
