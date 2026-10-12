export function fitScale(widthMm:number,heightMm:number,widthPx:number,heightPx:number){return Math.max(.01,Math.min(Math.max(1,widthPx-78)/widthMm,Math.max(1,heightPx-102)/heightMm));}
export function snapCoordinate(value:number,step:number,enabled:boolean){return enabled?Math.round(value/step)*step:value;}
export function proportionalScale(width:number,height:number,dx:number,dy:number,maxWidth:number,maxHeight:number){return Math.max(.01,Math.min((width*(width+dx)+height*(height+dy))/(width*width+height*height),maxWidth/width,maxHeight/height));}

export function resizeExtent(start:number,delta:number,origin:number,maximum:number,step:number,snap:boolean){return Math.max(Math.min(.1,maximum-origin),Math.min(maximum-origin,snapCoordinate(origin+start+delta,step,snap)-origin));}
export function integerPercent(requested:number,min:number,max:number){const lower=Math.ceil(min),upper=Math.floor(max+1e-9);if(upper<lower)return null;return Math.max(lower,Math.min(upper,Math.round(requested)));}
