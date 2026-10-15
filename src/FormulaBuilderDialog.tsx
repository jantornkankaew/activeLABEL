import {useState, useMemo} from 'react';
import {
  Plus,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Zap,
  Calendar,
  Type,
  Hash,
  GitBranch,
  ArrowDown,
  Check,
  Maximize2,
  Minimize2,
  Copy,
  Layers,
  Sparkles,
  Repeat,
  Variable as VariableIcon,
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
  icon: string;
  desc: string;
  blocks: FormulaBlock[];
};

const PRESET_RECIPES: PresetRecipe[] = [
  {
    id: 'exp_30_days',
    name: 'วันหมดอายุ (+30 วัน)',
    icon: '📅',
    desc: 'วันปัจจุบัน + 30 วัน (เช่น 14/11/2026)',
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
    icon: '📅',
    desc: 'วันปัจจุบัน + 1 ปี (เช่น 15/10/2027)',
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
    icon: '📦',
    desc: 'รหัส Lot ตามวันที่ เช่น LOT-20261015',
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
    name: 'รหัสรันเลขอัตโนมัติ (SEQ-0001)',
    icon: '🔢',
    desc: 'รันลำดับตัวเลข 4 หลัก มีคำนำหน้า',
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
    name: 'แปลงเป็นตัวพิมพ์ใหญ่',
    icon: '🔤',
    desc: 'เปลี่ยนตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์ใหญ่',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'uppercase',
        params: {},
      },
    ],
  },
  {
    id: 'price_vat',
    name: 'คำนวณราคา + VAT 7%',
    icon: '💰',
    desc: 'คูณ 1.07 และปัดทศนิยม 2 ตำแหน่ง',
    blocks: [
      {
        id: 'b1',
        category: 'numeric',
        functionName: 'math_op',
        params: {op: 'mul', value: 1.07},
      },
      {
        id: 'b2',
        category: 'numeric',
        functionName: 'round',
        params: {decimals: 2},
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

  const [isMaximized, setIsMaximized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeVarMenu, setActiveVarMenu] = useState<{
    blockId: string;
    fieldKey: string;
  } | null>(null);

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

  function duplicateBlock(blockId: string) {
    if (!activeFormula) return;
    const idx = activeFormula.blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const target = activeFormula.blocks[idx];
    const cloned: FormulaBlock = {
      ...structuredClone(target),
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    const next = [...activeFormula.blocks];
    next.splice(idx + 1, 0, cloned);
    updateActiveFormula({blocks: next});
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

  function insertVariableIntoParam(blockId: string, fieldKey: string, varName: string) {
    if (!activeFormula) return;
    const block = activeFormula.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentVal = String(block.params[fieldKey] ?? '');
    const newVal = currentVal + `{{${varName}}}`;
    updateBlock(blockId, {[fieldKey]: newVal});
    setActiveVarMenu(null);
  }

  function copyResultToClipboard() {
    if (!finalResult) return;
    navigator.clipboard?.writeText(finalResult).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="modal-backdrop">
      <div
        className={`modal minimal-formula-modal ${isMaximized ? 'is-maximized' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="formula-title"
      >
        {/* ================= HEADER ================= */}
        <header className="min-header">
          <div className="min-header-left">
            <div className="min-brand-badge">
              <span className="min-lego-icon">🧱</span>
              <strong className="min-brand-text">LEGO Formula Studio</strong>
            </div>

            <div className="min-formula-tabs">
              {list.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`min-tab-pill ${f.id === activeId ? 'active' : ''}`}
                  onClick={() => setActiveId(f.id)}
                >
                  <span className="tab-pill-icon">🧩</span>
                  {f.name || 'Untitled Formula'}
                </button>
              ))}
              <button
                type="button"
                className="min-add-tab-btn"
                title="สร้างสูตรใหม่"
                onClick={addFormula}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>เพิ่มสูตร</span>
              </button>
            </div>
          </div>

          <div className="min-header-right">
            <button
              type="button"
              className="min-header-btn"
              title={isMaximized ? 'ย่อขนาดหน้าต่าง' : 'ขยายเต็มจอ (Maximize)'}
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              className="min-close-btn"
              aria-label="Close dialog"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ================= STUDIO 2-PANEL BODY ================= */}
        <div className="formula-studio-body">
          {/* ================= LEFT SIDEBAR: BLOCK PALETTE ================= */}
          <aside className="formula-palette-sidebar">
            {/* Quick 1-Click Templates */}
            <div className="palette-section">
              <div className="palette-section-title">
                <Zap size={14} fill="#eab308" color="#eab308" />
                <span>แม่แบบยอดนิยม (1 คลิกพร้อมใช้)</span>
              </div>
              <div className="palette-preset-grid">
                {PRESET_RECIPES.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className="palette-preset-btn"
                    onClick={() => applyPreset(recipe)}
                    title={recipe.desc}
                  >
                    <span className="preset-btn-icon">{recipe.icon}</span>
                    <div className="preset-btn-text">
                      <strong>{recipe.name}</strong>
                      <small>{recipe.desc}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="palette-divider" />

            {/* Block Catalog By Category */}
            <div className="palette-section">
              <div className="palette-section-title">
                <Layers size={14} color="#3b82f6" />
                <span>คลังชิ้นส่วน LEGO (คลิกเพื่อต่อบล็อก)</span>
              </div>

              {/* 1. Date & Time Category */}
              <div className="palette-cat-group">
                <div className="palette-cat-header cat-datetime">
                  <Calendar size={13} />
                  <span>📅 วันที่ & เวลา (Date & Time)</span>
                </div>
                <div className="palette-buttons-list">
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('datetime', 'add_days', {days: 30, format: 'DD/MM/YYYY'})
                    }
                  >
                    <span className="brick-btn-tag cat-datetime">+</span>
                    <span>บวกวันหมดอายุ (+วัน)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() => addBlock('datetime', 'now', {format: 'DD/MM/YYYY'})}
                  >
                    <span className="brick-btn-tag cat-datetime">+</span>
                    <span>วันที่ปัจจุบัน (NOW)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('datetime', 'add_months', {months: 1, format: 'DD/MM/YYYY'})
                    }
                  >
                    <span className="brick-btn-tag cat-datetime">+</span>
                    <span>บวก/ลบเดือน (+Months)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('datetime', 'add_years', {years: 1, format: 'DD/MM/YYYY'})
                    }
                  >
                    <span className="brick-btn-tag cat-datetime">+</span>
                    <span>บวก/ลบปี (+Years)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('datetime', 'format_date', {format: 'DD/MM/YYYY'})
                    }
                  >
                    <span className="brick-btn-tag cat-datetime">+</span>
                    <span>แปลงรูปแบบวันที่ (Format)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() => addBlock('datetime', 'date_part', {part: 'YYYY'})}
                  >
                    <span className="brick-btn-tag cat-datetime">+</span>
                    <span>ดึงเฉพาะปี / เดือน / วัน</span>
                  </button>
                </div>
              </div>

              {/* 2. Text & Variables Category */}
              <div className="palette-cat-group">
                <div className="palette-cat-header cat-string">
                  <Type size={13} />
                  <span>🔤 ข้อความ & ตัวแปร (Text & Variables)</span>
                </div>
                <div className="palette-buttons-list">
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('string', 'variable', {
                        variableName: variables[0]?.name || '',
                      })
                    }
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>🧩 ดึงค่าตัวแปร (Use Variable)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('string', 'concat', {prefix: '', append: ''})
                    }
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>เติมคำนำหน้า / ต่อท้าย</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('string', 'pad_start', {length: 4, char: '0'})
                    }
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>เติมเลข 0 ด้านหน้า (เช่น 0001)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() => addBlock('string', 'uppercase', {})}
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() => addBlock('string', 'lowercase', {})}
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>แปลงเป็นตัวพิมพ์เล็ก (lowercase)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('string', 'substring', {start: 0, length: 5})
                    }
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>ตัดข้อความบางส่วน (Substring)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('string', 'replace', {search: '', replace: ''})
                    }
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>ค้นหาและแทนที่คำ (Replace)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() => addBlock('string', 'trim', {})}
                  >
                    <span className="brick-btn-tag cat-string">+</span>
                    <span>ตัดช่องว่างหน้า-หลัง (Trim)</span>
                  </button>
                </div>
              </div>

              {/* 3. Numbers & Math Category */}
              <div className="palette-cat-group">
                <div className="palette-cat-header cat-numeric">
                  <Hash size={13} />
                  <span>🔢 ตัวเลข & การคำนวณ (Numbers & Math)</span>
                </div>
                <div className="palette-buttons-list">
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('numeric', 'counter', {start: 1, padZeros: 4})
                    }
                  >
                    <span className="brick-btn-tag cat-numeric">+</span>
                    <span>รันเลขลำดับอัตโนมัติ (Counter)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('numeric', 'math_op', {op: 'add', value: 10})
                    }
                  >
                    <span className="brick-btn-tag cat-numeric">+</span>
                    <span>คำนวณ (+ - × ÷)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('numeric', 'round', {decimals: 2})
                    }
                  >
                    <span className="brick-btn-tag cat-numeric">+</span>
                    <span>ปัดเศษทศนิยม (Round)</span>
                  </button>
                </div>
              </div>

              {/* 4. Logic & Loops */}
              <div className="palette-cat-group">
                <div className="palette-cat-header cat-if">
                  <GitBranch size={13} />
                  <span>🔀 เงื่อนไข & วนซ้ำ (Logic & Loops)</span>
                </div>
                <div className="palette-buttons-list">
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('if', 'if_else', {
                        operator: 'is_not_empty',
                        thenValue: 'พร้อมจำหน่าย',
                        elseValue: 'สินค้าหมด',
                      })
                    }
                  >
                    <span className="brick-btn-tag cat-if">+</span>
                    <span>ถ้าเงื่อนไขตรง (IF / ELSE)</span>
                  </button>
                  <button
                    type="button"
                    className="palette-brick-btn"
                    onClick={() =>
                      addBlock('loop', 'repeat', {text: '*', times: 5, separator: ''})
                    }
                  >
                    <span className="brick-btn-tag cat-loop">+</span>
                    <span>ทำซ้ำข้อความ (Repeat)</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* ================= RIGHT MAIN WORKSPACE ================= */}
          <main className="formula-canvas-pane">
            {/* Top Workspace Bar: Name & Big Live Result */}
            <div className="workspace-top-bar">
              <div className="workspace-name-col">
                <label className="workspace-name-label">ชื่อสูตรที่กำลังแก้ไข:</label>
                <div className="workspace-name-wrap">
                  <input
                    type="text"
                    className="workspace-name-input"
                    value={activeFormula?.name ?? ''}
                    placeholder="เช่น วันหมดอายุ (+30 วัน)"
                    onChange={(e) => updateActiveFormula({name: e.target.value})}
                  />
                  {list.length > 1 && (
                    <button
                      type="button"
                      className="workspace-del-formula-btn"
                      title="ลบสูตรนี้"
                      onClick={() => removeFormula(activeId)}
                    >
                      <Trash2 size={14} />
                      <span>ลบสูตรนี้</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Large Prominent Live Result Card */}
              <div className="workspace-result-card">
                <div className="result-card-header">
                  <span className="result-tag">
                    <Sparkles size={12} /> ผลลัพธ์สูตรจำลอง (Live Preview)
                  </span>
                  <button
                    type="button"
                    className="result-copy-btn"
                    title="คัดลอกผลลัพธ์"
                    onClick={copyResultToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check size={12} color="#16a34a" /> คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> คัดลอก
                      </>
                    )}
                  </button>
                </div>
                <div className="result-card-val" title="ผลลัพธ์ที่คำนวณได้จริง">
                  {finalResult || <span className="val-empty">(ไม่มีผลลัพธ์)</span>}
                </div>
              </div>
            </div>

            {/* Document Variables Banner (if available) */}
            {variables && variables.length > 0 && (
              <div className="workspace-vars-banner">
                <div className="vars-banner-left">
                  <VariableIcon size={13} color="#2563eb" />
                  <strong>ตัวแปรในโปรเจกต์นี้:</strong>
                </div>
                <div className="vars-pills-row">
                  {variables.map((v) => (
                    <span
                      key={v.name}
                      className="var-preview-pill"
                      title={`ชื่อตัวแปร: {{${v.name}}} = "${v.value || ''}"`}
                    >
                      <span className="var-pill-name">{v.name}</span>
                      <span className="var-pill-eq">=</span>
                      <span className="var-pill-val">"{v.value || ''}"</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas Area: LEGO Chain Stack */}
            <div className="workspace-lego-canvas">
              {!activeFormula || activeFormula.blocks.length === 0 ? (
                <div className="lego-empty-hero">
                  <div className="empty-hero-icon">🧱</div>
                  <h3>ยังไม่มีชิ้นส่วนในสูตรนี้</h3>
                  <p>
                    เลือกแม่แบบสำเร็จรูป ⚡ หรือคลิกปุ่มชิ้นส่วน LEGO 🧱 ในเมนูด้านซ้ายเพื่อเริ่มต่อบล็อก
                  </p>
                </div>
              ) : (
                <div className="lego-chain-stack">
                  {activeFormula.blocks.map((block, index) => {
                    const isFirst = index === 0;
                    const isLast = index === activeFormula.blocks.length - 1;
                    const stepVal = stepOutputs[index] ?? '';

                    return (
                      <div key={block.id} className="lego-step-wrapper">
                        {/* Connecting visual arrow */}
                        {index > 0 && (
                          <div className="lego-connector-flow">
                            <div className="flow-line" />
                            <div className="flow-badge">
                              <ArrowDown size={13} strokeWidth={2.5} />
                              <span>ส่งผลลัพธ์ต่อไปยังชิ้นถัดไป</span>
                            </div>
                            <div className="flow-line" />
                          </div>
                        )}

                        {/* Genuine LEGO Card */}
                        <div className={`lego-brick-card cat-${block.category}`}>
                          {/* 3D Studs on top of card */}
                          <div className="lego-studs-bar">
                            <span className="lego-stud" />
                            <span className="lego-stud" />
                            <span className="lego-stud" />
                            <span className="lego-stud" />
                            <span className="lego-stud" />
                            <span className="lego-stud" />
                          </div>

                          {/* Brick Header */}
                          <div className="brick-card-header">
                            <div className="brick-header-left">
                              <span className="brick-step-badge">
                                ขั้นที่ {index + 1}
                              </span>
                              <span className={`brick-cat-tag cat-${block.category}`}>
                                {block.category === 'datetime' && '📅 วันที่'}
                                {block.category === 'string' && '🔤 ข้อความ'}
                                {block.category === 'numeric' && '🔢 ตัวเลข'}
                                {block.category === 'if' && '🔀 เงื่อนไข'}
                                {block.category === 'loop' && '🔁 ทำซ้ำ'}
                              </span>
                              <strong className="brick-title-text">
                                {block.functionName === 'now' && 'วันที่ปัจจุบัน (NOW)'}
                                {block.functionName === 'add_days' && 'บวก/ลบวัน (วันหมดอายุ)'}
                                {block.functionName === 'add_months' && 'บวก/ลบเดือน'}
                                {block.functionName === 'add_years' && 'บวก/ลบปี'}
                                {block.functionName === 'format_date' && 'แปลงรูปแบบวันที่'}
                                {block.functionName === 'date_part' && 'ดึงส่วนวันที่'}
                                {block.functionName === 'variable' && 'ดึงค่าตัวแปร (Variable)'}
                                {block.functionName === 'concat' && 'ต่อข้อความ / เติมคำนำหน้า'}
                                {block.functionName === 'pad_start' && 'เติมเลข 0 ด้านหน้า'}
                                {block.functionName === 'pad_end' && 'เติมตัวอักษรด้านหลัง'}
                                {block.functionName === 'substring' && 'ตัดข้อความบางส่วน'}
                                {block.functionName === 'uppercase' && 'แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)'}
                                {block.functionName === 'lowercase' && 'แปลงเป็นตัวพิมพ์เล็ก (lowercase)'}
                                {block.functionName === 'replace' && 'ค้นหาและแทนที่คำ'}
                                {block.functionName === 'trim' && 'ตัดช่องว่างหน้า-หลัง'}
                                {block.functionName === 'counter' && 'รันเลขลำดับอัตโนมัติ'}
                                {block.functionName === 'math_op' && 'คำนวณตัวเลข (+ - × ÷)'}
                                {block.functionName === 'round' && 'ปัดเศษทศนิยม'}
                                {block.functionName === 'if_else' && 'เงื่อนไข (IF/ELSE)'}
                                {block.functionName === 'repeat' && 'ทำซ้ำข้อความ'}
                              </strong>
                            </div>

                            <div className="brick-header-right">
                              {/* Intermediate result pill */}
                              <div className="brick-intermediate-result" title="ผลลัพธ์ของขั้นตอนนี้">
                                <span className="inter-lbl">ได้ค่า:</span>
                                <strong className="inter-val">{stepVal}</strong>
                              </div>

                              {/* Brick action buttons */}
                              <div className="brick-actions-bar">
                                {!isFirst && (
                                  <button
                                    type="button"
                                    className="brick-act-btn"
                                    title="เลื่อนขึ้น"
                                    onClick={() => moveBlock(block.id, -1)}
                                  >
                                    <ChevronUp size={14} strokeWidth={2.5} />
                                  </button>
                                )}
                                {!isLast && (
                                  <button
                                    type="button"
                                    className="brick-act-btn"
                                    title="เลื่อนลง"
                                    onClick={() => moveBlock(block.id, 1)}
                                  >
                                    <ChevronDown size={14} strokeWidth={2.5} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="brick-act-btn"
                                  title="ทำซ้ำชิ้นส่วนนี้"
                                  onClick={() => duplicateBlock(block.id)}
                                >
                                  <Copy size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="brick-act-btn del-btn"
                                  title="ลบชิ้นส่วนนี้"
                                  onClick={() => removeBlock(block.id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Brick Content & Controls */}
                          <div className="brick-card-body">
                            {/* now */}
                            {block.functionName === 'now' && (
                              <div className="control-row-natural">
                                <span className="control-label">รูปแบบวันที่แสดงผล:</span>
                                <select
                                  className="studio-select"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                >
                                  <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY - แบบไทยสากล)</option>
                                  <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD - ISO มาตรฐาน)</option>
                                  <option value="YYYYMMDD">20261015 (YYYYMMDD - สำหรับบาร์โค้ด)</option>
                                  <option value="DD-MM-YYYY">15-10-2026 (DD-MM-YYYY)</option>
                                  <option value="DD/MM/YY">15/10/26 (DD/MM/YY - ย่อปี)</option>
                                </select>
                              </div>
                            )}

                            {/* add_days */}
                            {block.functionName === 'add_days' && (
                              <div className="brick-control-flow">
                                <div className="control-row-natural">
                                  <span className="control-label">บวกเพิ่มจากวันนี้:</span>
                                  <input
                                    type="number"
                                    className="studio-input-number"
                                    value={block.params.days ?? 30}
                                    onChange={(e) => updateBlock(block.id, {days: Number(e.target.value)})}
                                  />
                                  <span className="control-unit">วัน</span>

                                  {/* Quick Day Shortcut Pills */}
                                  <div className="quick-shortcut-pills">
                                    <button type="button" onClick={() => updateBlock(block.id, {days: 7})}>+7 วัน</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {days: 14})}>+14 วัน</button>
                                    <button type="button" className="active" onClick={() => updateBlock(block.id, {days: 30})}>+30 วัน</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {days: 60})}>+60 วัน</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {days: 90})}>+90 วัน</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {days: 365})}>+1 ปี (365)</button>
                                  </div>
                                </div>

                                <div className="control-row-natural">
                                  <span className="control-label">รูปแบบแสดงผล:</span>
                                  <select
                                    className="studio-select"
                                    value={block.params.format ?? 'DD/MM/YYYY'}
                                    onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                  >
                                    <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                    <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                    <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                                    <option value="DD/MM/YY">15/10/26 (DD/MM/YY)</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* add_months */}
                            {block.functionName === 'add_months' && (
                              <div className="brick-control-flow">
                                <div className="control-row-natural">
                                  <span className="control-label">บวกเพิ่ม:</span>
                                  <input
                                    type="number"
                                    className="studio-input-number"
                                    value={block.params.months ?? 1}
                                    onChange={(e) => updateBlock(block.id, {months: Number(e.target.value)})}
                                  />
                                  <span className="control-unit">เดือน</span>

                                  <div className="quick-shortcut-pills">
                                    <button type="button" onClick={() => updateBlock(block.id, {months: 1})}>+1 เดือน</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {months: 3})}>+3 เดือน</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {months: 6})}>+6 เดือน</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {months: 12})}>+12 เดือน</button>
                                  </div>
                                </div>

                                <div className="control-row-natural">
                                  <span className="control-label">รูปแบบ:</span>
                                  <select
                                    className="studio-select"
                                    value={block.params.format ?? 'DD/MM/YYYY'}
                                    onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                  >
                                    <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                    <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                    <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* add_years */}
                            {block.functionName === 'add_years' && (
                              <div className="brick-control-flow">
                                <div className="control-row-natural">
                                  <span className="control-label">บวกเพิ่ม:</span>
                                  <input
                                    type="number"
                                    className="studio-input-number"
                                    value={block.params.years ?? 1}
                                    onChange={(e) => updateBlock(block.id, {years: Number(e.target.value)})}
                                  />
                                  <span className="control-unit">ปี</span>

                                  <div className="quick-shortcut-pills">
                                    <button type="button" onClick={() => updateBlock(block.id, {years: 1})}>+1 ปี</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {years: 2})}>+2 ปี</button>
                                    <button type="button" onClick={() => updateBlock(block.id, {years: 3})}>+3 ปี</button>
                                  </div>
                                </div>

                                <div className="control-row-natural">
                                  <span className="control-label">รูปแบบ:</span>
                                  <select
                                    className="studio-select"
                                    value={block.params.format ?? 'DD/MM/YYYY'}
                                    onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                  >
                                    <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                    <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                    <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* format_date */}
                            {block.functionName === 'format_date' && (
                              <div className="control-row-natural">
                                <span className="control-label">แปลงรูปแบบวันที่เป็น:</span>
                                <input
                                  type="text"
                                  className="studio-input-text"
                                  style={{width: 160}}
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                                />
                                <div className="quick-shortcut-pills">
                                  <button type="button" onClick={() => updateBlock(block.id, {format: 'DD/MM/YYYY'})}>DD/MM/YYYY</button>
                                  <button type="button" onClick={() => updateBlock(block.id, {format: 'YYYY-MM-DD'})}>YYYY-MM-DD</button>
                                  <button type="button" onClick={() => updateBlock(block.id, {format: 'YYYYMMDD'})}>YYYYMMDD</button>
                                </div>
                              </div>
                            )}

                            {/* date_part */}
                            {block.functionName === 'date_part' && (
                              <div className="control-row-natural">
                                <span className="control-label">ดึงข้อมูลเฉพาะ:</span>
                                <select
                                  className="studio-select"
                                  value={block.params.part ?? 'YYYY'}
                                  onChange={(e) => updateBlock(block.id, {part: e.target.value})}
                                >
                                  <option value="YYYY">ปี ค.ศ. 4 หลัก (เช่น 2026)</option>
                                  <option value="YY">ปี ค.ศ. 2 หลัก (เช่น 26)</option>
                                  <option value="MM">เดือน 2 หลัก (เช่น 10)</option>
                                  <option value="DD">วันที่ 2 หลัก (เช่น 15)</option>
                                </select>
                              </div>
                            )}

                            {/* variable */}
                            {block.functionName === 'variable' && (
                              <div className="control-row-natural">
                                <span className="control-label">เลือกตัวแปรที่จะนำมาใช้:</span>
                                {variables && variables.length > 0 ? (
                                  <select
                                    className="studio-select"
                                    value={block.params.variableName ?? ''}
                                    onChange={(e) => updateBlock(block.id, {variableName: e.target.value})}
                                  >
                                    <option value="">-- เลือกตัวแปร --</option>
                                    {variables.map((v) => (
                                      <option key={v.name} value={v.name}>
                                        {v.label ? `${v.label} (${v.name})` : v.name} {v.value ? `➔ "${v.value}"` : ''}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="hint-note">ยังไม่มีตัวแปรในโปรเจกต์นี้ (สร้างได้ที่ปุ่ม Variables ด้านบน)</span>
                                )}
                              </div>
                            )}

                            {/* concat */}
                            {block.functionName === 'concat' && (
                              <div className="control-row-natural">
                                <span className="control-label">ข้อความนำหน้า:</span>
                                <div className="input-with-var-btn">
                                  <input
                                    type="text"
                                    className="studio-input-text"
                                    placeholder="เช่น LOT- หรือ NO-"
                                    value={block.params.prefix ?? ''}
                                    onChange={(e) => updateBlock(block.id, {prefix: e.target.value})}
                                  />
                                  {variables && variables.length > 0 && (
                                    <div className="inline-var-popover-wrap">
                                      <button
                                        type="button"
                                        className="btn-insert-var"
                                        title="แทรกตัวแปร"
                                        onClick={() =>
                                          setActiveVarMenu(
                                            activeVarMenu?.blockId === block.id && activeVarMenu?.fieldKey === 'prefix'
                                              ? null
                                              : {blockId: block.id, fieldKey: 'prefix'}
                                          )
                                        }
                                      >
                                        <VariableIcon size={11} />
                                        <span>ตัวแปร</span>
                                      </button>
                                      {activeVarMenu?.blockId === block.id && activeVarMenu?.fieldKey === 'prefix' && (
                                        <div className="inline-var-menu">
                                          {variables.map((v) => (
                                            <button
                                              key={v.name}
                                              type="button"
                                              onClick={() => insertVariableIntoParam(block.id, 'prefix', v.name)}
                                            >
                                              {v.label || v.name} ({`{{${v.name}}}`})
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <span className="control-label" style={{marginLeft: 10}}>ข้อความต่อท้าย:</span>
                                <div className="input-with-var-btn">
                                  <input
                                    type="text"
                                    className="studio-input-text"
                                    placeholder="เช่น -TH หรือ /2026"
                                    value={block.params.append ?? ''}
                                    onChange={(e) => updateBlock(block.id, {append: e.target.value})}
                                  />
                                  {variables && variables.length > 0 && (
                                    <div className="inline-var-popover-wrap">
                                      <button
                                        type="button"
                                        className="btn-insert-var"
                                        title="แทรกตัวแปร"
                                        onClick={() =>
                                          setActiveVarMenu(
                                            activeVarMenu?.blockId === block.id && activeVarMenu?.fieldKey === 'append'
                                              ? null
                                              : {blockId: block.id, fieldKey: 'append'}
                                          )
                                        }
                                      >
                                        <VariableIcon size={11} />
                                        <span>ตัวแปร</span>
                                      </button>
                                      {activeVarMenu?.blockId === block.id && activeVarMenu?.fieldKey === 'append' && (
                                        <div className="inline-var-menu">
                                          {variables.map((v) => (
                                            <button
                                              key={v.name}
                                              type="button"
                                              onClick={() => insertVariableIntoParam(block.id, 'append', v.name)}
                                            >
                                              {v.label || v.name} ({`{{${v.name}}}`})
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* pad_start */}
                            {block.functionName === 'pad_start' && (
                              <div className="control-row-natural">
                                <span className="control-label">เติมตัวอักษร:</span>
                                <input
                                  type="text"
                                  className="studio-input-mini"
                                  value={block.params.char ?? '0'}
                                  onChange={(e) => updateBlock(block.id, {char: e.target.value})}
                                />
                                <span className="control-label">ด้านหน้าให้ครบ:</span>
                                <input
                                  type="number"
                                  className="studio-input-number"
                                  value={block.params.length ?? 4}
                                  onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                                />
                                <span className="control-unit">หลัก</span>

                                <div className="quick-shortcut-pills">
                                  <button type="button" onClick={() => updateBlock(block.id, {char: '0', length: 3})}>3 หลัก (001)</button>
                                  <button type="button" onClick={() => updateBlock(block.id, {char: '0', length: 4})}>4 หลัก (0001)</button>
                                  <button type="button" onClick={() => updateBlock(block.id, {char: '0', length: 6})}>6 หลัก (000001)</button>
                                </div>
                              </div>
                            )}

                            {/* substring */}
                            {block.functionName === 'substring' && (
                              <div className="control-row-natural">
                                <span className="control-label">ตัดเริ่มที่ตำแหน่งที่:</span>
                                <input
                                  type="number"
                                  className="studio-input-number"
                                  value={block.params.start ?? 0}
                                  onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                                />
                                <span className="control-label">ความยาว:</span>
                                <input
                                  type="number"
                                  className="studio-input-number"
                                  value={block.params.length ?? 5}
                                  onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                                />
                                <span className="control-unit">ตัวอักษร</span>
                              </div>
                            )}

                            {/* uppercase / lowercase / trim */}
                            {block.functionName === 'uppercase' && (
                              <div className="control-row-natural">
                                <span className="accent-tip-text">
                                  ✓ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์ใหญ่ (UPPERCASE)
                                </span>
                              </div>
                            )}
                            {block.functionName === 'lowercase' && (
                              <div className="control-row-natural">
                                <span className="accent-tip-text">
                                  ✓ แปลงตัวอักษรภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์เล็ก (lowercase)
                                </span>
                              </div>
                            )}
                            {block.functionName === 'trim' && (
                              <div className="control-row-natural">
                                <span className="accent-tip-text">
                                  ✓ ลบช่องว่างส่วนเกินที่อยู่ด้านหน้าและด้านหลังข้อความออก
                                </span>
                              </div>
                            )}

                            {/* replace */}
                            {block.functionName === 'replace' && (
                              <div className="control-row-natural">
                                <span className="control-label">ค้นหาคำว่า:</span>
                                <input
                                  type="text"
                                  className="studio-input-text"
                                  style={{width: 130}}
                                  value={block.params.search ?? ''}
                                  onChange={(e) => updateBlock(block.id, {search: e.target.value})}
                                />
                                <span className="control-label">แทนที่ด้วย:</span>
                                <input
                                  type="text"
                                  className="studio-input-text"
                                  style={{width: 130}}
                                  value={block.params.replace ?? ''}
                                  onChange={(e) => updateBlock(block.id, {replace: e.target.value})}
                                />
                              </div>
                            )}

                            {/* counter */}
                            {block.functionName === 'counter' && (
                              <div className="control-row-natural">
                                <span className="control-label">เริ่มต้นนับที่เลข:</span>
                                <input
                                  type="number"
                                  className="studio-input-number"
                                  value={block.params.start ?? 1}
                                  onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                                />
                                <span className="control-label">เติมเลข 0 ให้ครบ:</span>
                                <input
                                  type="number"
                                  className="studio-input-number"
                                  value={block.params.padZeros ?? 4}
                                  onChange={(e) => updateBlock(block.id, {padZeros: Number(e.target.value)})}
                                />
                                <span className="control-unit">หลัก</span>

                                <div className="quick-shortcut-pills">
                                  <button type="button" onClick={() => updateBlock(block.id, {padZeros: 3})}>3 หลัก (001)</button>
                                  <button type="button" onClick={() => updateBlock(block.id, {padZeros: 4})}>4 หลัก (0001)</button>
                                </div>
                              </div>
                            )}

                            {/* math_op */}
                            {block.functionName === 'math_op' && (
                              <div className="control-row-natural">
                                <span className="control-label">คำนวณ:</span>
                                <select
                                  className="studio-select"
                                  value={block.params.op ?? 'add'}
                                  onChange={(e) => updateBlock(block.id, {op: e.target.value})}
                                >
                                  <option value="add">บวก (+)</option>
                                  <option value="sub">ลบ (-)</option>
                                  <option value="mul">คูณ (×)</option>
                                  <option value="div">หาร (÷)</option>
                                </select>
                                <span className="control-label">ด้วยตัวเลข:</span>
                                <input
                                  type="number"
                                  step="any"
                                  className="studio-input-number"
                                  value={block.params.value ?? 10}
                                  onChange={(e) => updateBlock(block.id, {value: Number(e.target.value)})}
                                />
                                <div className="quick-shortcut-pills">
                                  <button type="button" onClick={() => updateBlock(block.id, {op: 'mul', value: 1.07})}>+ VAT 7% (× 1.07)</button>
                                  <button type="button" onClick={() => updateBlock(block.id, {op: 'mul', value: 0.9})}>ลด 10% (× 0.9)</button>
                                </div>
                              </div>
                            )}

                            {/* round */}
                            {block.functionName === 'round' && (
                              <div className="control-row-natural">
                                <span className="control-label">ปัดเศษทศนิยม:</span>
                                <input
                                  type="number"
                                  className="studio-input-number"
                                  value={block.params.decimals ?? 2}
                                  min={0}
                                  max={6}
                                  onChange={(e) => updateBlock(block.id, {decimals: Number(e.target.value)})}
                                />
                                <span className="control-unit">ตำแหน่ง</span>

                                <div className="quick-shortcut-pills">
                                  <button type="button" onClick={() => updateBlock(block.id, {decimals: 0})}>จำนวนเต็ม (0)</button>
                                  <button type="button" onClick={() => updateBlock(block.id, {decimals: 2})}>2 ตำแหน่ง (0.00)</button>
                                </div>
                              </div>
                            )}

                            {/* if_else */}
                            {block.functionName === 'if_else' && (
                              <div className="if-else-builder-grid">
                                <div className="control-row-natural">
                                  <span className="control-label">ถ้าค่าข้อมูล:</span>
                                  <select
                                    className="studio-select"
                                    value={block.params.operator ?? 'is_not_empty'}
                                    onChange={(e) => updateBlock(block.id, {operator: e.target.value})}
                                  >
                                    <option value="is_not_empty">มีค่า (ไม่ว่างเปล่า)</option>
                                    <option value="is_empty">ไม่มีค่า (ว่างเปล่า)</option>
                                    <option value="equals">เท่ากับ (=)</option>
                                    <option value="not_equals">ไม่เท่ากับ (!=)</option>
                                    <option value="contains">มีคำว่า...</option>
                                    <option value="greater_than">มากกว่า (&gt;)</option>
                                    <option value="less_than">น้อยกว่า (&lt;)</option>
                                  </select>

                                  {(block.params.operator === 'equals' ||
                                    block.params.operator === 'not_equals' ||
                                    block.params.operator === 'contains' ||
                                    block.params.operator === 'greater_than' ||
                                    block.params.operator === 'less_than') && (
                                    <input
                                      type="text"
                                      className="studio-input-text"
                                      style={{width: 140}}
                                      placeholder="คำที่ต้องการเทียบ"
                                      value={block.params.target ?? ''}
                                      onChange={(e) => updateBlock(block.id, {target: e.target.value})}
                                    />
                                  )}
                                </div>

                                <div className="control-row-natural" style={{marginTop: 6}}>
                                  <span className="if-result-tag green">✓ ถ้าตรงเงื่อนไข (จริง):</span>
                                  <input
                                    type="text"
                                    className="studio-input-text"
                                    style={{width: 160}}
                                    value={block.params.thenValue ?? 'พร้อมจำหน่าย'}
                                    onChange={(e) => updateBlock(block.id, {thenValue: e.target.value})}
                                  />

                                  <span className="if-result-tag red" style={{marginLeft: 12}}>✗ ถ้าไม่ตรง (เท็จ):</span>
                                  <input
                                    type="text"
                                    className="studio-input-text"
                                    style={{width: 160}}
                                    value={block.params.elseValue ?? 'สินค้าหมด'}
                                    onChange={(e) => updateBlock(block.id, {elseValue: e.target.value})}
                                  />
                                </div>
                              </div>
                            )}

                            {/* repeat */}
                            {block.functionName === 'repeat' && (
                              <div className="control-row-natural">
                                <span className="control-label">ข้อความที่จะทำซ้ำ:</span>
                                <input
                                  type="text"
                                  className="studio-input-text"
                                  style={{width: 90}}
                                  value={block.params.text ?? '*'}
                                  onChange={(e) => updateBlock(block.id, {text: e.target.value})}
                                />
                                <span className="control-label">จำนวน:</span>
                                <input
                                  type="number"
                                  className="studio-input-number"
                                  value={block.params.times ?? 5}
                                  onChange={(e) => updateBlock(block.id, {times: Number(e.target.value)})}
                                />
                                <span className="control-unit">ครั้ง</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ================= FOOTER ================= */}
        <footer className="formula-studio-footer">
          <div className="footer-tip">
            <span>💡 <strong>คำแนะนำ:</strong> ชิ้นส่วน LEGO ทำงานต่อกันจากบนลงล่าง โดยส่งผลลัพธ์ของแต่ละขั้นไปประมวลผลต่อในขั้นถัดไป</span>
          </div>

          <div className="footer-actions">
            <button
              type="button"
              className="studio-btn-cancel"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="studio-btn-save"
              onClick={() => onSave(list)}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>บันทึกและนำสูตรไปใช้</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
