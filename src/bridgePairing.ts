import {localBridgeURL} from './printing';
export type BridgePairing={url:string;token:string};
const key='labelcraft-local-printer-session';
export function parseBridgePairingHash(hash:string):BridgePairing|null{
 if(!hash.startsWith('#bridge=')||hash.length>2000)return null;
 try{const value=hash.slice(8);if(!/^[A-Za-z0-9_-]+$/.test(value))return null;const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))));if(!data||Array.isArray(data)||Object.keys(data).length!==2||typeof data.url!=='string'||typeof data.token!=='string'||!/^[-A-Za-z0-9_]{24,256}$/.test(data.token))return null;return {url:localBridgeURL(data.url,'https:'),token:data.token};}catch{return null;}
}
export function readBridgePairing():BridgePairing|null{try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(!saved)return null;return parseBridgePairingHash('#bridge='+btoa(JSON.stringify(saved)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,''));}catch{return null;}}
export function consumeBridgePairingHash(){const pairing=parseBridgePairingHash(location.hash);if(pairing){try{sessionStorage.setItem(key,JSON.stringify(pairing));}catch{/* The current tab can still use its in-memory pairing. */}history.replaceState(null,'',location.pathname+location.search);return pairing;}return readBridgePairing();}
