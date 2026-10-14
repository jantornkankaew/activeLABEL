import {fontMetrics} from './fontMetrics';
export const fontNames = ['Noto Sans','Noto Sans Thai','Noto Serif','Noto Serif Thai','Noto Sans Mono','Open Sans','DejaVu Sans','DejaVu Serif','DejaVu Sans Mono','Arial','Arial Narrow','Helvetica','Verdana','Tahoma','Trebuchet MS','Georgia','Times New Roman','Courier New','Impact'] as const;
export type FontName = typeof fontNames[number];
const metricFamily:Record<FontName,string>={'Noto Sans':'NotoSans','Noto Sans Thai':'NotoSansThai','Noto Serif':'NotoSerif','Noto Serif Thai':'NotoSerifThai','Noto Sans Mono':'NotoSansMono','Open Sans':'OpenSans','DejaVu Sans':'DejaVuSans','DejaVu Serif':'DejaVuSerif','DejaVu Sans Mono':'DejaVuSansMono','Arial':'NotoSans','Arial Narrow':'OpenSans','Helvetica':'NotoSans','Verdana':'DejaVuSans','Tahoma':'NotoSans','Trebuchet MS':'OpenSans','Georgia':'DejaVuSerif','Times New Roman':'NotoSerif','Courier New':'DejaVuSansMono','Impact':'DejaVuSans'};
export function textMetrics(content:string, fontSize:number, fontName:FontName='Noto Sans', bold=false) {
 const style=bold?'Bold':'Regular'; const latin=fontMetrics[metricFamily[fontName]+style];
 const thai=fontMetrics[(fontName.includes('Serif')?'NotoSerifThai':'NotoSansThai')+style];
 let advance=0; let ascent=latin.ascent; let descent=latin.descent;
 for(const char of content){const code=char.codePointAt(0)!;const font=latin.advances[code]!==undefined?latin:code>=0xe00&&code<=0xe7f?thai:fontMetrics['NotoSans'+style];advance+=font.advances[code]??.65;ascent=Math.max(ascent,font.ascent);descent=Math.max(descent,font.descent);}
 // Bundled font advances, with kerning/Latin ligatures disabled in SVG. Extra edge space protects ink overhangs.
 return {width:Math.max(.5,Math.ceil((advance+.12)*fontSize*100)/100),height:Math.ceil((ascent+descent)*fontSize*100)/100,baseline:ascent*fontSize};
}

export function fontStack(fontName:FontName='Noto Sans'){const quoted=`"${fontName}"`;return `${quoted}, ${fontName.includes('Serif')||fontName==='Georgia'||fontName==='Times New Roman'?'Noto Serif Thai':'Noto Sans Thai'}, Noto Sans, sans-serif`;}
