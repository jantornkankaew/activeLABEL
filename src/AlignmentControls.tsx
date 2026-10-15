import {AlignLeft,AlignCenter,AlignRight,AlignVerticalJustifyStart,AlignVerticalJustifyCenter,AlignVerticalJustifyEnd} from 'lucide-react';
import type {Alignment} from './alignment';

export function AlignmentControls({disabled,onAlign}:{disabled?:boolean;onAlign:(alignment:Alignment)=>void}){
 return <div className="alignment-controls">
  <h4>Align to label</h4>
  <div className="alignment-grid">
   <div className="alignment-field">
    <small>Horizontal</small>
    <div className="quick-btn-group alignment-group" aria-label="Horizontal alignment">
     {([[AlignLeft,'left','Align left'],[AlignCenter,'h-center','Align horizontal center'],[AlignRight,'right','Align right']] as const).map(([Icon,value,label])=><button key={value} type="button" aria-label={label} title={label} disabled={disabled} onClick={()=>onAlign(value)}><Icon size={14}/></button>)}
    </div>
   </div>
   <div className="alignment-field">
    <small>Vertical</small>
    <div className="quick-btn-group alignment-group" aria-label="Vertical alignment">
     {([[AlignVerticalJustifyStart,'top','Align top'],[AlignVerticalJustifyCenter,'v-center','Align vertical center'],[AlignVerticalJustifyEnd,'bottom','Align bottom']] as const).map(([Icon,value,label])=><button key={value} type="button" aria-label={label} title={label} disabled={disabled} onClick={()=>onAlign(value)}><Icon size={14}/></button>)}
    </div>
   </div>
  </div>
 </div>;
}
