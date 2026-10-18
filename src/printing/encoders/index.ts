import type {Encoder, PrinterLanguage} from '../types';
import {TSPLEncoder} from './tspl';
import {ZPLEncoder} from './zpl';

const encoders: Record<string, Encoder> = {
  tspl: new TSPLEncoder(),
  zpl: new ZPLEncoder(),
};

export function getEncoder(language: PrinterLanguage): Encoder {
  const enc = encoders[language.toLowerCase()];
  if (!enc) {
    throw new Error(`ภาษาสั่งพิมพ์ "${language}" ยังไม่รองรับในขณะนี้ (รองรับ TSPL และ ZPL)`);
  }
  return enc;
}

export {TSPLEncoder, ZPLEncoder};
