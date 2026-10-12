export const measurementUnits=['mm','cm','inch','dot'] as const;
export type MeasurementUnit=typeof measurementUnits[number];
export type MeasurementSettings={unit:MeasurementUnit;dpi:number};
export const defaultMeasurements:MeasurementSettings={unit:'mm',dpi:203};
function factor(unit:MeasurementUnit,dpi:number){if(!measurementUnits.includes(unit)||!Number.isFinite(dpi)||dpi<=0)throw Error('Invalid measurement settings');return unit==='cm'?10:unit==='inch'?25.4:unit==='dot'?25.4/dpi:1;}
export function toMillimetres(value:number,unit:MeasurementUnit,dpi=203){if(!Number.isFinite(value))throw Error('Invalid measurement');return value*factor(unit,dpi);}
export function fromMillimetres(value:number,unit:MeasurementUnit,dpi=203){if(!Number.isFinite(value))throw Error('Invalid measurement');return value/factor(unit,dpi);}
export function displayMeasurement(mm:number,settings:MeasurementSettings){return Number(fromMillimetres(mm,settings.unit,settings.dpi).toFixed(settings.unit==='inch'?6:settings.unit==='dot'?3:4));}
export function rulerTicks(lengthMm:number,settings:MeasurementSettings){
 if(!Number.isFinite(lengthMm)||lengthMm<=0)throw Error("Invalid ruler length");
 const length=fromMillimetres(lengthMm,settings.unit,settings.dpi);const desired=length/6;const power=10**Math.floor(Math.log10(desired));const step=[1,2,2.5,5,10].map(n=>n*power).find(n=>n>=desired)??10*power;
 const count=Math.floor(length/step*2+1e-8);return Array.from({length:count+1},(_,i)=>{const value=i*step/2;return {mm:toMillimetres(value,settings.unit,settings.dpi),label:i%2===0?String(Number(value.toFixed(6))):''};});
}
export function gridPresets(settings:MeasurementSettings){const values=settings.unit==='inch'?[.01,.025,.05,.1,.25]:settings.unit==='dot'?[1,2,4,8,16,32,64]:settings.unit==='cm'?[.05,.1,.2,.5,1]:[.5,1,2,5,10];return values.map(value=>toMillimetres(value,settings.unit,settings.dpi));}
