import {fontMetrics} from './fontMetrics';
export const fontNames = ['Noto Sans', 'Noto Serif', 'Noto Sans Mono', 'Noto Sans Thai', 'Noto Serif Thai', 'Open Sans', 'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono'] as const;
export type FontName = typeof fontNames[number];
export function textMetrics(content:string, fontSize:number, fontName:FontName='Noto Sans', bold=false) {
 const style=bold?'Bold':'Regular'; const latin=fontMetrics[fontName.replaceAll(' ','')+style];
 const thai=fontMetrics[(fontName.includes('Serif')?'NotoSerifThai':'NotoSansThai')+style];
 let advance=0; let ascent=latin.ascent; let descent=latin.descent;
 for(const char of content){const code=char.codePointAt(0)!;const font=latin.advances[code]!==undefined?latin:code>=0xe00&&code<=0xe7f?thai:fontMetrics['NotoSans'+style];advance+=font.advances[code]??.65;ascent=Math.max(ascent,font.ascent);descent=Math.max(descent,font.descent);}
 // Bundled font advances, with kerning/Latin ligatures disabled in SVG. Extra edge space protects ink overhangs.
 return {width:Math.max(.5,Math.ceil((advance+.12)*fontSize*100)/100),height:Math.ceil((ascent+descent)*fontSize*100)/100,baseline:ascent*fontSize};
}

export function fontStack(fontName:FontName='Noto Sans'){return `${fontName}, ${fontName.includes('Serif')?'Noto Serif Thai':'Noto Sans Thai'}, Noto Sans, sans-serif`;}
