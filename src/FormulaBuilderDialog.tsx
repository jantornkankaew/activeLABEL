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
  Wand2,
  Calendar,
  Type,
  Hash,
  GitBranch,
  Repeat,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import type {LabelVariable} from './core';
import {
  evaluateBlock,
  evaluateFormula,
  type LabelFormula,
  type FormulaBlock,
  type FunctionCategory,
} from './formulaEngine';
import './formula.css';

type PresetRecipe = {
  id: string;
  name: string;
  badge: string;
  color: string;
  blocks: FormulaBlock[];
};

const PRESET_RECIPES: PresetRecipe[] = [
  {
    id: 'exp_30_days',
    name: 'วันหมดอายุ (+30 วัน)',
    badge: '⚡ วันที่',
    color: '#3b82f6',
    blocks: [
      {
        id: 'b1',
        category: 'datetime',
        functionName: 'add_days',
        params: {days: 30, format: 'DD/MM/YYYY'},
      },
    ],
  },
  {
    id: 'exp_1_year',
    name: 'วันหมดอายุ (+1 ปี)',
    badge: '⚡ วันที่',
    color: '#3b82f6',
    blocks: [
      {
        id: 'b1',
        category: 'datetime',
        functionName: 'add_years',
        params: {years: 1, format: 'DD/MM/YYYY'},
      },
    ],
  },
  {
    id: 'lot_today',
    name: 'Lot วันนี้ (LOT-YYYYMMDD)',
    badge: '⚡ รหัสสินค้า',
    color: '#10b981',
    blocks: [
      {
        id: 'b1',
        category: 'datetime',
        functionName: 'now',
        params: {format: 'YYYYMMDD'},
      },
      {
        id: 'b2',
        category: 'string',
        functionName: 'concat',
        params: {prefix: 'LOT-', append: ''},
      },
    ],
  },
  {
    id: 'seq_counter',
    name: 'รหัสลำดับ (SEQ-0001)',
    badge: '⚡ ตัวเลข',
    color: '#8b5cf6',
    blocks: [
      {
        id: 'b1',
        category: 'numeric',
        functionName: 'counter',
        params: {start: 1, padZeros: 4},
      },
      {
        id: 'b2',
        category: 'string',
        functionName: 'concat',
        params: {prefix: 'SEQ-', append: ''},
      },
    ],
  },
  {
    id: 'uppercase_text',
    name: 'แปลงพิมพ์ใหญ่ (UPPERCASE)',
    badge: '⚡ ข้อความ',
    color: '#f59e0b',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'uppercase',
        params: {},
      },
    ],
  },
];

type LegoPieceItem = {
  name: string;
  title: string;
  desc: string;
  defaultParams: Record<string, any>;
};

const LEGO_PALETTE_CATEGORIES: {
  category: FunctionCategory;
  label: string;
  icon: any;
  color: string;
  lightBg: string;
  pieces: LegoPieceItem[];
}[] = [
  {
    category: 'datetime',
    label: 'วันที่และเวลา',
    icon: Calendar,
    color: '#2563eb',
    lightBg: '#eff6ff',
    pieces: [
      {
        name: 'now',
        title: 'วันที่ปัจจุบัน (NOW)',
        desc: 'ดึงวันและเวลาปัจจุบัน',
        defaultParams: {format: 'DD/MM/YYYY'},
      },
      {
        name: 'add_days',
        title: 'บวก/ลบวัน (วันหมดอายุ)',
        desc: 'เพิ่มหรือลดวันสำหรับคิดวันหมดอายุ',
        defaultParams: {days: 30, format: 'DD/MM/YYYY'},
      },
      {
        name: 'add_months',
        title: 'บวก/ลบเดือน (+Months)',
        desc: 'เพิ่มหรือลดเดือน',
        defaultParams: {months: 1, format: 'DD/MM/YYYY'},
      },
      {
        name: 'add_years',
        title: 'บวก/ลบปี (+Years)',
        desc: 'เพิ่มหรือลดปี',
        defaultParams: {years: 1, format: 'DD/MM/YYYY'},
      },
      {
        name: 'format_date',
        title: 'เปลี่ยนรูปแบบวันที่ (Format)',
        desc: 'เปลี่ยนรูปแบบการแสดงผลวันที่',
        defaultParams: {format: 'DD/MM/YYYY'},
      },
      {
        name: 'date_part',
        title: 'ดึงเฉพาะส่วน (ปี/เดือน/วัน)',
        desc: 'ดึงเฉพาะปี เดือน หรือวัน',
        defaultParams: {part: 'YYYY'},
      },
    ],
  },
  {
    category: 'string',
    label: 'ข้อความและตัวอักษร',
    icon: Type,
    color: '#059669',
    lightBg: '#ecfdf5',
    pieces: [
      {
        name: 'concat',
        title: 'เติมคำนำหน้า / ต่อท้าย',
        desc: 'ใส่ข้อความนำหน้าหรือต่อท้ายค่าปัจจุบัน',
        defaultParams: {prefix: '', append: ''},
      },
      {
        name: 'uppercase',
        title: 'แปลงเป็นตัวพิมพ์ใหญ่',
        desc: 'แปลงภาษาอังกฤษเป็น UPPERCASE',
        defaultParams: {},
      },
      {
        name: 'lowercase',
        title: 'แปลงเป็นตัวพิมพ์เล็ก',
        desc: 'แปลงภาษาอังกฤษเป็น lowercase',
        defaultParams: {},
      },
      {
        name: 'pad_start',
        title: 'เติมเลข 0 ด้านหน้า (Pad)',
        desc: 'เติมเลขศูนย์ด้านหน้าให้ครบหลัก เช่น 0001',
        defaultParams: {length: 4, char: '0'},
      },
      {
        name: 'substring',
        title: 'ตัดข้อความบางส่วน',
        desc: 'ตัดเอาเฉพาะช่วงตัวอักษรที่ต้องการ',
        defaultParams: {start: 0, length: 5},
      },
      {
        name: 'replace',
        title: 'ค้นหาและแทนที่คำ',
        desc: 'เปลี่ยนคำเดิมเป็นคำใหม่',
        defaultParams: {search: '', replace: ''},
      },
      {
        name: 'trim',
        title: 'ตัดช่องว่างหน้า-หลัง',
        desc: 'ลบ space ส่วนเกินที่หัวและท้าย',
        defaultParams: {},
      },
    ],
  },
  {
    category: 'numeric',
    label: 'ตัวเลขและลำดับ',
    icon: Hash,
    color: '#7c3aed',
    lightBg: '#f5f3ff',
    pieces: [
      {
        name: 'counter',
        title: 'รันลำดับตัวเลขอัตโนมัติ',
        desc: 'สร้างตัวเลขนับลำดับต่อเนื่อง เช่น 0001, 0002',
        defaultParams: {start: 1, padZeros: 4},
      },
      {
        name: 'math_op',
        title: 'คำนวณเลข (+, -, *, /)',
        desc: 'บวก ลบ คูณ หรือหารตัวเลข',
        defaultParams: {op: 'add', value: 10},
      },
      {
        name: 'round',
        title: 'ปัดเศษทศนิยม',
        desc: 'กำหนดจำนวนหลักทศนิยม',
        defaultParams: {decimals: 2},
      },
    ],
  },
  {
    category: 'if',
    label: 'เงื่อนไข (IF / ELSE)',
    icon: GitBranch,
    color: '#d97706',
    lightBg: '#fffbeb',
    pieces: [
      {
        name: 'if_else',
        title: 'ถ้า... ให้แสดง...',
        desc: 'ตรวจสอบเงื่อนไข หากจริงแสดง A ไม่จริงแสดง B',
        defaultParams: {
          operator: 'is_not_empty',
          target: '',
          thenValue: 'พร้อมจำหน่าย',
          elseValue: 'สินค้าหมด',
        },
      },
    ],
  },
  {
    category: 'loop',
    label: 'ทำซ้ำ (Repeat)',
    icon: Repeat,
    color: '#db2777',
    lightBg: '#fdf2f8',
    pieces: [
      {
        name: 'repeat',
        title: 'ทำซ้ำข้อความ N ครั้ง',
        desc: 'พิมพ์ข้อความหรือเครื่องหมายซ้ำๆ',
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

  const [activeCategory, setActiveCategory] = useState<FunctionCategory>('datetime');

  const activeFormula = list.find((f) => f.id === activeId) || list[0];

  // Map variables
  const varMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of variables) {
      map[v.name] = v.value || `[${v.label || v.name}]`;
    }
    return map;
  }, [variables]);

  // Compute intermediate step-by-step results for EACH block
  const stepOutputs = useMemo(() => {
    if (!activeFormula || !activeFormula.blocks) return [];
    let current = '';
    const outputs: string[] = [];
    const now = new Date();
    for (const block of activeFormula.blocks) {
      try {
        current = evaluateBlock(block, current, varMap, now);
        outputs.push(current || '(ค่าว่าง)');
      } catch {
        outputs.push('(เกิดข้อผิดพลาด)');
      }
    }
    return outputs;
  }, [activeFormula, varMap]);

  // Final calculated result
  const finalResult = stepOutputs.length > 0 ? stepOutputs[stepOutputs.length - 1] : '';

  function updateActiveFormula(changes: Partial<LabelFormula>) {
    setList((prev) =>
      prev.map((f) => (f.id === activeId ? {...f, ...changes} : f))
    );
  }

  function addFormula() {
    const newId = `formula_${list.length + 1}`;
    const newFormula: LabelFormula = {
      id: newId,
      name: `สูตรใหม่ ${list.length + 1}`,
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

  function applyPreset(preset: PresetRecipe) {
    const freshBlocks: FormulaBlock[] = preset.blocks.map((b, idx) => ({
      ...structuredClone(b),
      id: `blk_${Date.now()}_${idx}`,
    }));
    updateActiveFormula({
      name: preset.name,
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

  const selectedCategoryDef =
    LEGO_PALETTE_CATEGORIES.find((c) => c.category === activeCategory) || LEGO_PALETTE_CATEGORIES[0];

  return (
    <div className="modal-backdrop">
      <div className="modal lego-formula-modal" role="dialog" aria-modal="true" aria-labelledby="formula-title">
        {/* ================= TOP APP BAR ================= */}
        <div className="lego-header-bar">
          <div className="lego-title-group">
            <span className="lego-logo-badge">🧱 LEGO Formula</span>
            <div className="formula-select-wrapper">
              <select
                className="lego-formula-dropdown"
                value={activeId}
                onChange={(e) => setActiveId(e.target.value)}
              >
                {list.map((f) => (
                  <option key={f.id} value={f.id}>
                    🧩 {f.name || 'Untitled'} ({f.blocks.length} บล็อก)
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="lego-btn-add-formula"
                title="สร้างสูตรใหม่"
                onClick={addFormula}
              >
                <Plus size={13} strokeWidth={2.5} /> เพิ่มสูตรใหม่
              </button>
            </div>

            <input
              type="text"
              className="lego-formula-name-input"
              value={activeFormula?.name ?? ''}
              placeholder="ตั้งชื่อสูตร..."
              title="แก้ไขชื่อสูตรนี้"
              onChange={(e) => updateActiveFormula({name: e.target.value})}
            />

            {list.length > 1 && (
              <button
                type="button"
                className="lego-btn-delete-formula"
                title="ลบสูตรนี้"
                onClick={() => removeFormula(activeId)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Prominent Live Final Result Banner */}
          <div className="lego-final-result-card">
            <span className="result-tag">🎯 ผลลัพธ์สุดท้าย:</span>
            <span className="result-val">{finalResult || '—'}</span>
          </div>

          <button
            type="button"
            className="lego-btn-close-modal"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= 2-COLUMN MAIN WORKSPACE ================= */}
        <div className="lego-workspace-grid">
          {/* ----- LEFT SIDEBAR: TOOLBOX OF LEGO PIECES ----- */}
          <aside className="lego-toolbox-sidebar">
            {/* Quick Recipes Section */}
            <div className="toolbox-section">
              <div className="section-label">
                <Zap size={13} fill="#f59e0b" color="#f59e0b" />
                <span>สูตรสำเร็จรูป (คลิกเดียวต่อให้เสร็จ)</span>
              </div>
              <div className="recipes-grid">
                {PRESET_RECIPES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="recipe-card-chip"
                    onClick={() => applyPreset(r)}
                  >
                    <span className="recipe-badge" style={{color: r.color}}>{r.badge}</span>
                    <span className="recipe-title">{r.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Tabs */}
            <div className="toolbox-section" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
              <div className="section-label">
                <Layers size={13} color="#2563eb" />
                <span>กล่องชิ้นส่วนเลโก้ (คลิกเพื่อต่อบล็อก)</span>
              </div>

              {/* Category selector chips */}
              <div className="category-chips-row">
                {LEGO_PALETTE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.category;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      className={`cat-pill-btn ${isActive ? 'active' : ''}`}
                      style={{
                        borderColor: isActive ? cat.color : '#e2e8f0',
                        color: isActive ? '#ffffff' : '#475569',
                        backgroundColor: isActive ? cat.color : '#ffffff',
                      }}
                      onClick={() => setActiveCategory(cat.category)}
                    >
                      <Icon size={12} strokeWidth={2.2} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Pieces list in active category */}
              <div className="pieces-list-scroll">
                {selectedCategoryDef.pieces.map((piece) => (
                  <button
                    key={piece.name}
                    type="button"
                    className="lego-piece-card"
                    style={{borderLeftColor: selectedCategoryDef.color}}
                    onClick={() => addBlock(selectedCategoryDef.category, piece.name, piece.defaultParams)}
                  >
                    <div className="piece-card-header">
                      <strong className="piece-title">{piece.title}</strong>
                      <span className="piece-add-action" style={{backgroundColor: selectedCategoryDef.lightBg, color: selectedCategoryDef.color}}>
                        <Plus size={13} strokeWidth={3} /> เพิ่มชิ้นนี้
                      </span>
                    </div>
                    <p className="piece-desc">{piece.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ----- RIGHT MAIN: LEGO CANVAS WORKSPACE ----- */}
          <main className="lego-canvas-board">
            <div className="canvas-top-info">
              <div className="chain-stats">
                <strong>สายพานต่อเลโก้</strong>
                <span className="stats-pill">{activeFormula?.blocks.length ?? 0} ชิ้นต่อกัน</span>
              </div>
              <span className="canvas-guide-text">
                <Info size={13} color="#64748b" /> ผลลัพธ์จะถูกประมวลผลและส่งต่อจากบนลงล่างทีละขั้นตอน
              </span>
            </div>

            {/* Scrollable list of LEGO bricks */}
            <div className="lego-bricks-chain-scroll">
              {!activeFormula || activeFormula.blocks.length === 0 ? (
                <div className="lego-empty-board">
                  <div className="empty-lego-icon">🧱</div>
                  <h3>ยังไม่มีชิ้นส่วนเลโก้ในสูตรนี้</h3>
                  <p>คลิกเลือกชิ้นส่วนจากแถบด้านซ้าย เพื่อนำมาต่อบนสายพานนี้</p>
                  <div className="empty-quick-buttons">
                    <button type="button" onClick={() => applyPreset(PRESET_RECIPES[0])}>
                      ⚡ วันหมดอายุ (+30 วัน)
                    </button>
                    <button type="button" onClick={() => applyPreset(PRESET_RECIPES[2])}>
                      ⚡ รหัส Lot วันนี้
                    </button>
                    <button type="button" onClick={() => applyPreset(PRESET_RECIPES[3])}>
                      ⚡ รหัสลำดับ 0001
                    </button>
                  </div>
                </div>
              ) : (
                activeFormula.blocks.map((block, index) => {
                  const isFirst = index === 0;
                  const isLast = index === activeFormula.blocks.length - 1;
                  const stepResult = stepOutputs[index] ?? '';

                  return (
                    <div key={block.id} className="lego-brick-step">
                      {/* Flow Connector Arrow between blocks */}
                      {index > 0 && (
                        <div className="lego-flow-snap">
                          <div className="snap-line"></div>
                          <div className="snap-pill">
                            <ArrowDown size={12} strokeWidth={2.5} />
                            <span>ส่งผลลัพธ์ไปยังชิ้นถัดไป</span>
                          </div>
                          <div className="snap-line"></div>
                        </div>
                      )}

                      {/* Realistic LEGO Brick Card */}
                      <div className={`lego-brick cat-${block.category}`}>
                        {/* 3D LEGO Top Studs */}
                        <div className="brick-studs-bar">
                          <span className="stud" />
                          <span className="stud" />
                          <span className="stud" />
                          <span className="stud" />
                          <span className="stud" />
                          <span className="stud" />
                        </div>

                        {/* Brick Header */}
                        <div className="brick-header">
                          <div className="brick-title-area">
                            <span className="step-circle">{index + 1}</span>
                            <span className={`brick-cat-badge cat-${block.category}`}>
                              {block.category === 'datetime' && '📅 วันที่'}
                              {block.category === 'string' && '🔤 ข้อความ'}
                              {block.category === 'numeric' && '🔢 ตัวเลข'}
                              {block.category === 'if' && '🔀 เงื่อนไข'}
                              {block.category === 'loop' && '🔁 ทำซ้ำ'}
                            </span>
                            <strong className="brick-function-name">
                              {block.functionName === 'now' && 'วันที่และเวลาปัจจุบัน (NOW)'}
                              {block.functionName === 'add_days' && 'บวก/ลบวัน (Add Days - วันหมดอายุ)'}
                              {block.functionName === 'add_months' && 'บวก/ลบเดือน (+Months)'}
                              {block.functionName === 'add_years' && 'บวก/ลบปี (+Years)'}
                              {block.functionName === 'format_date' && 'แปลงรูปแบบวันที่ (Format)'}
                              {block.functionName === 'date_part' && 'ดึงเฉพาะส่วนวันที่ (Part)'}
                              {block.functionName === 'concat' && 'ต่อข้อความ / คำนำหน้า (Concat)'}
                              {block.functionName === 'pad_start' && 'เติมเลข 0 ด้านหน้า (Pad Start)'}
                              {block.functionName === 'pad_end' && 'เติมตัวอักษรด้านหลัง (Pad End)'}
                              {block.functionName === 'substring' && 'ตัดข้อความบางส่วน (Substring)'}
                              {block.functionName === 'uppercase' && 'แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)'}
                              {block.functionName === 'lowercase' && 'แปลงเป็นตัวพิมพ์เล็ก (lowercase)'}
                              {block.functionName === 'replace' && 'ค้นหาและแทนที่คำ (Replace)'}
                              {block.functionName === 'trim' && 'ตัดช่องว่างหน้า-หลัง (Trim)'}
                              {block.functionName === 'counter' && 'รันเลขลำดับอัตโนมัติ (Auto Counter)'}
                              {block.functionName === 'math_op' && 'คำนวณคณิตศาสตร์ (+, -, *, /)'}
                              {block.functionName === 'round' && 'ปัดเศษทศนิยม (Round)'}
                              {block.functionName === 'if_else' && 'เงื่อนไข (IF / THEN / ELSE)'}
                              {block.functionName === 'repeat' && 'ทำซ้ำข้อความ (Repeat)'}
                            </strong>
                          </div>

                          {/* Action Buttons: Up, Down, Delete (with solid high-contrast styling) */}
                          <div className="brick-controls">
                            {!isFirst && (
                              <button
                                type="button"
                                className="brick-btn-up"
                                title="เลื่อนชิ้นนี้ขึ้น"
                                onClick={() => moveBlock(block.id, -1)}
                              >
                                <ChevronUp size={14} strokeWidth={2.5} />
                              </button>
                            )}
                            {!isLast && (
                              <button
                                type="button"
                                className="brick-btn-down"
                                title="เลื่อนชิ้นนี้ลง"
                                onClick={() => moveBlock(block.id, 1)}
                              >
                                <ChevronDown size={14} strokeWidth={2.5} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="brick-btn-delete"
                              title="ลบชิ้นเลโก้นี้"
                              onClick={() => removeBlock(block.id)}
                            >
                              <Trash2 size={13} strokeWidth={2.2} />
                              <span>ลบ</span>
                            </button>
                          </div>
                        </div>

                        {/* Brick Body: Natural Thai Sentences with Clean Inputs */}
                        <div className="brick-body">
                          {/* now */}
                          {block.functionName === 'now' && (
                            <div className="sentence-row">
                              <span className="sentence-text">แสดงวันที่ในรูปแบบ:</span>
                              <select
                                className="brick-select"
                                value={block.params.format ?? 'DD/MM/YYYY'}
                                onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                              >
                                <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                                <option value="DD-MM-YYYY">15-10-2026</option>
                                <option value="DD/MM/YY">15/10/26 (ปี 2 หลัก)</option>
                                <option value="HH:mm:ss">HH:mm:ss (เวลา)</option>
                              </select>
                            </div>
                          )}

                          {/* add_days */}
                          {block.functionName === 'add_days' && (
                            <div className="sentence-row">
                              <span className="sentence-text">บวกเพิ่ม:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.days ?? 30}
                                onChange={(e) => updateBlock(block.id, {days: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">วัน</span>
                              <span className="sentence-text">ในรูปแบบ:</span>
                              <select
                                className="brick-select"
                                value={block.params.format ?? 'DD/MM/YYYY'}
                                onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                              >
                                <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                                <option value="DD/MM/YY">15/10/26 (DD/MM/YY)</option>
                              </select>
                            </div>
                          )}

                          {/* add_months */}
                          {block.functionName === 'add_months' && (
                            <div className="sentence-row">
                              <span className="sentence-text">บวกเพิ่ม:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.months ?? 1}
                                onChange={(e) => updateBlock(block.id, {months: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">เดือน</span>
                              <span className="sentence-text">ในรูปแบบ:</span>
                              <select
                                className="brick-select"
                                value={block.params.format ?? 'DD/MM/YYYY'}
                                onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                              >
                                <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                              </select>
                            </div>
                          )}

                          {/* add_years */}
                          {block.functionName === 'add_years' && (
                            <div className="sentence-row">
                              <span className="sentence-text">บวกเพิ่ม:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.years ?? 1}
                                onChange={(e) => updateBlock(block.id, {years: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">ปี</span>
                              <span className="sentence-text">ในรูปแบบ:</span>
                              <select
                                className="brick-select"
                                value={block.params.format ?? 'DD/MM/YYYY'}
                                onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                              >
                                <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                              </select>
                            </div>
                          )}

                          {/* format_date */}
                          {block.functionName === 'format_date' && (
                            <div className="sentence-row">
                              <span className="sentence-text">เปลี่ยนเป็นรูปแบบ:</span>
                              <input
                                type="text"
                                className="brick-text-input"
                                style={{width: 150}}
                                value={block.params.format ?? 'DD/MM/YYYY'}
                                onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                              />
                              <span className="sentence-hint">(เช่น DD/MM/YYYY, YYYY-MM-DD)</span>
                            </div>
                          )}

                          {/* date_part */}
                          {block.functionName === 'date_part' && (
                            <div className="sentence-row">
                              <span className="sentence-text">ตัดเอาเฉพาะ:</span>
                              <select
                                className="brick-select"
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
                            <div className="sentence-row">
                              <span className="sentence-text">ข้อความนำหน้า:</span>
                              <input
                                type="text"
                                className="brick-text-input"
                                style={{width: 120}}
                                placeholder="เช่น LOT- หรือ EXP:"
                                value={block.params.prefix ?? ''}
                                onChange={(e) => updateBlock(block.id, {prefix: e.target.value})}
                              />
                              <span className="sentence-text">+ (ผลลัพธ์เดิม) +</span>
                              <span className="sentence-text">ข้อความต่อท้าย:</span>
                              <input
                                type="text"
                                className="brick-text-input"
                                style={{width: 120}}
                                placeholder="เช่น -TH หรือ (A)"
                                value={block.params.append ?? ''}
                                onChange={(e) => updateBlock(block.id, {append: e.target.value})}
                              />
                            </div>
                          )}

                          {/* pad_start */}
                          {block.functionName === 'pad_start' && (
                            <div className="sentence-row">
                              <span className="sentence-text">เติมตัวอักษร:</span>
                              <input
                                type="text"
                                className="brick-mini-input"
                                value={block.params.char ?? '0'}
                                onChange={(e) => updateBlock(block.id, {char: e.target.value})}
                              />
                              <span className="sentence-text">ทางด้านหน้า ให้ครบ:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.length ?? 4}
                                onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">หลัก</span>
                              <span className="sentence-hint">(เช่น 1 ➔ 0001)</span>
                            </div>
                          )}

                          {/* pad_end */}
                          {block.functionName === 'pad_end' && (
                            <div className="sentence-row">
                              <span className="sentence-text">เติมตัวอักษร:</span>
                              <input
                                type="text"
                                className="brick-mini-input"
                                value={block.params.char ?? ' '}
                                onChange={(e) => updateBlock(block.id, {char: e.target.value})}
                              />
                              <span className="sentence-text">ทางด้านหลัง ให้ครบ:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.length ?? 8}
                                onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">หลัก</span>
                            </div>
                          )}

                          {/* substring */}
                          {block.functionName === 'substring' && (
                            <div className="sentence-row">
                              <span className="sentence-text">ตัดข้อความเริ่มจากตัวที่:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.start ?? 0}
                                onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                              />
                              <span className="sentence-text">ความยาว:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.length ?? 5}
                                onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">ตัวอักษร</span>
                            </div>
                          )}

                          {/* uppercase / lowercase / trim */}
                          {block.functionName === 'uppercase' && (
                            <div className="sentence-row">
                              <span className="sentence-note">✓ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์ใหญ่ (UPPERCASE)</span>
                            </div>
                          )}
                          {block.functionName === 'lowercase' && (
                            <div className="sentence-row">
                              <span className="sentence-note">✓ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์เล็ก (lowercase)</span>
                            </div>
                          )}
                          {block.functionName === 'trim' && (
                            <div className="sentence-row">
                              <span className="sentence-note">✓ ตัดช่องว่างด้านหน้าและด้านหลังข้อความออก</span>
                            </div>
                          )}

                          {/* replace */}
                          {block.functionName === 'replace' && (
                            <div className="sentence-row">
                              <span className="sentence-text">ค้นหาคำว่า:</span>
                              <input
                                type="text"
                                className="brick-text-input"
                                style={{width: 120}}
                                value={block.params.search ?? ''}
                                onChange={(e) => updateBlock(block.id, {search: e.target.value})}
                              />
                              <span className="sentence-text">แทนที่ด้วย:</span>
                              <input
                                type="text"
                                className="brick-text-input"
                                style={{width: 120}}
                                value={block.params.replace ?? ''}
                                onChange={(e) => updateBlock(block.id, {replace: e.target.value})}
                              />
                            </div>
                          )}

                          {/* counter */}
                          {block.functionName === 'counter' && (
                            <div className="sentence-row">
                              <span className="sentence-text">เริ่มต้นที่เลข:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.start ?? 1}
                                onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                              />
                              <span className="sentence-text">เติมเลข 0 ให้ครบ:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.padZeros ?? 4}
                                onChange={(e) => updateBlock(block.id, {padZeros: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">หลัก</span>
                              <span className="sentence-hint">(เช่น 1 ➔ 0001)</span>
                            </div>
                          )}

                          {/* math_op */}
                          {block.functionName === 'math_op' && (
                            <div className="sentence-row">
                              <span className="sentence-text">คำนวณ:</span>
                              <select
                                className="brick-select"
                                value={block.params.op ?? 'add'}
                                onChange={(e) => updateBlock(block.id, {op: e.target.value})}
                              >
                                <option value="add">บวก (+)</option>
                                <option value="subtract">ลบ (-)</option>
                                <option value="multiply">คูณ (×)</option>
                                <option value="divide">หาร (÷)</option>
                              </select>
                              <span className="sentence-text">ด้วยตัวเลข:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.value ?? 10}
                                onChange={(e) => updateBlock(block.id, {value: Number(e.target.value)})}
                              />
                            </div>
                          )}

                          {/* round */}
                          {block.functionName === 'round' && (
                            <div className="sentence-row">
                              <span className="sentence-text">ปัดเศษทศนิยม:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.decimals ?? 2}
                                min={0}
                                max={6}
                                onChange={(e) => updateBlock(block.id, {decimals: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">ตำแหน่ง</span>
                            </div>
                          )}

                          {/* if_else */}
                          {block.functionName === 'if_else' && (
                            <div className="sentence-column">
                              <div className="sentence-row">
                                <span className="sentence-text">ถ้าข้อมูล:</span>
                                <select
                                  className="brick-select"
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
                                    className="brick-text-input"
                                    style={{width: 120}}
                                    placeholder="คำที่ต้องการเทียบ"
                                    value={block.params.target ?? ''}
                                    onChange={(e) => updateBlock(block.id, {target: e.target.value})}
                                  />
                                )}
                              </div>
                              <div className="sentence-row" style={{marginTop: 6}}>
                                <span className="sentence-cond-tag true-tag">✓ ถ้าจริง แสดง:</span>
                                <input
                                  type="text"
                                  className="brick-text-input"
                                  style={{width: 140}}
                                  value={block.params.thenValue ?? 'พร้อมจำหน่าย'}
                                  onChange={(e) => updateBlock(block.id, {thenValue: e.target.value})}
                                />
                                <span className="sentence-cond-tag false-tag">✗ ถ้าไม่จริง แสดง:</span>
                                <input
                                  type="text"
                                  className="brick-text-input"
                                  style={{width: 140}}
                                  value={block.params.elseValue ?? 'สินค้าหมด'}
                                  onChange={(e) => updateBlock(block.id, {elseValue: e.target.value})}
                                />
                              </div>
                            </div>
                          )}

                          {/* repeat */}
                          {block.functionName === 'repeat' && (
                            <div className="sentence-row">
                              <span className="sentence-text">ทำซ้ำข้อความ:</span>
                              <input
                                type="text"
                                className="brick-text-input"
                                style={{width: 90}}
                                value={block.params.text ?? '*'}
                                onChange={(e) => updateBlock(block.id, {text: e.target.value})}
                              />
                              <span className="sentence-text">จำนวน:</span>
                              <input
                                type="number"
                                className="brick-num-input"
                                value={block.params.times ?? 5}
                                onChange={(e) => updateBlock(block.id, {times: Number(e.target.value)})}
                              />
                              <span className="sentence-unit">ครั้ง</span>
                            </div>
                          )}
                        </div>

                        {/* Brick Step Output Preview Footer */}
                        <div className="brick-step-output-footer">
                          <span className="step-output-label">✨ ผลลัพธ์ของขั้นตอนนี้:</span>
                          <strong className="step-output-value">{stepResult}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add More Bricks Action at End of Chain */}
              {activeFormula && activeFormula.blocks.length > 0 && (
                <div className="chain-end-actions">
                  <div className="chain-end-line" />
                  <span className="chain-end-badge">
                    <Sparkles size={13} color="#2563eb" /> เลือกชิ้นส่วนจากแถบซ้ายมือเพื่อต่อเพิ่ม
                  </span>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ================= BOTTOM ACTION BAR ================= */}
        <div className="lego-bottom-bar">
          <div className="bottom-left-tip">
            <span>💡 ตัวอย่างผลลัพธ์นี้จะถูกส่งไปแสดงบนช่องบาร์โค้ดหรือข้อความบนฉลากของคุณ</span>
          </div>
          <div className="bottom-actions-group">
            <button type="button" className="lego-btn-cancel" onClick={onClose}>
              ยกเลิก (Cancel)
            </button>
            <button type="button" className="lego-btn-save" onClick={handleSave}>
              ✨ บันทึกการตั้งค่าสูตร (Save Formula)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
