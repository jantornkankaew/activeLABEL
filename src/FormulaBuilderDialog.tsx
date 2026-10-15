import {useState, useEffect, useMemo} from 'react';
import {
  Plus,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Play,
  Sparkles,
  Zap,
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  Wand2,
  Layers,
  Calendar,
  Clock,
  Hash,
  Tag,
  Type,
  GitBranch,
} from 'lucide-react';
import type {LabelVariable} from './core';
import {
  evaluateFormula,
  type LabelFormula,
  type FormulaBlock,
  type FunctionCategory,
} from './formulaEngine';
import './formula.css';

type WizardType = 'expiry' | 'current_date' | 'seq_counter' | 'lot_code' | 'text_format' | 'condition_if';

const WIZARD_CATEGORIES: {
  type: WizardType;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  accentColor: string;
  example: string;
}[] = [
  {
    type: 'expiry',
    title: 'วันหมดอายุ / วันที่ล่วงหน้า',
    subtitle: 'คำนวณวันหมดอายุอัตโนมัติจากวันปัจจุบัน เช่น นับไปอีก 30 วัน หรือ 1 ปี',
    badge: 'ยอดนิยม ⚡',
    icon: Calendar,
    accentColor: '#3b82f6',
    example: 'EXP: 14/11/2026',
  },
  {
    type: 'current_date',
    title: 'วันที่ผลิต / วันที่ปัจจุบัน',
    subtitle: 'ใส่วันที่ผลิต หรือวันและเวลาปัจจุบันในรูปแบบที่ต้องการ',
    badge: 'ใช้บ่อย 🗓️',
    icon: Clock,
    accentColor: '#10b981',
    example: 'MFG: 15/10/2026',
  },
  {
    type: 'seq_counter',
    title: 'เลขอัตโนมัติ / ลำดับรัน (Counter)',
    subtitle: 'สร้างเลขรันต่อเนื่อง เช่น 0001, 0002 พร้อมเติมเลขศูนย์ข้างหน้า',
    badge: 'อัตโนมัติ 🔢',
    icon: Hash,
    accentColor: '#8b5cf6',
    example: 'SEQ-0001',
  },
  {
    type: 'lot_code',
    title: 'รหัส Lot / ผสมรหัสสินค้ากับวันที่',
    subtitle: 'รวมคำนำหน้า วันที่ปัจจุบัน และรหัสต่อท้าย เข้าด้วยกันเป็นรหัส Lot',
    badge: 'คลังสินค้า 🏷️',
    icon: Tag,
    accentColor: '#f59e0b',
    example: 'LOT-20261015-01',
  },
  {
    type: 'text_format',
    title: 'จัดการข้อความ (ตัวพิมพ์ใหญ่ / เติม 0)',
    subtitle: 'แปลงข้อความจากตัวแปรเป็นตัวพิมพ์ใหญ่ เติม 0 ด้านหน้า หรือตัดข้อความ',
    badge: 'ข้อความ 🔤',
    icon: Type,
    accentColor: '#ec4899',
    example: 'ABC COMPANY',
  },
  {
    type: 'condition_if',
    title: 'เงื่อนไข (ถ้า... ให้แสดง...)',
    subtitle: 'ตรวจสอบค่าจากตัวแปร หากตรงตามเงื่อนไขให้แสดงข้อความที่กำหนด',
    badge: 'เงื่อนไข 🔀',
    icon: GitBranch,
    accentColor: '#06b6d4',
    example: 'พร้อมจำหน่าย / สินค้าหมด',
  },
];

type PresetTemplate = {
  id: string;
  label: string;
  icon: string;
  description: string;
  blocks: FormulaBlock[];
};

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'exp_30_days',
    label: 'วันหมดอายุ (+30 วัน)',
    icon: '⚡',
    description: 'คำนวณวันหมดอายุถัดไปอีก 30 วันนับจากวันนี้',
    blocks: [
      {
        id: 'blk_add30',
        category: 'datetime',
        functionName: 'add_days',
        params: {days: 30, format: 'DD/MM/YYYY'},
      },
    ],
  },
  {
    id: 'exp_1_year',
    label: 'วันหมดอายุ (+1 ปี)',
    icon: '⚡',
    description: 'คำนวณวันหมดอายุถัดไปอีก 1 ปี',
    blocks: [
      {
        id: 'blk_add1y',
        category: 'datetime',
        functionName: 'add_years',
        params: {years: 1, format: 'DD/MM/YYYY'},
      },
    ],
  },
  {
    id: 'lot_today',
    label: 'Lot วันนี้ (LOT-YYYYMMDD)',
    icon: '⚡',
    description: 'สร้างรหัส Lot ตามวันที่ปัจจุบัน',
    blocks: [
      {
        id: 'blk_now',
        category: 'datetime',
        functionName: 'now',
        params: {format: 'YYYYMMDD'},
      },
      {
        id: 'blk_prefix',
        category: 'string',
        functionName: 'concat',
        params: {prefix: 'LOT-', append: ''},
      },
    ],
  },
  {
    id: 'seq_counter',
    label: 'รหัสลำดับ (SEQ-0001)',
    icon: '⚡',
    description: 'รันตัวเลขอัตโนมัติพร้อมเติมเลขศูนย์ 4 หลัก',
    blocks: [
      {
        id: 'blk_counter',
        category: 'numeric',
        functionName: 'counter',
        params: {start: 1, padZeros: 4},
      },
      {
        id: 'blk_seq_prefix',
        category: 'string',
        functionName: 'concat',
        params: {prefix: 'SEQ-', append: ''},
      },
    ],
  },
  {
    id: 'uppercase_text',
    label: 'แปลงพิมพ์ใหญ่ (UPPERCASE)',
    icon: '⚡',
    description: 'แปลงข้อความทั้งหมดเป็นตัวพิมพ์ใหญ่',
    blocks: [
      {
        id: 'blk_upper',
        category: 'string',
        functionName: 'uppercase',
        params: {},
      },
    ],
  },
];

const CATEGORY_ITEMS: {
  category: FunctionCategory;
  label: string;
  icon: string;
  color: string;
  items: {
    name: string;
    label: string;
    desc: string;
    defaultParams: Record<string, any>;
  }[];
}[] = [
  {
    category: 'datetime',
    label: '📅 วันที่และเวลา',
    icon: '📅',
    color: '#3b82f6',
    items: [
      {
        name: 'now',
        label: 'วันที่ปัจจุบัน (NOW)',
        desc: 'ดึงวันและเวลาปัจจุบัน',
        defaultParams: {format: 'DD/MM/YYYY'},
      },
      {
        name: 'add_days',
        label: 'บวก/ลบวัน (Add Days - วันหมดอายุ)',
        desc: 'บวกหรือลบวันสำหรับคิดวันหมดอายุ',
        defaultParams: {days: 30, format: 'DD/MM/YYYY'},
      },
      {
        name: 'add_months',
        label: 'บวก/ลบเดือน (+Months)',
        desc: 'บวกหรือลบจำนวนเดือน',
        defaultParams: {months: 1, format: 'DD/MM/YYYY'},
      },
      {
        name: 'add_years',
        label: 'บวก/ลบปี (+Years)',
        desc: 'บวกหรือลบจำนวนปี',
        defaultParams: {years: 1, format: 'DD/MM/YYYY'},
      },
      {
        name: 'format_date',
        label: 'จัดรูปแบบวันที่ (Format)',
        desc: 'เปลี่ยนรูปแบบการแสดงผลวันที่',
        defaultParams: {format: 'DD/MM/YYYY'},
      },
      {
        name: 'date_part',
        label: 'ดึงเฉพาะส่วนวันที่ (Year/Month/Day)',
        desc: 'ดึงเฉพาะปี เดือน หรือวัน',
        defaultParams: {part: 'YYYY'},
      },
    ],
  },
  {
    category: 'string',
    label: '🔤 จัดการข้อความ',
    icon: '🔤',
    color: '#10b981',
    items: [
      {
        name: 'concat',
        label: 'ต่อข้อความ / เติมคำนำหน้า-ต่อท้าย',
        desc: 'รวมข้อความหรือดึงค่าจากตัวแปร',
        defaultParams: {prefix: '', append: ''},
      },
      {
        name: 'uppercase',
        label: 'แปลงเป็นพิมพ์ใหญ่ (UPPERCASE)',
        desc: 'แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์ใหญ่',
        defaultParams: {},
      },
      {
        name: 'lowercase',
        label: 'แปลงเป็นพิมพ์เล็ก (lowercase)',
        desc: 'แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์เล็ก',
        defaultParams: {},
      },
      {
        name: 'pad_start',
        label: 'เติมศูนย์/ตัวอักษรด้านหน้า (Pad Start)',
        desc: 'เติมเลข 0 ให้ครบตามจำนวนหลักที่กำหนด เช่น 0001',
        defaultParams: {length: 4, char: '0'},
      },
      {
        name: 'pad_end',
        label: 'เติมตัวอักษรด้านหลัง (Pad End)',
        desc: 'เติมตัวอักษรด้านหลังให้ครบจำนวน',
        defaultParams: {length: 8, char: ' '},
      },
      {
        name: 'substring',
        label: 'ตัดข้อความบางส่วน (Substring)',
        desc: 'เลือกตัดเอาเฉพาะช่วงตัวอักษรที่ต้องการ',
        defaultParams: {start: 0, length: 5},
      },
      {
        name: 'replace',
        label: 'แทนที่คำ (Replace)',
        desc: 'ค้นหาคำเดิมแล้วแทนที่ด้วยคำใหม่',
        defaultParams: {search: '', replace: ''},
      },
      {
        name: 'trim',
        label: 'ตัดช่องว่างหน้าหลัง (Trim)',
        desc: 'ลบช่องว่างส่วนเกินที่หัวและท้ายข้อความ',
        defaultParams: {},
      },
    ],
  },
  {
    category: 'numeric',
    label: '🔢 ตัวเลขและลำดับ',
    icon: '🔢',
    color: '#8b5cf6',
    items: [
      {
        name: 'counter',
        label: 'รันลำดับตัวเลข (Auto Counter)',
        desc: 'สร้างตัวเลขนับลำดับต่อเนื่องอัตโนมัติ',
        defaultParams: {start: 1, step: 1, padZeros: 4},
      },
      {
        name: 'math_op',
        label: 'คำนวณเลข (+, -, *, /)',
        desc: 'บวก ลบ คูณ หรือหารตัวเลข',
        defaultParams: {op: 'add', value: 10},
      },
      {
        name: 'round',
        label: 'ปัดทศนิยม (Round Decimals)',
        desc: 'ปัดเศษทศนิยมตามจำนวนตำแหน่ง',
        defaultParams: {decimals: 2},
      },
    ],
  },
  {
    category: 'if',
    label: '🔀 เงื่อนไข IF',
    icon: '🔀',
    color: '#f59e0b',
    items: [
      {
        name: 'if_else',
        label: 'ถ้า... ให้แสดง... (IF / ELSE)',
        desc: 'ตรวจสอบเงื่อนไข หากเป็นจริงให้แสดงค่า A ไม่จริงให้แสดงค่า B',
        defaultParams: {
          operator: 'is_not_empty',
          target: '',
          thenValue: 'APPROVED',
          elseValue: 'PENDING',
        },
      },
    ],
  },
  {
    category: 'loop',
    label: '🔁 ทำซ้ำ Loop',
    icon: '🔁',
    color: '#ec4899',
    items: [
      {
        name: 'repeat',
        label: 'ทำซ้ำข้อความ (Repeat)',
        desc: 'ทำซ้ำข้อความหรือสัญลักษณ์ตามจำนวนครั้งที่กำหนด',
        defaultParams: {text: '*', times: 5, separator: ''},
      },
    ],
  },
];

export function FormulaBuilderDialog({
  formulas,
  variables,
  initialFormulaId,
  onSave,
  onClose,
}: {
  formulas: LabelFormula[];
  variables: LabelVariable[];
  initialFormulaId?: string;
  onSave: (formulas: LabelFormula[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<LabelFormula[]>(() => {
    if (formulas && formulas.length > 0) {
      return structuredClone(formulas);
    }
    return [
      {
        id: 'formula_1',
        name: 'วันหมดอายุ (+30 วัน)',
        blocks: [
          {
            id: 'b1',
            category: 'datetime',
            functionName: 'add_days',
            params: {days: 30, format: 'DD/MM/YYYY'},
          },
        ],
      },
    ];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    if (initialFormulaId && list.some((f) => f.id === initialFormulaId)) {
      return initialFormulaId;
    }
    return list[0]?.id || 'formula_1';
  });

  // UI Modes: 'wizard' (Step-by-step easy) or 'lego' (Advanced block editor)
  const [viewMode, setViewMode] = useState<'wizard' | 'lego'>('wizard');

  // Wizard States
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [wizardType, setWizardType] = useState<WizardType>('expiry');

  // Wizard Questions State
  // 1. Expiry Date
  const [expAmount, setExpAmount] = useState<number>(30);
  const [expUnit, setExpUnit] = useState<'days' | 'months' | 'years'>('days');
  const [expFormat, setExpFormat] = useState<string>('DD/MM/YYYY');
  const [expPrefix, setExpPrefix] = useState<string>('EXP: ');
  const [expSuffix, setExpSuffix] = useState<string>('');

  // 2. Current Date
  const [curFormat, setCurFormat] = useState<string>('DD/MM/YYYY');
  const [curPrefix, setCurPrefix] = useState<string>('MFG: ');
  const [curSuffix, setCurSuffix] = useState<string>('');

  // 3. Counter
  const [cntStart, setCntStart] = useState<number>(1);
  const [cntPad, setCntPad] = useState<number>(4);
  const [cntPrefix, setCntPrefix] = useState<string>('SEQ-');
  const [cntSuffix, setCntSuffix] = useState<string>('');

  // 4. Lot Code
  const [lotPrefix, setLotPrefix] = useState<string>('LOT-');
  const [lotDateFormat, setLotDateFormat] = useState<string>('YYYYMMDD');
  const [lotSuffix, setLotSuffix] = useState<string>('-01');

  // 5. Text Format
  const [txtSourceType, setTxtSourceType] = useState<'variable' | 'custom'>('variable');
  const [txtVariable, setTxtVariable] = useState<string>(variables[0]?.name || '');
  const [txtCustom, setTxtCustom] = useState<string>('sample text');
  const [txtAction, setTxtAction] = useState<'uppercase' | 'lowercase' | 'pad_zero' | 'slice'>('uppercase');
  const [txtPadLen, setTxtPadLen] = useState<number>(6);
  const [txtSliceLen, setTxtSliceLen] = useState<number>(4);

  // 6. Condition IF
  const [ifVar, setIfVar] = useState<string>(variables[0]?.name || '');
  const [ifOp, setIfOp] = useState<string>('is_not_empty');
  const [ifTarget, setIfTarget] = useState<string>('');
  const [ifThen, setIfThen] = useState<string>('พร้อมจำหน่าย');
  const [ifElse, setIfElse] = useState<string>('สินค้าหมด');

  // LEGO palette active tab
  const [activeCategory, setActiveCategory] = useState<FunctionCategory>('datetime');

  const activeFormula = list.find((f) => f.id === activeId) || list[0];
  const [simulatedResult, setSimulatedResult] = useState('');

  // Helper: Synthesize blocks from wizard answers
  const synthesizedWizardBlocks = useMemo<FormulaBlock[]>(() => {
    const timestamp = Date.now();
    switch (wizardType) {
      case 'expiry': {
        const blocks: FormulaBlock[] = [];
        let func = 'add_days';
        let paramKey = 'days';
        if (expUnit === 'months') {
          func = 'add_months';
          paramKey = 'months';
        } else if (expUnit === 'years') {
          func = 'add_years';
          paramKey = 'years';
        }
        blocks.push({
          id: `wiz_${timestamp}_1`,
          category: 'datetime',
          functionName: func,
          params: {[paramKey]: expAmount, format: expFormat},
        });
        if (expPrefix || expSuffix) {
          blocks.push({
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'concat',
            params: {prefix: expPrefix, append: expSuffix},
          });
        }
        return blocks;
      }

      case 'current_date': {
        const blocks: FormulaBlock[] = [
          {
            id: `wiz_${timestamp}_1`,
            category: 'datetime',
            functionName: 'now',
            params: {format: curFormat},
          },
        ];
        if (curPrefix || curSuffix) {
          blocks.push({
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'concat',
            params: {prefix: curPrefix, append: curSuffix},
          });
        }
        return blocks;
      }

      case 'seq_counter': {
        const blocks: FormulaBlock[] = [
          {
            id: `wiz_${timestamp}_1`,
            category: 'numeric',
            functionName: 'counter',
            params: {start: cntStart, padZeros: cntPad},
          },
        ];
        if (cntPrefix || cntSuffix) {
          blocks.push({
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'concat',
            params: {prefix: cntPrefix, append: cntSuffix},
          });
        }
        return blocks;
      }

      case 'lot_code': {
        return [
          {
            id: `wiz_${timestamp}_1`,
            category: 'datetime',
            functionName: 'now',
            params: {format: lotDateFormat},
          },
          {
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'concat',
            params: {prefix: lotPrefix, append: lotSuffix},
          },
        ];
      }

      case 'text_format': {
        const blocks: FormulaBlock[] = [];
        const sourceVal = txtSourceType === 'variable' && txtVariable ? `{{${txtVariable}}}` : txtCustom;
        blocks.push({
          id: `wiz_${timestamp}_1`,
          category: 'string',
          functionName: 'concat',
          params: {prefix: sourceVal, append: ''},
        });

        if (txtAction === 'uppercase') {
          blocks.push({
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'uppercase',
            params: {},
          });
        } else if (txtAction === 'lowercase') {
          blocks.push({
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'lowercase',
            params: {},
          });
        } else if (txtAction === 'pad_zero') {
          blocks.push({
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'pad_start',
            params: {length: txtPadLen, char: '0'},
          });
        } else if (txtAction === 'slice') {
          blocks.push({
            id: `wiz_${timestamp}_2`,
            category: 'string',
            functionName: 'substring',
            params: {start: 0, length: txtSliceLen},
          });
        }
        return blocks;
      }

      case 'condition_if': {
        const sourceVal = ifVar ? `{{${ifVar}}}` : '';
        return [
          {
            id: `wiz_${timestamp}_1`,
            category: 'if',
            functionName: 'if_else',
            params: {
              source: sourceVal,
              operator: ifOp,
              target: ifTarget,
              thenValue: ifThen,
              elseValue: ifElse,
            },
          },
        ];
      }
    }
  }, [
    wizardType,
    expAmount,
    expUnit,
    expFormat,
    expPrefix,
    expSuffix,
    curFormat,
    curPrefix,
    curSuffix,
    cntStart,
    cntPad,
    cntPrefix,
    cntSuffix,
    lotPrefix,
    lotDateFormat,
    lotSuffix,
    txtSourceType,
    txtVariable,
    txtCustom,
    txtAction,
    txtPadLen,
    txtSliceLen,
    ifVar,
    ifOp,
    ifTarget,
    ifThen,
    ifElse,
  ]);

  // Live simulation evaluation
  useEffect(() => {
    const varMap: Record<string, string> = {};
    for (const v of variables) {
      varMap[v.name] = v.value || `[${v.label || v.name}]`;
    }

    try {
      if (viewMode === 'wizard' && wizardStep === 2) {
        // Simulate based on wizard blocks
        const tempFormula: LabelFormula = {
          id: 'temp',
          name: 'temp',
          blocks: synthesizedWizardBlocks,
        };
        const res = evaluateFormula(tempFormula, varMap);
        setSimulatedResult(res || '(ไม่มีข้อมูล)');
      } else if (activeFormula) {
        const res = evaluateFormula(activeFormula, varMap);
        setSimulatedResult(res || '(ไม่มีข้อมูล)');
      } else {
        setSimulatedResult('');
      }
    } catch {
      setSimulatedResult('(เกิดข้อผิดพลาดในการคำนวณ)');
    }
  }, [viewMode, wizardStep, synthesizedWizardBlocks, activeFormula, variables]);

  function updateActiveFormula(changes: Partial<LabelFormula>) {
    setList((prev) =>
      prev.map((f) => (f.id === activeId ? {...f, ...changes} : f))
    );
  }

  function addFormula() {
    const newId = `formula_${list.length + 1}`;
    const newFormula: LabelFormula = {
      id: newId,
      name: `สูตรที่ ${list.length + 1}`,
      blocks: [
        {
          id: `blk_${Date.now()}`,
          category: 'datetime',
          functionName: 'add_days',
          params: {days: 30, format: 'DD/MM/YYYY'},
        },
      ],
    };
    setList((prev) => [...prev, newFormula]);
    setActiveId(newId);
    // When adding, switch to wizard step 1 for quick intuitive creation
    setViewMode('wizard');
    setWizardStep(1);
  }

  function removeFormula(idToRemove: string) {
    if (list.length <= 1) return;
    const remaining = list.filter((f) => f.id !== idToRemove);
    setList(remaining);
    if (activeId === idToRemove) {
      setActiveId(remaining[0].id);
    }
  }

  function applyPreset(preset: PresetTemplate) {
    const freshBlocks: FormulaBlock[] = preset.blocks.map((b, idx) => ({
      ...structuredClone(b),
      id: `blk_${Date.now()}_${idx}`,
    }));
    updateActiveFormula({
      name: preset.label,
      blocks: freshBlocks,
    });
  }

  function applyWizardToFormula() {
    // Generate formula name based on wizard type
    let name = 'สูตรคำนวณ';
    if (wizardType === 'expiry') {
      name = `วันหมดอายุ (+${expAmount} ${expUnit === 'days' ? 'วัน' : expUnit === 'months' ? 'เดือน' : 'ปี'})`;
    } else if (wizardType === 'current_date') {
      name = 'วันที่ปัจจุบัน (NOW)';
    } else if (wizardType === 'seq_counter') {
      name = `รหัสลำดับ (${cntPrefix || ''}000${cntStart})`;
    } else if (wizardType === 'lot_code') {
      name = `รหัส Lot (${lotPrefix}YYYYMMDD)`;
    } else if (wizardType === 'text_format') {
      name = `จัดการข้อความ (${txtAction})`;
    } else if (wizardType === 'condition_if') {
      name = 'เงื่อนไข (IF/ELSE)';
    }

    const updated = list.map((f) =>
      f.id === activeId ? {...f, name, blocks: synthesizedWizardBlocks} : f
    );
    setList(updated);
    onSave(updated);
    onClose();
  }

  function applyWizardAndOpenLego() {
    updateActiveFormula({
      blocks: synthesizedWizardBlocks,
    });
    setViewMode('lego');
  }

  function addBlock(cat: FunctionCategory, funcName: string, defaultParams: Record<string, any>) {
    if (!activeFormula) return;
    const newBlock: FormulaBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: cat,
      functionName: funcName,
      params: structuredClone(defaultParams),
    };
    updateActiveFormula({
      blocks: [...activeFormula.blocks, newBlock],
    });
  }

  function updateBlock(blockId: string, paramChanges: Record<string, any>) {
    if (!activeFormula) return;
    updateActiveFormula({
      blocks: activeFormula.blocks.map((b) =>
        b.id === blockId ? {...b, params: {...b.params, ...paramChanges}} : b
      ),
    });
  }

  function removeBlock(blockId: string) {
    if (!activeFormula) return;
    updateActiveFormula({
      blocks: activeFormula.blocks.filter((b) => b.id !== blockId),
    });
  }

  function moveBlock(blockId: string, dir: -1 | 1) {
    if (!activeFormula) return;
    const idx = activeFormula.blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= activeFormula.blocks.length) return;

    const next = [...activeFormula.blocks];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    updateActiveFormula({blocks: next});
  }

  function handleSave() {
    onSave(list);
  }

  const selectedCategoryDef = CATEGORY_ITEMS.find((c) => c.category === activeCategory) || CATEGORY_ITEMS[0];

  return (
    <div className="modal-backdrop">
      <div className="modal formula-modal" role="dialog" aria-modal="true" aria-labelledby="formula-title">
        {/* Header */}
        <div className="formula-heading">
          <div className="formula-heading-text">
            <h2 id="formula-title">✨ ตัวสร้างสูตร Formula</h2>
            <p>สร้างสูตรคำนวณวันหมดอายุ เลขลำดับรัน และข้อความอัตโนมัติได้อย่างง่ายดาย</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="formula-mode-switch">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'wizard' ? 'active' : ''}`}
              onClick={() => setViewMode('wizard')}
            >
              <Wand2 size={14} />
              <span>ตัวช่วยถาม-ตอบ (Wizard)</span>
              <span className="mode-badge-rec">แนะนำ</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'lego' ? 'active' : ''}`}
              onClick={() => setViewMode('lego')}
            >
              <Layers size={14} />
              <span>ต่อบล็อก LEGO (โหมดขั้นสูง)</span>
            </button>
          </div>

          <button type="button" className="formula-close-btn" aria-label="Close dialog" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Formula Tabs Row */}
        <div className="formula-subnav-row">
          <div className="formula-tabs-scroll">
            {list.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`formula-tab-chip ${f.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(f.id)}
              >
                🧩 {f.name || 'Untitled'}
                <span className="formula-tab-count">({f.blocks.length})</span>
              </button>
            ))}
            <button type="button" className="formula-tab-add" onClick={addFormula} title="สร้างสูตรใหม่">
              <Plus size={14} /> เพิ่มสูตรใหม่
            </button>
          </div>

          <div className="formula-name-actions">
            <label className="formula-name-label">
              <span>ชื่อสูตร:</span>
              <input
                type="text"
                className="formula-name-field"
                value={activeFormula?.name ?? ''}
                placeholder="ตั้งชื่อสูตร..."
                onChange={(e) => updateActiveFormula({name: e.target.value})}
              />
            </label>
            {list.length > 1 && (
              <button
                type="button"
                className="formula-delete-btn"
                title="ลบสูตรนี้"
                onClick={() => removeFormula(activeId)}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ---------------- WIZARD MODE ---------------- */}
        {viewMode === 'wizard' && (
          <div className="wizard-container">
            {/* Step 1: Select Purpose */}
            {wizardStep === 1 && (
              <div className="wizard-step-1">
                <div className="wizard-banner-prompt">
                  <h3>🎯 ขั้นตอนที่ 1: คุณต้องการสร้างสูตรเพื่อทำอะไร?</h3>
                  <p>คลิกเลือกประเภทที่ต้องการ แล้วระบบจะถามคำถามสั้นๆ เพียง 1-2 ข้อเพื่อสร้างสูตรให้ทันที</p>
                </div>

                <div className="wizard-cards-grid">
                  {WIZARD_CATEGORIES.map((cat) => {
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.type}
                        type="button"
                        className="wizard-purpose-card"
                        onClick={() => {
                          setWizardType(cat.type);
                          setWizardStep(2);
                        }}
                      >
                        <div className="card-top-row">
                          <div className="card-icon-circle" style={{backgroundColor: `${cat.accentColor}18`, color: cat.accentColor}}>
                            <IconComp size={24} />
                          </div>
                          <span className="card-badge" style={{color: cat.accentColor, borderColor: `${cat.accentColor}40`}}>
                            {cat.badge}
                          </span>
                        </div>
                        <h4 className="card-title">{cat.title}</h4>
                        <p className="card-subtitle">{cat.subtitle}</p>
                        <div className="card-example-pill">
                          <span className="example-label">ตัวอย่าง:</span>
                          <strong>{cat.example}</strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Answer 1-2 Simple Questions */}
            {wizardStep === 2 && (
              <div className="wizard-step-2">
                {/* Step navigation & current category header */}
                <div className="step-2-header-bar">
                  <button type="button" className="btn-back-step" onClick={() => setWizardStep(1)}>
                    <ArrowLeft size={15} /> เลือกประเภทอื่น
                  </button>
                  <div className="current-category-pill">
                    <span>ประเภทที่เลือก:</span>
                    <strong>{WIZARD_CATEGORIES.find((c) => c.type === wizardType)?.title}</strong>
                  </div>
                </div>

                <div className="step-2-content-layout">
                  {/* Left Column: Easy Question Form */}
                  <div className="step-2-questions-card">
                    {/* Expiry Date Questions */}
                    {wizardType === 'expiry' && (
                      <div className="question-group">
                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">1</span> ต้องการนับเพิ่มไปอีกเท่าไหร่?
                          </label>
                          <div className="quick-chip-row">
                            {[
                              {amt: 7, u: 'days', label: '+7 วัน'},
                              {amt: 14, u: 'days', label: '+14 วัน'},
                              {amt: 30, u: 'days', label: '+30 วัน (1 เดือน)'},
                              {amt: 60, u: 'days', label: '+60 วัน'},
                              {amt: 90, u: 'days', label: '+90 วัน'},
                              {amt: 1, u: 'years', label: '+1 ปี'},
                              {amt: 2, u: 'years', label: '+2 ปี'},
                            ].map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className={`quick-choice-chip ${expAmount === item.amt && expUnit === item.u ? 'selected' : ''}`}
                                onClick={() => {
                                  setExpAmount(item.amt);
                                  setExpUnit(item.u as any);
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                          <div className="custom-input-row">
                            <span className="custom-label">หรือกำหนดตัวเลขเอง:</span>
                            <input
                              type="number"
                              className="custom-num-input"
                              value={expAmount}
                              min={1}
                              onChange={(e) => setExpAmount(Number(e.target.value) || 1)}
                            />
                            <select
                              className="custom-select"
                              value={expUnit}
                              onChange={(e) => setExpUnit(e.target.value as any)}
                            >
                              <option value="days">วัน (Days)</option>
                              <option value="months">เดือน (Months)</option>
                              <option value="years">ปี (Years)</option>
                            </select>
                          </div>
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">2</span> แสดงผลในรูปแบบวันที่แบบไหน?
                          </label>
                          <div className="quick-chip-row">
                            {[
                              {fmt: 'DD/MM/YYYY', label: '15/10/2026 (วัน/เดือน/ปี)'},
                              {fmt: 'YYYY-MM-DD', label: '2026-10-15 (ปี-เดือน-วัน)'},
                              {fmt: 'YYYYMMDD', label: '20261015 (ติดกัน)'},
                              {fmt: 'DD-MM-YYYY', label: '15-10-2026'},
                              {fmt: 'DD/MM/YY', label: '15/10/26 (ปี 2 หลัก)'},
                            ].map((item) => (
                              <button
                                key={item.fmt}
                                type="button"
                                className={`quick-choice-chip ${expFormat === item.fmt ? 'selected' : ''}`}
                                onClick={() => setExpFormat(item.fmt)}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">3</span> ข้อความนำหน้า (ถ้ามี)
                          </label>
                          <div className="prefix-inputs-row">
                            <input
                              type="text"
                              className="custom-text-input"
                              value={expPrefix}
                              placeholder="เช่น EXP: หรือ ควรบริโภคก่อน: "
                              onChange={(e) => setExpPrefix(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Date Questions */}
                    {wizardType === 'current_date' && (
                      <div className="question-group">
                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">1</span> รูปแบบวันที่ที่ต้องการแสดง:
                          </label>
                          <div className="quick-chip-row">
                            {[
                              {fmt: 'DD/MM/YYYY', label: '15/10/2026 (DD/MM/YYYY)'},
                              {fmt: 'YYYY-MM-DD', label: '2026-10-15 (YYYY-MM-DD)'},
                              {fmt: 'YYYYMMDD', label: '20261015 (YYYYMMDD)'},
                              {fmt: 'DD/MM/YY', label: '15/10/26 (DD/MM/YY)'},
                            ].map((item) => (
                              <button
                                key={item.fmt}
                                type="button"
                                className={`quick-choice-chip ${curFormat === item.fmt ? 'selected' : ''}`}
                                onClick={() => setCurFormat(item.fmt)}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">2</span> ข้อความนำหน้า:
                          </label>
                          <div className="prefix-inputs-row">
                            <input
                              type="text"
                              className="custom-text-input"
                              value={curPrefix}
                              placeholder="เช่น MFG: หรือ วันที่ผลิต: "
                              onChange={(e) => setCurPrefix(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sequence Counter Questions */}
                    {wizardType === 'seq_counter' && (
                      <div className="question-group">
                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">1</span> เริ่มต้นนับจากเลขอะไร?
                          </label>
                          <div className="custom-input-row">
                            <input
                              type="number"
                              className="custom-num-input"
                              value={cntStart}
                              min={1}
                              onChange={(e) => setCntStart(Number(e.target.value) || 1)}
                            />
                          </div>
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">2</span> ต้องการเติมเลขศูนย์นำหน้ากี่หลัก?
                          </label>
                          <div className="quick-chip-row">
                            {[
                              {pad: 4, label: '4 หลัก (0001)'},
                              {pad: 6, label: '6 หลัก (000001)'},
                              {pad: 8, label: '8 หลัก (00000001)'},
                              {pad: 0, label: 'ไม่เติมศูนย์ (1, 2, 3...)'},
                            ].map((item) => (
                              <button
                                key={item.pad}
                                type="button"
                                className={`quick-choice-chip ${cntPad === item.pad ? 'selected' : ''}`}
                                onClick={() => setCntPad(item.pad)}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">3</span> ข้อความนำหน้า:
                          </label>
                          <div className="prefix-inputs-row">
                            <input
                              type="text"
                              className="custom-text-input"
                              value={cntPrefix}
                              placeholder="เช่น SEQ- หรือ NO. "
                              onChange={(e) => setCntPrefix(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lot Code Questions */}
                    {wizardType === 'lot_code' && (
                      <div className="question-group">
                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">1</span> ข้อความนำหน้า (Prefix):
                          </label>
                          <input
                            type="text"
                            className="custom-text-input"
                            value={lotPrefix}
                            placeholder="เช่น LOT- หรือ BATCH-"
                            onChange={(e) => setLotPrefix(e.target.value)}
                          />
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">2</span> รูปแบบวันที่ในรหัส Lot:
                          </label>
                          <div className="quick-chip-row">
                            {[
                              {fmt: 'YYYYMMDD', label: '20261015 (YYYYMMDD)'},
                              {fmt: 'YYMMDD', label: '261015 (YYMMDD)'},
                              {fmt: 'DDMMYY', label: '151026 (DDMMYY)'},
                            ].map((item) => (
                              <button
                                key={item.fmt}
                                type="button"
                                className={`quick-choice-chip ${lotDateFormat === item.fmt ? 'selected' : ''}`}
                                onClick={() => setLotDateFormat(item.fmt)}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">3</span> รหัสต่อท้าย (Suffix):
                          </label>
                          <input
                            type="text"
                            className="custom-text-input"
                            value={lotSuffix}
                            placeholder="เช่น -01 หรือ -A"
                            onChange={(e) => setLotSuffix(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Text Formatting Questions */}
                    {wizardType === 'text_format' && (
                      <div className="question-group">
                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">1</span> ดึงข้อความมาจากไหน?
                          </label>
                          <div className="quick-chip-row">
                            <button
                              type="button"
                              className={`quick-choice-chip ${txtSourceType === 'variable' ? 'selected' : ''}`}
                              onClick={() => setTxtSourceType('variable')}
                            >
                              📦 จากตัวแปร (Variable)
                            </button>
                            <button
                              type="button"
                              className={`quick-choice-chip ${txtSourceType === 'custom' ? 'selected' : ''}`}
                              onClick={() => setTxtSourceType('custom')}
                            >
                              ✍️ กำหนดข้อความเอง
                            </button>
                          </div>

                          {txtSourceType === 'variable' ? (
                            <div className="custom-input-row" style={{marginTop: 8}}>
                              <span className="custom-label">เลือกตัวแปร:</span>
                              <select
                                className="custom-select"
                                value={txtVariable}
                                onChange={(e) => setTxtVariable(e.target.value)}
                              >
                                {variables.length === 0 && <option value="">(ยังไม่มีตัวแปร)</option>}
                                {variables.map((v) => (
                                  <option key={v.name} value={v.name}>
                                    {v.label || v.name} ({v.value})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="custom-input-row" style={{marginTop: 8}}>
                              <input
                                type="text"
                                className="custom-text-input"
                                value={txtCustom}
                                placeholder="พิมพ์ข้อความ..."
                                onChange={(e) => setTxtCustom(e.target.value)}
                              />
                            </div>
                          )}
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">2</span> ต้องการจัดรูปแบบอย่างไร?
                          </label>
                          <div className="quick-chip-row">
                            {[
                              {act: 'uppercase', label: '🔤 ตัวพิมพ์ใหญ่ (UPPERCASE)'},
                              {act: 'lowercase', label: '🔡 ตัวพิมพ์เล็ก (lowercase)'},
                              {act: 'pad_zero', label: '0️⃣ เติมเลข 0 ด้านหน้า'},
                              {act: 'slice', label: '✂️ ตัดเอาเฉพาะตัวแรกๆ'},
                            ].map((item) => (
                              <button
                                key={item.act}
                                type="button"
                                className={`quick-choice-chip ${txtAction === item.act ? 'selected' : ''}`}
                                onClick={() => setTxtAction(item.act as any)}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {txtAction === 'pad_zero' && (
                          <div className="question-item">
                            <label className="question-label">
                              <span className="q-num">3</span> เติมให้ครบกี่หลัก?
                            </label>
                            <input
                              type="number"
                              className="custom-num-input"
                              value={txtPadLen}
                              min={1}
                              max={20}
                              onChange={(e) => setTxtPadLen(Number(e.target.value) || 6)}
                            />
                          </div>
                        )}

                        {txtAction === 'slice' && (
                          <div className="question-item">
                            <label className="question-label">
                              <span className="q-num">3</span> ตัดเอาตัวอักษรกี่ตัวแรก?
                            </label>
                            <input
                              type="number"
                              className="custom-num-input"
                              value={txtSliceLen}
                              min={1}
                              max={50}
                              onChange={(e) => setTxtSliceLen(Number(e.target.value) || 4)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Condition IF Questions */}
                    {wizardType === 'condition_if' && (
                      <div className="question-group">
                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">1</span> ตรวจสอบข้อมูลจากตัวแปร:
                          </label>
                          <div className="custom-input-row">
                            <select
                              className="custom-select"
                              value={ifVar}
                              onChange={(e) => setIfVar(e.target.value)}
                            >
                              {variables.length === 0 && <option value="">(ไม่มีตัวแปร - กรุณาสร้างตัวแปรก่อน)</option>}
                              {variables.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.label || v.name}
                                </option>
                              ))}
                            </select>
                            <select
                              className="custom-select"
                              value={ifOp}
                              onChange={(e) => setIfOp(e.target.value)}
                            >
                              <option value="is_not_empty">มีค่า (ไม่ว่าง)</option>
                              <option value="is_empty">ไม่มีค่า (ว่างเปล่า)</option>
                              <option value="equals">มีค่าเท่ากับ (=)</option>
                              <option value="contains">มีคำว่า...</option>
                            </select>
                          </div>
                          {(ifOp === 'equals' || ifOp === 'contains') && (
                            <div className="custom-input-row" style={{marginTop: 8}}>
                              <span className="custom-label">ค่าที่เปรียบเทียบ:</span>
                              <input
                                type="text"
                                className="custom-text-input"
                                value={ifTarget}
                                placeholder="เช่น YES หรือ VIP"
                                onChange={(e) => setIfTarget(e.target.value)}
                              />
                            </div>
                          )}
                        </div>

                        <div className="question-item">
                          <label className="question-label">
                            <span className="q-num">2</span> กำหนดผลลัพธ์ที่จะแสดง:
                          </label>
                          <div className="custom-input-row" style={{marginBottom: 8}}>
                            <span className="custom-label" style={{color: '#059669', fontWeight: 600}}>
                              ✓ ถ้าเป็นจริง ให้แสดง:
                            </span>
                            <input
                              type="text"
                              className="custom-text-input"
                              value={ifThen}
                              onChange={(e) => setIfThen(e.target.value)}
                            />
                          </div>
                          <div className="custom-input-row">
                            <span className="custom-label" style={{color: '#dc2626', fontWeight: 600}}>
                              ✗ ถ้าไม่จริง ให้แสดง:
                            </span>
                            <input
                              type="text"
                              className="custom-text-input"
                              value={ifElse}
                              onChange={(e) => setIfElse(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Live Result Card & Big Action */}
                  <div className="step-2-summary-card">
                    <div className="summary-card-inner">
                      <div className="summary-card-header">
                        <CheckCircle2 size={18} color="#059669" />
                        <h4>ตัวอย่างผลลัพธ์ที่จะได้</h4>
                      </div>

                      <div className="summary-live-display">
                        <span className="live-badge-title">ผลลัพธ์ที่คำนวณได้ทันที (Live Result):</span>
                        <div className="live-output-box">
                          <strong>{simulatedResult || '—'}</strong>
                        </div>
                        <span className="live-badge-sub">ผลลัพธ์นี้จะแสดงบนฉลากของคุณโดยอัตโนมัติ</span>
                      </div>

                      <div className="summary-actions">
                        <button
                          type="button"
                          className="btn-wizard-apply"
                          onClick={applyWizardToFormula}
                        >
                          <Sparkles size={16} /> บันทึกและใช้สูตรนี้ทันที
                        </button>

                        <button
                          type="button"
                          className="btn-wizard-view-lego"
                          onClick={applyWizardAndOpenLego}
                        >
                          <Layers size={14} /> ดูบล็อก LEGO ที่สร้างให้
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- LEGO BLOCKS MODE (ADVANCED) ---------------- */}
        {viewMode === 'lego' && (
          <div className="lego-mode-container">
            {/* Quick Presets Bar */}
            <div className="formula-presets-bar">
              <span className="presets-label">
                <Zap size={13} fill="#f59e0b" color="#f59e0b" /> สูตรสำเร็จรูปยอดนิยม:
              </span>
              <div className="presets-pills">
                {PRESET_TEMPLATES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="preset-pill"
                    title={p.description}
                    onClick={() => applyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Simulation Banner */}
            <div className="formula-simulation-banner">
              <div className="sim-badge-label">
                <Play size={11} fill="#059669" color="#059669" />
                <span>ผลลัพธ์จำลองแบบเรียลไทม์ (Live Result):</span>
              </div>
              <div className="sim-badge-output">
                <strong>{simulatedResult || '—'}</strong>
              </div>
            </div>

            {/* Function Categories Palette */}
            <div className="formula-palette-section">
              <div className="category-tab-bar" role="tablist">
                {CATEGORY_ITEMS.map((cat) => (
                  <button
                    key={cat.category}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat.category}
                    className={`category-tab-btn ${activeCategory === cat.category ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.category)}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="category-functions-grid">
                {selectedCategoryDef.items.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className={`func-add-chip cat-${selectedCategoryDef.category}`}
                    title={item.desc}
                    onClick={() => addBlock(selectedCategoryDef.category, item.name, item.defaultParams)}
                  >
                    <Plus size={13} />
                    <span className="chip-name">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* LEGO Canvas Area */}
            <div className="formula-canvas-area">
              <div className="canvas-header-bar">
                <h4>ลำดับการทำงานของสูตร ({activeFormula?.blocks.length ?? 0} บล็อกต่อกัน)</h4>
                <span className="canvas-tip">ผลลัพธ์จะถูกส่งต่อจากบนลงล่างเหมือนตัวต่อเลโก้</span>
              </div>

              <div className="lego-blocks-scroll">
                {!activeFormula || activeFormula.blocks.length === 0 ? (
                  <div className="lego-empty-canvas">
                    <Sparkles size={36} color="#94a3b8" />
                    <h3>ยังไม่มีบล็อกฟังก์ชันในสูตรนี้</h3>
                    <p>คลิกเลือกฟังก์ชันจากแถบด้านบน หรือสลับไปใช้โหมดถาม-ตอบเพื่อสร้างสูตรอย่างง่าย</p>
                    <button
                      type="button"
                      className="btn-switch-wizard"
                      onClick={() => {
                        setViewMode('wizard');
                        setWizardStep(1);
                      }}
                    >
                      <Wand2 size={14} /> เปิดตัวช่วยถาม-ตอบ (Wizard)
                    </button>
                  </div>
                ) : (
                  activeFormula.blocks.map((block, index) => {
                    const isFirst = index === 0;
                    const isLast = index === activeFormula.blocks.length - 1;

                    return (
                      <div key={block.id} className="lego-step-wrapper">
                        {index > 0 && (
                          <div className="lego-connector">
                            <ArrowDown size={14} />
                            <span>นำผลลัพธ์ส่งต่อไปยัง...</span>
                          </div>
                        )}

                        <div className={`lego-block cat-${block.category}`}>
                          <div className="lego-block-header">
                            <div className="lego-block-title-row">
                              <span className="lego-step-num">ขั้นตอนที่ {index + 1}</span>
                              <span className={`lego-cat-pill cat-${block.category}`}>
                                {block.category === 'datetime' && '📅 วันที่'}
                                {block.category === 'string' && '🔤 ข้อความ'}
                                {block.category === 'numeric' && '🔢 ตัวเลข'}
                                {block.category === 'if' && '🔀 เงื่อนไข'}
                                {block.category === 'loop' && '🔁 ทำซ้ำ'}
                              </span>
                              <strong className="lego-func-title">
                                {block.functionName === 'now' && 'วันที่และเวลาปัจจุบัน (NOW)'}
                                {block.functionName === 'add_days' && 'บวก/ลบวัน (Add Days)'}
                                {block.functionName === 'add_months' && 'บวก/ลบเดือน (+Months)'}
                                {block.functionName === 'add_years' && 'บวก/ลบปี (+Years)'}
                                {block.functionName === 'format_date' && 'จัดรูปแบบวันที่ (Format)'}
                                {block.functionName === 'date_part' && 'ดึงส่วนวันที่ (Part)'}
                                {block.functionName === 'concat' && 'ต่อข้อความ / คำนำหน้า (Concat)'}
                                {block.functionName === 'pad_start' && 'เติมตัวอักษรด้านหน้า (Pad Start)'}
                                {block.functionName === 'pad_end' && 'เติมตัวอักษรด้านหลัง (Pad End)'}
                                {block.functionName === 'substring' && 'ตัดข้อความ (Substring)'}
                                {block.functionName === 'uppercase' && 'แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)'}
                                {block.functionName === 'lowercase' && 'แปลงเป็นตัวพิมพ์เล็ก (lowercase)'}
                                {block.functionName === 'replace' && 'แทนที่คำ (Replace)'}
                                {block.functionName === 'trim' && 'ตัดช่องว่างหน้าหลัง (Trim)'}
                                {block.functionName === 'counter' && 'รันลำดับตัวเลข (Auto Counter)'}
                                {block.functionName === 'math_op' && 'คำนวณคณิตศาสตร์ (+, -, *, /)'}
                                {block.functionName === 'round' && 'ปัดเศษทศนิยม (Round)'}
                                {block.functionName === 'if_else' && 'เงื่อนไข (IF / THEN / ELSE)'}
                                {block.functionName === 'repeat' && 'ทำซ้ำข้อความ (Repeat)'}
                              </strong>
                            </div>

                            <div className="lego-block-actions">
                              <button
                                type="button"
                                className="block-reorder-btn"
                                disabled={isFirst}
                                title="เลื่อนขึ้น"
                                onClick={() => moveBlock(block.id, -1)}
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                type="button"
                                className="block-reorder-btn"
                                disabled={isLast}
                                title="เลื่อนลง"
                                onClick={() => moveBlock(block.id, 1)}
                              >
                                <ChevronDown size={14} />
                              </button>
                              <button
                                type="button"
                                className="block-remove-btn"
                                title="ลบขั้นตอนนี้"
                                onClick={() => removeBlock(block.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="lego-block-body">
                            {/* now */}
                            {block.functionName === 'now' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">รูปแบบวันที่:</span>
                                <select
                                  className="lego-select"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY (เช่น 15/10/2026)</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD (เช่น 2026-10-15)</option>
                                  <option value="YYYYMMDD">YYYYMMDD (เช่น 20261015)</option>
                                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                                  <option value="DD/MM/YY">DD/MM/YY</option>
                                  <option value="HH:mm:ss">HH:mm:ss (เวลา)</option>
                                </select>
                              </div>
                            )}

                            {/* add_days */}
                            {block.functionName === 'add_days' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">บวกเพิ่ม:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.days ?? 30}
                                  onChange={(e) => updateBlock(block.id, {days: Number(e.target.value)})}
                                />
                                <span className="field-unit">วัน</span>
                                <span className="field-intro">รูปแบบวันที่:</span>
                                <select
                                  className="lego-select"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                  <option value="YYYYMMDD">YYYYMMDD</option>
                                  <option value="DD/MM/YY">DD/MM/YY</option>
                                </select>
                              </div>
                            )}

                            {/* add_months */}
                            {block.functionName === 'add_months' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">บวกเพิ่ม:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.months ?? 1}
                                  onChange={(e) => updateBlock(block.id, {months: Number(e.target.value)})}
                                />
                                <span className="field-unit">เดือน</span>
                                <span className="field-intro">รูปแบบวันที่:</span>
                                <select
                                  className="lego-select"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                  <option value="YYYYMMDD">YYYYMMDD</option>
                                </select>
                              </div>
                            )}

                            {/* add_years */}
                            {block.functionName === 'add_years' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">บวกเพิ่ม:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.years ?? 1}
                                  onChange={(e) => updateBlock(block.id, {years: Number(e.target.value)})}
                                />
                                <span className="field-unit">ปี</span>
                                <span className="field-intro">รูปแบบวันที่:</span>
                                <select
                                  className="lego-select"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                  <option value="YYYYMMDD">YYYYMMDD</option>
                                </select>
                              </div>
                            )}

                            {/* format_date */}
                            {block.functionName === 'format_date' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">แปลงเป็นรูปแบบ:</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  style={{width: 140}}
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                />
                              </div>
                            )}

                            {/* date_part */}
                            {block.functionName === 'date_part' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">ดึงเฉพาะส่วน:</span>
                                <select
                                  className="lego-select"
                                  value={block.params.part ?? 'YYYY'}
                                  onChange={(e) => updateBlock(block.id, {part: e.target.value})}
                                >
                                  <option value="YYYY">ปี 4 หลัก (YYYY)</option>
                                  <option value="YY">ปี 2 หลัก (YY)</option>
                                  <option value="MM">เดือน (MM)</option>
                                  <option value="DD">วัน (DD)</option>
                                </select>
                              </div>
                            )}

                            {/* concat */}
                            {block.functionName === 'concat' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">คำนำหน้า:</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  style={{width: 110}}
                                  placeholder="เช่น LOT-"
                                  value={block.params.prefix ?? ''}
                                  onChange={(e) => updateBlock(block.id, {prefix: e.target.value})}
                                />
                                <span className="field-intro">+ ค่าปัจจุบัน +</span>
                                <span className="field-intro">คำต่อท้าย:</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  style={{width: 110}}
                                  placeholder="เช่น -TH"
                                  value={block.params.append ?? ''}
                                  onChange={(e) => updateBlock(block.id, {append: e.target.value})}
                                />
                              </div>
                            )}

                            {/* pad_start */}
                            {block.functionName === 'pad_start' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">เติมตัวอักษร:</span>
                                <input
                                  type="text"
                                  className="lego-input-mini"
                                  value={block.params.char ?? '0'}
                                  onChange={(e) => updateBlock(block.id, {char: e.target.value})}
                                />
                                <span className="field-intro">ด้านหน้า ให้ครบ:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.length ?? 4}
                                  onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                                />
                                <span className="field-unit">หลัก</span>
                              </div>
                            )}

                            {/* pad_end */}
                            {block.functionName === 'pad_end' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">เติมตัวอักษร:</span>
                                <input
                                  type="text"
                                  className="lego-input-mini"
                                  value={block.params.char ?? ' '}
                                  onChange={(e) => updateBlock(block.id, {char: e.target.value})}
                                />
                                <span className="field-intro">ด้านหลัง ให้ครบ:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.length ?? 8}
                                  onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                                />
                                <span className="field-unit">หลัก</span>
                              </div>
                            )}

                            {/* substring */}
                            {block.functionName === 'substring' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">ตัดข้อความเริ่มจากตัวที่:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.start ?? 0}
                                  onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                                />
                                <span className="field-intro">ความยาว:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.length ?? 5}
                                  onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                                />
                                <span className="field-unit">ตัวอักษร</span>
                              </div>
                            )}

                            {/* uppercase / lowercase / trim */}
                            {(block.functionName === 'uppercase' ||
                              block.functionName === 'lowercase' ||
                              block.functionName === 'trim') && (
                              <div className="lego-sentence-line">
                                <span className="field-note">
                                  {block.functionName === 'uppercase' && '✓ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์ใหญ่'}
                                  {block.functionName === 'lowercase' && '✓ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์เล็ก'}
                                  {block.functionName === 'trim' && '✓ ตัดช่องว่างด้านหน้าและด้านหลังข้อความออก'}
                                </span>
                              </div>
                            )}

                            {/* replace */}
                            {block.functionName === 'replace' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">แทนที่คำว่า:</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  style={{width: 110}}
                                  value={block.params.search ?? ''}
                                  onChange={(e) => updateBlock(block.id, {search: e.target.value})}
                                />
                                <span className="field-intro">ด้วยคำว่า:</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  style={{width: 110}}
                                  value={block.params.replace ?? ''}
                                  onChange={(e) => updateBlock(block.id, {replace: e.target.value})}
                                />
                              </div>
                            )}

                            {/* counter */}
                            {block.functionName === 'counter' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">เริ่มต้นที่:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.start ?? 1}
                                  onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                                />
                                <span className="field-intro">เติมศูนย์ให้ครบ:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.padZeros ?? 4}
                                  onChange={(e) => updateBlock(block.id, {padZeros: Number(e.target.value)})}
                                />
                                <span className="field-unit">หลัก</span>
                              </div>
                            )}

                            {/* math_op */}
                            {block.functionName === 'math_op' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">ดำเนินการ:</span>
                                <select
                                  className="lego-select"
                                  value={block.params.op ?? 'add'}
                                  onChange={(e) => updateBlock(block.id, {op: e.target.value})}
                                >
                                  <option value="add">บวก (+)</option>
                                  <option value="subtract">ลบ (-)</option>
                                  <option value="multiply">คูณ (×)</option>
                                  <option value="divide">หาร (÷)</option>
                                </select>
                                <span className="field-intro">ด้วยค่า:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.value ?? 10}
                                  onChange={(e) => updateBlock(block.id, {value: Number(e.target.value)})}
                                />
                              </div>
                            )}

                            {/* round */}
                            {block.functionName === 'round' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">ปัดเศษทศนิยม:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.decimals ?? 2}
                                  min={0}
                                  max={6}
                                  onChange={(e) => updateBlock(block.id, {decimals: Number(e.target.value)})}
                                />
                                <span className="field-unit">ตำแหน่ง</span>
                              </div>
                            )}

                            {/* if_else */}
                            {block.functionName === 'if_else' && (
                              <div className="lego-sentence-block">
                                <div className="lego-sentence-line">
                                  <span className="field-intro">ถ้าข้อมูล:</span>
                                  <select
                                    className="lego-select"
                                    value={block.params.operator ?? 'is_not_empty'}
                                    onChange={(e) => updateBlock(block.id, {operator: e.target.value})}
                                  >
                                    <option value="is_not_empty">มีค่า (ไม่ว่าง)</option>
                                    <option value="is_empty">ไม่มีค่า (ว่างเปล่า)</option>
                                    <option value="equals">เท่ากับ (=)</option>
                                    <option value="not_equals">ไม่เท่ากับ (!=)</option>
                                    <option value="contains">มีคำว่า...</option>
                                  </select>
                                  {(block.params.operator === 'equals' ||
                                    block.params.operator === 'not_equals' ||
                                    block.params.operator === 'contains') && (
                                    <input
                                      type="text"
                                      className="lego-input-text"
                                      style={{width: 110}}
                                      placeholder="ค่าเปรียบเทียบ"
                                      value={block.params.target ?? ''}
                                      onChange={(e) => updateBlock(block.id, {target: e.target.value})}
                                    />
                                  )}
                                </div>
                                <div className="lego-sentence-line" style={{marginTop: 6}}>
                                  <span className="field-intro" style={{color: '#059669', fontWeight: 600}}>
                                    ✓ แสดง:
                                  </span>
                                  <input
                                    type="text"
                                    className="lego-input-text"
                                    style={{width: 120}}
                                    value={block.params.thenValue ?? 'APPROVED'}
                                    onChange={(e) => updateBlock(block.id, {thenValue: e.target.value})}
                                  />
                                  <span className="field-intro" style={{color: '#dc2626', fontWeight: 600}}>
                                    ✗ ถ้าไม่จริง แสดง:
                                  </span>
                                  <input
                                    type="text"
                                    className="lego-input-text"
                                    style={{width: 120}}
                                    value={block.params.elseValue ?? 'PENDING'}
                                    onChange={(e) => updateBlock(block.id, {elseValue: e.target.value})}
                                  />
                                </div>
                              </div>
                            )}

                            {/* repeat */}
                            {block.functionName === 'repeat' && (
                              <div className="lego-sentence-line">
                                <span className="field-intro">ทำซ้ำข้อความ:</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  style={{width: 90}}
                                  value={block.params.text ?? '*'}
                                  onChange={(e) => updateBlock(block.id, {text: e.target.value})}
                                />
                                <span className="field-intro">จำนวน:</span>
                                <input
                                  type="number"
                                  className="lego-input-num"
                                  value={block.params.times ?? 5}
                                  onChange={(e) => updateBlock(block.id, {times: Number(e.target.value)})}
                                />
                                <span className="field-unit">ครั้ง</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="formula-modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            ปิดหน้าต่าง (Close)
          </button>
          <button type="button" className="btn-save-primary" onClick={handleSave}>
            บันทึกการตั้งค่าสูตร (Save Formulas)
          </button>
        </div>
      </div>
    </div>
  );
}
