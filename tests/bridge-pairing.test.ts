import test from 'node:test';import assert from 'node:assert/strict';
import {parseBridgePairingHash} from '../src/bridgePairing';
import {localBridgeURL} from '../src/printing';
const hash=(value:unknown)=>'#bridge='+Buffer.from(JSON.stringify(value)).toString('base64url');
test('native pairing accepts only a bounded loopback endpoint and header-safe token',()=>{const pair={url:'http://127.0.0.1:28171',token:'a'.repeat(43)};assert.deepEqual(parseBridgePairingHash(hash(pair)),pair);assert.equal(localBridgeURL('http://127.0.0.1:28171','https:'),pair.url);for(const value of [{...pair,url:'http://printer.example:28171'},{...pair,url:'http://127.0.0.1:28171/?token=secret'},{...pair,token:'x\n'.repeat(24)},{...pair,token:'short'},{...pair,extra:'data'},null,[]])assert.equal(parseBridgePairingHash(hash(value)),null);assert.equal(parseBridgePairingHash('#bridge='+ 'a'.repeat(2001)),null);assert.equal(parseBridgePairingHash('#share=abc'),null);});
