import test from 'node:test';
import assert from 'node:assert/strict';
import {barcodeTypes} from '../src/barcodes';
import {object} from '../src/core';
import {barcodeSvg,barcodeOverflowSvg,shapeBarcodeTop} from '../src/renderer';
test('overflow colours inherited matrix fills and explicit linear strokes while keeping white quiet zones',()=>{
 const payloads:Record<string,string>={ean13:'4006381333931',ean8:'96385074',upca:'036000291452',upce:'04252614',interleaved2of5:'123456',code128:'ABC',code39:'ABC',code93:'ABC',qrcode:'ABC',datamatrix:'ABC',pdf417:'ABC'};
 for(const {value} of barcodeTypes){const item=object('barcode',{symbology:value,content:payloads[value]});const normal=barcodeSvg(item),red=barcodeOverflowSvg(item);assert(red.startsWith('<svg fill="#dc2626"'));assert(!red.includes('#000000'));assert(red.includes('fill="white"'));assert.equal(red.replace('<svg fill="#dc2626"','<svg').replaceAll('#dc2626','#000000'),normal);assert(!normal.includes('#dc2626'));}
});
test('1D top styles shorten bar paths without changing the encoded artwork below',()=>{const item=object('barcode',{symbology:'code128',content:'TOP123',barHeightScale:60,barTopStyle:'wave'});const base=barcodeSvg({...item,barHeightScale:100,barTopStyle:'flat'}),styled=barcodeSvg(item);assert.notEqual(styled,base);assert.match(styled,/viewBox="0 [\d.]+ [\d.]+ [\d.]+"/);for(const style of ['zigzag','sawtooth','bubble'] as const)assert.notEqual(shapeBarcodeTop(base,70,style),base);assert.match(shapeBarcodeTop(base,70,'bubble'),/<circle /);});
