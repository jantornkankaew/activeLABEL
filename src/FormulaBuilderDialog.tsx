import {useState, useEffect} from 'react';
import {Plus, Trash2, X, ChevronUp, ChevronDown, Play, Sparkles, Zap, ArrowDown} from 'lucide-react';
import type {LabelVariable} from './core';
import {
  evaluateFormula,
  type LabelFormula,
  type FormulaBlock,
  type FunctionCategory,
} from './formulaEngine';
import './formula.css';

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
        id: 'blk_now',
        category: 'datetime',
        functionName: 'now',
        params: {format: 'DD/MM/YYYY'},
      },
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
        id: 'blk_now',
        category: 'datetime',
        functionName: 'now',
        params: {format: 'DD/MM/YYYY'},
      },
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
        label: 'จัดรูปแบบวันที่ (Format Date)',
        desc: 'เปลี่ยนรูปแบบการแสดงผลวันที่',
        defaultParams: {format: 'DD/MM/YYYY'},
      },
      {
        name: 'date_part',
        label: 'ดึงเฉพาะส่วน (Date Part)',
        desc: 'ดึงเฉพาะวัน เดือน หรือปี',
        defaultParams: {part: 'YYYY'},
      },
    ],
  },
  {
    category: 'string',
    label: '🔤 จัดการข้อความ',
    icon: '🔤',
    color: '#8b5cf6',
    items: [
      {
        name: 'concat',
        label: 'ต่อข้อความ / รวมตัวแปร (Combine Text)',
        desc: 'ใส่ข้อความนำหน้า/ต่อท้าย หรือดึงค่าจาก Variable',
        defaultParams: {prefix: '', append: ''},
      },
      {
        name: 'pad_start',
        label: 'เติมเลข 0 ด้านหน้า (Pad Zeros เช่น 0001)',
        desc: 'เติมเลข 0 หรืออักขระนำหน้าให้ครบหลัก',
        defaultParams: {length: 4, char: '0'},
      },
      {
        name: 'pad_end',
        label: 'เติมตัวอักษรด้านหลัง (Pad End)',
        desc: 'เติมตัวอักษรต่อท้ายให้ครบความยาว',
        defaultParams: {length: 8, char: ' '},
      },
      {
        name: 'substring',
        label: 'ตัดข้อความ (Cut / Substring)',
        desc: 'ตัดคำตามตำแหน่งและความยาว',
        defaultParams: {start: 0, length: 5},
      },
      {
        name: 'uppercase',
        label: 'ตัวพิมพ์ใหญ่ (UPPERCASE)',
        desc: 'แปลงข้อความเป็นตัวพิมพ์ใหญ่ทั้งหมด',
        defaultParams: {},
      },
      {
        name: 'lowercase',
        label: 'ตัวพิมพ์เล็ก (lowercase)',
        desc: 'แปลงข้อความเป็นตัวพิมพ์เล็กทั้งหมด',
        defaultParams: {},
      },
      {
        name: 'replace',
        label: 'ค้นหาและแทนที่คำ (Replace)',
        desc: 'ค้นหาคำแล้วแทนที่ด้วยข้อความใหม่',
        defaultParams: {search: '', replace: ''},
      },
      {
        name: 'trim',
        label: 'ตัดช่องว่างหัวท้าย (Trim)',
        desc: 'ลบช่องว่างส่วนเกินด้านหน้าและด้านหลัง',
        defaultParams: {},
      },
    ],
  },
  {
    category: 'numeric',
    label: '🔢 ตัวเลขและลำดับ',
    icon: '🔢',
    color: '#f59e0b',
    items: [
      {
        name: 'counter',
        label: 'รันตัวเลขอัตโนมัติ (Sequence Counter)',
        desc: 'สร้างตัวเลขลำดับต่อเนื่อง พร้อมเติมศูนย์',
        defaultParams: {start: 1, padZeros: 4},
      },
      {
        name: 'math_op',
        label: 'คำนวณคณิตศาสตร์ (+, -, *, /)',
        desc: 'บวก ลบ คูณ หรือหารตัวเลข',
        defaultParams: {op: 'add', value: 10},
      },
      {
        name: 'round',
        label: 'ปัดเศษทศนิยม (Round Decimals)',
        desc: 'ปัดเศษทศนิยมตามจำนวนหลัก',
        defaultParams: {decimals: 2},
      },
    ],
  },
  {
    category: 'if',
    label: '🔀 เงื่อนไข IF / ELSE',
    icon: '🔀',
    color: '#10b981',
    items: [
      {
        name: 'if_else',
        label: 'ถ้า...แล้ว...มิฉะนั้น (IF / ELSE)',
        desc: 'ถ้าตรงเงื่อนไขแสดงค่า A มิฉะนั้นแสดงค่า B',
        defaultParams: {
          operator: 'equals',
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
        label: 'ทำซ้ำข้อความ N ครั้ง (Repeat)',
        desc: 'ทำซ้ำข้อความหรือสัญลักษณ์ N ครั้ง',
        defaultParams: {text: '*', times: 5, separator: ''},
      },
    ],
  },
];

const DATE_FORMAT_PRESETS = [
  {value: 'DD/MM/YYYY', label: '15/10/2026 (วัน/เดือน/ปี)'},
  {value: 'YYYY-MM-DD', label: '2026-10-15 (ปี-เดือน-วัน)'},
  {value: 'DD-MM-YYYY', label: '15-10-2026'},
  {value: 'YYYYMMDD', label: '20261015 (ติดกัน)'},
  {value: 'YYMMDD', label: '261015 (ปี2หลัก)'},
  {value: 'DD/MM/YY', label: '15/10/26'},
  {value: 'DD/MM/YYYY HH:mm', label: '15/10/2026 14:30 (พร้อมเวลา)'},
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
            functionName: 'now',
            params: {format: 'DD/MM/YYYY'},
          },
          {
            id: 'b2',
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

  const [activeCategory, setActiveCategory] = useState<FunctionCategory>('datetime');
  const activeFormula = list.find((f) => f.id === activeId) || list[0];
  const [simulatedResult, setSimulatedResult] = useState('');

  // Re-run live simulation
  useEffect(() => {
    if (!activeFormula) {
      setSimulatedResult('');
      return;
    }
    const varMap: Record<string, string> = {};
    for (const v of variables) {
      varMap[v.name] = v.value || `[${v.label || v.name}]`;
    }
    try {
      const res = evaluateFormula(activeFormula, varMap);
      setSimulatedResult(res || '(ไม่มีข้อมูล)');
    } catch {
      setSimulatedResult('(เกิดข้อผิดพลาดในการคำนวณ)');
    }
  }, [activeFormula, variables]);

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
          functionName: 'now',
          params: {format: 'DD/MM/YYYY'},
        },
      ],
    };
    setList((prev) => [...prev, newFormula]);
    setActiveId(newId);
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
            <h2 id="formula-title">🧩 Formula Builder (ตัวสร้างสูตร LEGO)</h2>
            <p>สร้างสูตรและคำนวณวันหมดอายุ ข้อความ และลำดับตัวเลขได้อย่างง่ายดาย โดยไม่ต้องพิมพ์โค้ด</p>
          </div>
          <button type="button" className="formula-close-btn" aria-label="Close dialog" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Top Control Bar: Formula Selector & Quick Presets */}
        <div className="formula-top-section">
          {/* Formula Selector row */}
          <div className="formula-selector-row">
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

            {/* Formula Name Input & Delete */}
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

          {/* Prominent Live Simulation Banner */}
          <div className="formula-simulation-banner">
            <div className="sim-badge-label">
              <Play size={11} fill="#059669" color="#059669" />
              <span>ผลลัพธ์จำลองแบบเรียลไทม์ (Live Result):</span>
            </div>
            <div className="sim-badge-output">
              <strong>{simulatedResult || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Function Categories Palette */}
        <div className="formula-palette-section">
          {/* Category Tabs */}
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

          {/* Function Chips Grid for Selected Category */}
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

        {/* LEGO Blocks Canvas */}
        <div className="formula-canvas-area">
          <div className="canvas-header-bar">
            <h4>
              ลำดับการทำงานของสูตร ({activeFormula?.blocks.length ?? 0} บล็อกต่อกัน)
            </h4>
            <span className="canvas-tip">ผลลัพธ์จะถูกส่งต่อจากบนลงล่างเหมือนตัวต่อเลโก้</span>
          </div>

          <div className="lego-blocks-scroll">
            {!activeFormula || activeFormula.blocks.length === 0 ? (
              <div className="lego-empty-canvas">
                <Sparkles size={36} color="#94a3b8" />
                <h3>ยังไม่มีบล็อกฟังก์ชันในสูตรนี้</h3>
                <p>เลือกสูตรสำเร็จรูปด้านบน หรือคลิกเลือกฟังก์ชันจากแถบด้านบนเพื่อเริ่มสร้างสูตร</p>
                <div className="empty-quick-actions">
                  <button type="button" onClick={() => applyPreset(PRESET_TEMPLATES[0])}>
                    ⚡ ใช้วันหมดอายุ (+30 วัน)
                  </button>
                  <button type="button" onClick={() => applyPreset(PRESET_TEMPLATES[2])}>
                    ⚡ ใช้รหัส Lot วันนี้
                  </button>
                </div>
              </div>
            ) : (
              activeFormula.blocks.map((block, index) => {
                const isFirst = index === 0;
                const isLast = index === activeFormula.blocks.length - 1;

                return (
                  <div key={block.id} className="lego-step-wrapper">
                    {/* Connecting arrow from previous block */}
                    {index > 0 && (
                      <div className="lego-connector">
                        <ArrowDown size={14} />
                        <span>นำผลลัพธ์ส่งต่อไปยัง...</span>
                      </div>
                    )}

                    {/* LEGO Block Card */}
                    <div className={`lego-block cat-${block.category}`}>
                      {/* Block Header */}
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
                            {block.functionName === 'add_days' && 'บวก/ลบวัน (คำนวณวันหมดอายุ Expiry)'}
                            {block.functionName === 'add_months' && 'บวก/ลบเดือน (+Months)'}
                            {block.functionName === 'add_years' && 'บวก/ลบปี (+Years)'}
                            {block.functionName === 'format_date' && 'จัดรูปแบบวันที่ (Format Date)'}
                            {block.functionName === 'date_part' && 'แยกส่วนวันที่ (Date Part)'}
                            {block.functionName === 'concat' && 'ต่อข้อความ / รวมตัวแปร (Combine Text)'}
                            {block.functionName === 'pad_start' && 'เติมเลข 0 ด้านหน้า (Pad Zeros)'}
                            {block.functionName === 'pad_end' && 'เติมตัวอักษรด้านหลัง (Pad End)'}
                            {block.functionName === 'substring' && 'ตัดข้อความ (Substring / Slice)'}
                            {block.functionName === 'uppercase' && 'แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)'}
                            {block.functionName === 'lowercase' && 'แปลงเป็นตัวพิมพ์เล็ก (lowercase)'}
                            {block.functionName === 'replace' && 'ค้นหาและแทนที่คำ (Replace)'}
                            {block.functionName === 'trim' && 'ตัดช่องว่างหัวท้าย (Trim)'}
                            {block.functionName === 'counter' && 'รันตัวเลขอัตโนมัติ (Sequence Counter)'}
                            {block.functionName === 'math_op' && 'คำนวณเลข (+, -, *, /)'}
                            {block.functionName === 'round' && 'ปัดเศษทศนิยม (Round Decimals)'}
                            {block.functionName === 'if_else' && 'เงื่อนไข ถ้า...แล้ว...มิฉะนั้น (IF / ELSE)'}
                            {block.functionName === 'repeat' && 'ทำซ้ำข้อความ N ครั้ง (Repeat)'}
                          </strong>
                        </div>

                        {/* Block Reorder & Delete Actions */}
                        <div className="lego-block-actions">
                          <button
                            type="button"
                            className="block-action-btn"
                            disabled={isFirst}
                            title="เลื่อนขึ้น"
                            onClick={() => moveBlock(block.id, -1)}
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            className="block-action-btn"
                            disabled={isLast}
                            title="เลื่อนลง"
                            onClick={() => moveBlock(block.id, 1)}
                          >
                            <ChevronDown size={15} />
                          </button>
                          <button
                            type="button"
                            className="block-action-btn delete"
                            title="ลบบล็อกนี้"
                            onClick={() => removeBlock(block.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Block Controls / Natural Sentence Form */}
                      <div className="lego-block-body">
                        {/* 1. NOW */}
                        {block.functionName === 'now' && (
                          <div className="lego-field-row">
                            <span className="field-intro">รูปแบบการแสดงผล:</span>
                            <select
                              className="lego-select"
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            >
                              {DATE_FORMAT_PRESETS.map((fmt) => (
                                <option key={fmt.value} value={fmt.value}>
                                  {fmt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* 2. Add Days */}
                        {block.functionName === 'add_days' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">บวกเพิ่ม:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.days ?? 30}
                              onChange={(e) => updateBlock(block.id, {days: Number(e.target.value)})}
                            />
                            <span className="field-unit">วัน (ใส่วันที่ติดลบได้)</span>
                            <span className="field-separator">|</span>
                            <span className="field-intro">รูปแบบวันที่:</span>
                            <select
                              className="lego-select"
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            >
                              {DATE_FORMAT_PRESETS.map((fmt) => (
                                <option key={fmt.value} value={fmt.value}>
                                  {fmt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* 3. Add Months */}
                        {block.functionName === 'add_months' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">บวกเพิ่ม:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.months ?? 1}
                              onChange={(e) => updateBlock(block.id, {months: Number(e.target.value)})}
                            />
                            <span className="field-unit">เดือน</span>
                            <span className="field-separator">|</span>
                            <span className="field-intro">รูปแบบ:</span>
                            <select
                              className="lego-select"
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            >
                              {DATE_FORMAT_PRESETS.map((fmt) => (
                                <option key={fmt.value} value={fmt.value}>
                                  {fmt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* 4. Add Years */}
                        {block.functionName === 'add_years' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">บวกเพิ่ม:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.years ?? 1}
                              onChange={(e) => updateBlock(block.id, {years: Number(e.target.value)})}
                            />
                            <span className="field-unit">ปี</span>
                            <span className="field-separator">|</span>
                            <span className="field-intro">รูปแบบ:</span>
                            <select
                              className="lego-select"
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            >
                              {DATE_FORMAT_PRESETS.map((fmt) => (
                                <option key={fmt.value} value={fmt.value}>
                                  {fmt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* 5. Format Date */}
                        {block.functionName === 'format_date' && (
                          <div className="lego-field-row">
                            <span className="field-intro">แปลงเป็นรูปแบบ:</span>
                            <select
                              className="lego-select"
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            >
                              {DATE_FORMAT_PRESETS.map((fmt) => (
                                <option key={fmt.value} value={fmt.value}>
                                  {fmt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* 6. Date Part */}
                        {block.functionName === 'date_part' && (
                          <div className="lego-field-row">
                            <span className="field-intro">ดึงเฉพาะข้อมูลส่วน:</span>
                            <select
                              className="lego-select"
                              value={block.params.part ?? 'YYYY'}
                              onChange={(e) => updateBlock(block.id, {part: e.target.value})}
                            >
                              <option value="YYYY">ปี ค.ศ. 4 หลัก (เช่น 2026)</option>
                              <option value="YY">ปี ค.ศ. 2 หลัก (เช่น 26)</option>
                              <option value="MM">เดือน 2 หลัก (01-12)</option>
                              <option value="DD">วันที่ 2 หลัก (01-31)</option>
                            </select>
                          </div>
                        )}

                        {/* 7. Concat / Combine */}
                        {block.functionName === 'concat' && (
                          <div className="lego-field-grid">
                            <div className="field-item">
                              <span className="field-sublabel">ข้อความนำหน้า (Prefix):</span>
                              <input
                                type="text"
                                className="lego-input-text"
                                placeholder="เช่น LOT-"
                                value={block.params.prefix ?? ''}
                                onChange={(e) => updateBlock(block.id, {prefix: e.target.value})}
                              />
                            </div>
                            {variables.length > 0 && (
                              <div className="field-item">
                                <span className="field-sublabel">หรือดึงจากตัวแปร (Variable):</span>
                                <select
                                  className="lego-select"
                                  value={block.params.source ?? ''}
                                  onChange={(e) => updateBlock(block.id, {source: e.target.value})}
                                >
                                  <option value="">(ใช้ข้อความจากขั้นตอนก่อนหน้า)</option>
                                  {variables.map((v) => (
                                    <option key={v.name} value={`{{${v.name}}}`}>
                                      {v.label || v.name} ({v.value || 'ว่าง'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="field-item">
                              <span className="field-sublabel">ข้อความต่อท้าย (Suffix):</span>
                              <input
                                type="text"
                                className="lego-input-text"
                                placeholder="เช่น -EXP"
                                value={block.params.append ?? ''}
                                onChange={(e) => updateBlock(block.id, {append: e.target.value})}
                              />
                            </div>
                          </div>
                        )}

                        {/* 8. Pad Start */}
                        {block.functionName === 'pad_start' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">เติมตัวอักษร:</span>
                            <input
                              type="text"
                              className="lego-input-mini"
                              value={block.params.char ?? '0'}
                              onChange={(e) => updateBlock(block.id, {char: e.target.value.slice(-1) || '0'})}
                            />
                            <span className="field-intro">นำหน้าให้ครบ:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.length ?? 4}
                              onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                            />
                            <span className="field-unit">หลัก (เช่น 0001, 0002)</span>
                          </div>
                        )}

                        {/* 9. Pad End */}
                        {block.functionName === 'pad_end' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">เติมตัวอักษร:</span>
                            <input
                              type="text"
                              className="lego-input-mini"
                              value={block.params.char ?? ' '}
                              onChange={(e) => updateBlock(block.id, {char: e.target.value.slice(-1) || ' '})}
                            />
                            <span className="field-intro">ต่อท้ายให้ครบ:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.length ?? 8}
                              onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                            />
                            <span className="field-unit">หลัก</span>
                          </div>
                        )}

                        {/* 10. Substring */}
                        {block.functionName === 'substring' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">ตัดเริ่มจากตัวที่:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.start ?? 0}
                              onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                            />
                            <span className="field-intro">ตัดความยาว:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.length ?? 5}
                              onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                            />
                            <span className="field-unit">ตัวอักษร</span>
                          </div>
                        )}

                        {/* 11. Uppercase & Lowercase */}
                        {block.functionName === 'uppercase' && (
                          <p className="lego-hint-text">✨ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์ใหญ่ (A–Z)</p>
                        )}
                        {block.functionName === 'lowercase' && (
                          <p className="lego-hint-text">✨ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์เล็ก (a–z)</p>
                        )}
                        {block.functionName === 'trim' && (
                          <p className="lego-hint-text">✨ ตัดช่องว่างส่วนเกินด้านหน้าและด้านหลังข้อความ</p>
                        )}

                        {/* 12. Replace */}
                        {block.functionName === 'replace' && (
                          <div className="lego-field-grid">
                            <div className="field-item">
                              <span className="field-sublabel">ค้นหาคำว่า:</span>
                              <input
                                type="text"
                                className="lego-input-text"
                                placeholder="คำที่ต้องการค้นหา"
                                value={block.params.search ?? ''}
                                onChange={(e) => updateBlock(block.id, {search: e.target.value})}
                              />
                            </div>
                            <div className="field-item">
                              <span className="field-sublabel">แทนที่ด้วย:</span>
                              <input
                                type="text"
                                className="lego-input-text"
                                placeholder="คำใหม่ที่จะใส่แทน"
                                value={block.params.replace ?? ''}
                                onChange={(e) => updateBlock(block.id, {replace: e.target.value})}
                              />
                            </div>
                          </div>
                        )}

                        {/* 13. Counter */}
                        {block.functionName === 'counter' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">ตัวเลขเริ่มต้น:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.start ?? 1}
                              onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                            />
                            <span className="field-separator">|</span>
                            <span className="field-intro">เติมเลข 0 นำหน้าให้ครบ:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.padZeros ?? 4}
                              onChange={(e) => updateBlock(block.id, {padZeros: Number(e.target.value)})}
                            />
                            <span className="field-unit">หลัก (เช่น 0001, 0002)</span>
                          </div>
                        )}

                        {/* 14. Math Op */}
                        {block.functionName === 'math_op' && (
                          <div className="lego-field-row flex-wrap">
                            <span className="field-intro">คำนวณ:</span>
                            <select
                              className="lego-select"
                              value={block.params.op ?? 'add'}
                              onChange={(e) => updateBlock(block.id, {op: e.target.value})}
                            >
                              <option value="add">บวก (+)</option>
                              <option value="sub">ลบ (-)</option>
                              <option value="mul">คูณ (×)</option>
                              <option value="div">หาร (÷)</option>
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

                        {/* 15. Round */}
                        {block.functionName === 'round' && (
                          <div className="lego-field-row">
                            <span className="field-intro">ปัดเศษทศนิยมให้เหลือ:</span>
                            <input
                              type="number"
                              className="lego-input-num"
                              value={block.params.decimals ?? 2}
                              onChange={(e) => updateBlock(block.id, {decimals: Number(e.target.value)})}
                            />
                            <span className="field-unit">ตำแหน่ง</span>
                          </div>
                        )}

                        {/* 16. IF / ELSE */}
                        {block.functionName === 'if_else' && (
                          <div className="lego-if-container">
                            <div className="if-row">
                              <span className="if-tag">ถ้า (IF)</span>
                              <select
                                className="lego-select"
                                value={block.params.source ?? ''}
                                onChange={(e) => updateBlock(block.id, {source: e.target.value})}
                              >
                                <option value="">(ค่าจากขั้นตอนก่อนหน้า)</option>
                                {variables.map((v) => (
                                  <option key={v.name} value={`{{${v.name}}}`}>
                                    {v.label || v.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="lego-select"
                                value={block.params.operator ?? 'equals'}
                                onChange={(e) => updateBlock(block.id, {operator: e.target.value})}
                              >
                                <option value="equals">เท่ากับ (=)</option>
                                <option value="not_equals">ไม่เท่ากับ (≠)</option>
                                <option value="contains">มีคำว่า (contains)</option>
                                <option value="greater_than">มากกว่า (&gt;)</option>
                                <option value="less_than">น้อยกว่า (&lt;)</option>
                                <option value="is_empty">เป็นค่าว่าง</option>
                                <option value="is_not_empty">ไม่เป็นค่าว่าง</option>
                              </select>
                              <input
                                type="text"
                                className="lego-input-text"
                                placeholder="ค่าเปรียบเทียบ"
                                value={block.params.target ?? ''}
                                onChange={(e) => updateBlock(block.id, {target: e.target.value})}
                              />
                            </div>
                            <div className="if-results-row">
                              <div className="if-result-field">
                                <span className="then-tag">แล้วแสดงค่า (THEN):</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  value={block.params.thenValue ?? 'APPROVED'}
                                  onChange={(e) => updateBlock(block.id, {thenValue: e.target.value})}
                                />
                              </div>
                              <div className="if-result-field">
                                <span className="else-tag">มิฉะนั้นแสดงค่า (ELSE):</span>
                                <input
                                  type="text"
                                  className="lego-input-text"
                                  value={block.params.elseValue ?? 'PENDING'}
                                  onChange={(e) => updateBlock(block.id, {elseValue: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 17. Repeat / Loop */}
                        {block.functionName === 'repeat' && (
                          <div className="lego-field-row flex-wrap">
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
                            <span className="field-intro">ตัวคั่น:</span>
                            <input
                              type="text"
                              className="lego-input-mini"
                              placeholder="-"
                              value={block.params.separator ?? ''}
                              onChange={(e) => updateBlock(block.id, {separator: e.target.value})}
                            />
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

        {/* Modal Bottom Actions */}
        <div className="formula-modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            ยกเลิก (Cancel)
          </button>
          <button type="button" className="btn-save-primary" onClick={handleSave}>
            บันทึกการตั้งค่าสูตร (Save Formulas)
          </button>
        </div>
      </div>
    </div>
  );
}
