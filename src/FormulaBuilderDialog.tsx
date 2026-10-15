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
  blocks: FormulaBlock[];
};

const PRESET_RECIPES: PresetRecipe[] = [
  {
    id: 'exp_30_days',
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
  {
    id: 'exp_1_year',
    name: 'วันหมดอายุ (+1 ปี)',
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
    name: 'ตัวพิมพ์ใหญ่ (UPPERCASE)',
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

  const [showAddMenu, setShowAddMenu] = useState<FunctionCategory | null>(null);

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
    setShowAddMenu(null);
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

  return (
    <div className="modal-backdrop">
      <div className="modal minimal-formula-modal" role="dialog" aria-modal="true" aria-labelledby="formula-title">
        {/* ================= HEADER ================= */}
        <header className="min-header">
          <div className="min-header-left">
            <span className="min-lego-icon">🧱</span>
            <div className="min-formula-tabs">
              {list.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`min-tab-pill ${f.id === activeId ? 'active' : ''}`}
                  onClick={() => setActiveId(f.id)}
                >
                  {f.name || 'Untitled'}
                </button>
              ))}
              <button
                type="button"
                className="min-add-tab-btn"
                title="สร้างสูตรใหม่"
                onClick={addFormula}
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="min-header-right">
            {/* Live Result Pill */}
            <div className="min-live-result">
              <span className="live-label">ผลลัพธ์:</span>
              <strong className="live-val">{finalResult || '—'}</strong>
            </div>

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

        {/* Formula Name & Quick Recipes Bar */}
        <div className="min-subbar">
          <div className="min-name-edit">
            <span className="subbar-label">ชื่อสูตร:</span>
            <input
              type="text"
              className="min-name-input"
              value={activeFormula?.name ?? ''}
              placeholder="ตั้งชื่อสูตร..."
              onChange={(e) => updateActiveFormula({name: e.target.value})}
            />
            {list.length > 1 && (
              <button
                type="button"
                className="min-del-formula-btn"
                title="ลบสูตรนี้"
                onClick={() => removeFormula(activeId)}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* 1-Click Minimal Recipes */}
          <div className="min-presets-row">
            <span className="presets-title"><Zap size={12} fill="#eab308" color="#eab308" /> แม่แบบ:</span>
            {PRESET_RECIPES.map((r) => (
              <button
                key={r.id}
                type="button"
                className="min-preset-pill"
                onClick={() => applyPreset(r)}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* ================= MINIMAL LEGO CANVAS ================= */}
        <main className="min-canvas-area">
          <div className="min-canvas-container">
            {/* Bricks Stack */}
            {!activeFormula || activeFormula.blocks.length === 0 ? (
              <div className="min-empty-state">
                <p>ยังไม่มีบล็อกในสูตรนี้ เลือกแม่แบบด้านบน หรือกดปุ่มด้านล่างเพื่อเริ่มต่อบล็อก</p>
              </div>
            ) : (
              activeFormula.blocks.map((block, index) => {
                const isFirst = index === 0;
                const isLast = index === activeFormula.blocks.length - 1;
                const stepVal = stepOutputs[index] ?? '';

                return (
                  <div key={block.id} className="min-step-wrapper">
                    {/* Inter-block connector arrow */}
                    {index > 0 && (
                      <div className="min-flow-arrow">
                        <ArrowDown size={13} strokeWidth={2.5} />
                      </div>
                    )}

                    {/* Minimal LEGO Brick Card */}
                    <div className={`min-brick cat-${block.category}`}>
                      {/* Brick Header Bar */}
                      <div className="min-brick-top">
                        <div className="min-brick-left">
                          <span className="min-step-num">{index + 1}</span>
                          <span className={`min-cat-badge cat-${block.category}`}>
                            {block.category === 'datetime' && '📅 วันที่'}
                            {block.category === 'string' && '🔤 ข้อความ'}
                            {block.category === 'numeric' && '🔢 ตัวเลข'}
                            {block.category === 'if' && '🔀 เงื่อนไข'}
                            {block.category === 'loop' && '🔁 ทำซ้ำ'}
                          </span>
                          <strong className="min-brick-title">
                            {block.functionName === 'now' && 'วันที่ปัจจุบัน (NOW)'}
                            {block.functionName === 'add_days' && 'บวก/ลบวัน (วันหมดอายุ)'}
                            {block.functionName === 'add_months' && 'บวก/ลบเดือน'}
                            {block.functionName === 'add_years' && 'บวก/ลบปี'}
                            {block.functionName === 'format_date' && 'แปลงรูปแบบวันที่'}
                            {block.functionName === 'date_part' && 'ดึงส่วนวันที่'}
                            {block.functionName === 'concat' && 'ต่อข้อความ / คำนำหน้า'}
                            {block.functionName === 'pad_start' && 'เติมเลข 0 ด้านหน้า'}
                            {block.functionName === 'pad_end' && 'เติมตัวอักษรด้านหลัง'}
                            {block.functionName === 'substring' && 'ตัดข้อความบางส่วน'}
                            {block.functionName === 'uppercase' && 'แปลงเป็นตัวพิมพ์ใหญ่'}
                            {block.functionName === 'lowercase' && 'แปลงเป็นตัวพิมพ์เล็ก'}
                            {block.functionName === 'replace' && 'ค้นหาและแทนที่คำ'}
                            {block.functionName === 'trim' && 'ตัดช่องว่างหน้า-หลัง'}
                            {block.functionName === 'counter' && 'รันเลขลำดับอัตโนมัติ'}
                            {block.functionName === 'math_op' && 'คำนวณตัวเลข (+ - × ÷)'}
                            {block.functionName === 'round' && 'ปัดเศษทศนิยม'}
                            {block.functionName === 'if_else' && 'เงื่อนไข (IF/ELSE)'}
                            {block.functionName === 'repeat' && 'ทำซ้ำข้อความ'}
                          </strong>
                        </div>

                        {/* Step Result + Action Buttons */}
                        <div className="min-brick-right">
                          <span className="min-step-badge" title="ผลลัพธ์ของขั้นตอนนี้">
                            ➔ {stepVal}
                          </span>

                          <div className="min-actions">
                            {!isFirst && (
                              <button
                                type="button"
                                className="min-btn-icon"
                                title="เลื่อนขึ้น"
                                onClick={() => moveBlock(block.id, -1)}
                              >
                                <ChevronUp size={13} strokeWidth={2.5} />
                              </button>
                            )}
                            {!isLast && (
                              <button
                                type="button"
                                className="min-btn-icon"
                                title="เลื่อนลง"
                                onClick={() => moveBlock(block.id, 1)}
                              >
                                <ChevronDown size={13} strokeWidth={2.5} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="min-btn-del"
                              title="ลบชิ้นนี้"
                              onClick={() => removeBlock(block.id)}
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Brick Body: One Natural Sentence Line */}
                      <div className="min-brick-body">
                        {/* now */}
                        {block.functionName === 'now' && (
                          <div className="min-sentence">
                            <span>รูปแบบวันที่:</span>
                            <select
                              className="min-input-select"
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            >
                              <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                              <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                              <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                              <option value="DD-MM-YYYY">15-10-2026</option>
                              <option value="DD/MM/YY">15/10/26</option>
                            </select>
                          </div>
                        )}

                        {/* add_days */}
                        {block.functionName === 'add_days' && (
                          <div className="min-sentence">
                            <span>บวกเพิ่ม:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.days ?? 30}
                              onChange={(e) => updateBlock(block.id, {days: Number(e.target.value)})}
                            />
                            <span>วัน</span>
                            <span className="dot-sep">•</span>
                            <span>รูปแบบ:</span>
                            <select
                              className="min-input-select"
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            >
                              <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                              <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                              <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                              <option value="DD/MM/YY">15/10/26</option>
                            </select>
                          </div>
                        )}

                        {/* add_months */}
                        {block.functionName === 'add_months' && (
                          <div className="min-sentence">
                            <span>บวกเพิ่ม:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.months ?? 1}
                              onChange={(e) => updateBlock(block.id, {months: Number(e.target.value)})}
                            />
                            <span>เดือน</span>
                            <span className="dot-sep">•</span>
                            <span>รูปแบบ:</span>
                            <select
                              className="min-input-select"
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
                          <div className="min-sentence">
                            <span>บวกเพิ่ม:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.years ?? 1}
                              onChange={(e) => updateBlock(block.id, {years: Number(e.target.value)})}
                            />
                            <span>ปี</span>
                            <span className="dot-sep">•</span>
                            <span>รูปแบบ:</span>
                            <select
                              className="min-input-select"
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
                          <div className="min-sentence">
                            <span>เปลี่ยนรูปแบบเป็น:</span>
                            <input
                              type="text"
                              className="min-input-text"
                              style={{width: 130}}
                              value={block.params.format ?? 'DD/MM/YYYY'}
                              onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                            />
                            <span className="hint-text">(เช่น DD/MM/YYYY, YYYY-MM-DD)</span>
                          </div>
                        )}

                        {/* date_part */}
                        {block.functionName === 'date_part' && (
                          <div className="min-sentence">
                            <span>ดึงเฉพาะ:</span>
                            <select
                              className="min-input-select"
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
                          <div className="min-sentence">
                            <span>นำหน้า:</span>
                            <input
                              type="text"
                              className="min-input-text"
                              style={{width: 100}}
                              placeholder="เช่น LOT-"
                              value={block.params.prefix ?? ''}
                              onChange={(e) => updateBlock(block.id, {prefix: e.target.value})}
                            />
                            <span className="dot-sep">•</span>
                            <span>ต่อท้าย:</span>
                            <input
                              type="text"
                              className="min-input-text"
                              style={{width: 100}}
                              placeholder="เช่น -TH"
                              value={block.params.append ?? ''}
                              onChange={(e) => updateBlock(block.id, {append: e.target.value})}
                            />
                          </div>
                        )}

                        {/* pad_start */}
                        {block.functionName === 'pad_start' && (
                          <div className="min-sentence">
                            <span>เติมตัวอักษร:</span>
                            <input
                              type="text"
                              className="min-input-mini"
                              value={block.params.char ?? '0'}
                              onChange={(e) => updateBlock(block.id, {char: e.target.value})}
                            />
                            <span>ด้านหน้าให้ครบ:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.length ?? 4}
                              onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                            />
                            <span>หลัก (เช่น 0001)</span>
                          </div>
                        )}

                        {/* substring */}
                        {block.functionName === 'substring' && (
                          <div className="min-sentence">
                            <span>ตัดเริ่มตัวที่:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.start ?? 0}
                              onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                            />
                            <span className="dot-sep">•</span>
                            <span>ความยาว:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.length ?? 5}
                              onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                            />
                            <span>ตัวอักษร</span>
                          </div>
                        )}

                        {/* uppercase / lowercase / trim */}
                        {block.functionName === 'uppercase' && (
                          <div className="min-sentence">
                            <span className="accent-note">✓ แปลงภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์ใหญ่ (UPPERCASE)</span>
                          </div>
                        )}
                        {block.functionName === 'lowercase' && (
                          <div className="min-sentence">
                            <span className="accent-note">✓ แปลงภาษาอังกฤษทั้งหมดเป็นตัวพิมพ์เล็ก (lowercase)</span>
                          </div>
                        )}
                        {block.functionName === 'trim' && (
                          <div className="min-sentence">
                            <span className="accent-note">✓ ตัดช่องว่างด้านหน้าและด้านหลังข้อความออก</span>
                          </div>
                        )}

                        {/* replace */}
                        {block.functionName === 'replace' && (
                          <div className="min-sentence">
                            <span>ค้นหาคำว่า:</span>
                            <input
                              type="text"
                              className="min-input-text"
                              style={{width: 100}}
                              value={block.params.search ?? ''}
                              onChange={(e) => updateBlock(block.id, {search: e.target.value})}
                            />
                            <span>แทนที่ด้วย:</span>
                            <input
                              type="text"
                              className="min-input-text"
                              style={{width: 100}}
                              value={block.params.replace ?? ''}
                              onChange={(e) => updateBlock(block.id, {replace: e.target.value})}
                            />
                          </div>
                        )}

                        {/* counter */}
                        {block.functionName === 'counter' && (
                          <div className="min-sentence">
                            <span>เริ่มนับที่เลข:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.start ?? 1}
                              onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                            />
                            <span className="dot-sep">•</span>
                            <span>เติมเลข 0 ให้ครบ:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.padZeros ?? 4}
                              onChange={(e) => updateBlock(block.id, {padZeros: Number(e.target.value)})}
                            />
                            <span>หลัก (เช่น 0001)</span>
                          </div>
                        )}

                        {/* math_op */}
                        {block.functionName === 'math_op' && (
                          <div className="min-sentence">
                            <span>คำนวณ:</span>
                            <select
                              className="min-input-select"
                              value={block.params.op ?? 'add'}
                              onChange={(e) => updateBlock(block.id, {op: e.target.value})}
                            >
                              <option value="add">บวก (+)</option>
                              <option value="subtract">ลบ (-)</option>
                              <option value="multiply">คูณ (×)</option>
                              <option value="divide">หาร (÷)</option>
                            </select>
                            <span>ด้วยเลข:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.value ?? 10}
                              onChange={(e) => updateBlock(block.id, {value: Number(e.target.value)})}
                            />
                          </div>
                        )}

                        {/* round */}
                        {block.functionName === 'round' && (
                          <div className="min-sentence">
                            <span>ปัดเศษทศนิยม:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.decimals ?? 2}
                              min={0}
                              max={6}
                              onChange={(e) => updateBlock(block.id, {decimals: Number(e.target.value)})}
                            />
                            <span>ตำแหน่ง</span>
                          </div>
                        )}

                        {/* if_else */}
                        {block.functionName === 'if_else' && (
                          <div className="min-sentence-stack">
                            <div className="min-sentence">
                              <span>ถ้าข้อมูล:</span>
                              <select
                                className="min-input-select"
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
                                  className="min-input-text"
                                  style={{width: 100}}
                                  placeholder="คำที่ต้องการเทียบ"
                                  value={block.params.target ?? ''}
                                  onChange={(e) => updateBlock(block.id, {target: e.target.value})}
                                />
                              )}
                            </div>
                            <div className="min-sentence" style={{marginTop: 4}}>
                              <span style={{color: '#16a34a', fontWeight: 600}}>✓ ถ้าจริง:</span>
                              <input
                                type="text"
                                className="min-input-text"
                                style={{width: 120}}
                                value={block.params.thenValue ?? 'พร้อมจำหน่าย'}
                                onChange={(e) => updateBlock(block.id, {thenValue: e.target.value})}
                              />
                              <span style={{color: '#dc2626', fontWeight: 600}}>✗ ถ้าไม่จริง:</span>
                              <input
                                type="text"
                                className="min-input-text"
                                style={{width: 120}}
                                value={block.params.elseValue ?? 'สินค้าหมด'}
                                onChange={(e) => updateBlock(block.id, {elseValue: e.target.value})}
                              />
                            </div>
                          </div>
                        )}

                        {/* repeat */}
                        {block.functionName === 'repeat' && (
                          <div className="min-sentence">
                            <span>ทำซ้ำ:</span>
                            <input
                              type="text"
                              className="min-input-text"
                              style={{width: 80}}
                              value={block.params.text ?? '*'}
                              onChange={(e) => updateBlock(block.id, {text: e.target.value})}
                            />
                            <span>จำนวน:</span>
                            <input
                              type="number"
                              className="min-input-num"
                              value={block.params.times ?? 5}
                              onChange={(e) => updateBlock(block.id, {times: Number(e.target.value)})}
                            />
                            <span>ครั้ง</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* ================= MINIMAL ADD BLOCK ACTION BAR ================= */}
            <div className="min-add-block-row">
              <span className="add-lead-text">+ ต่อบล็อกเพิ่ม:</span>

              <div className="min-add-category-buttons">
                {/* 1. Date & Time */}
                <div className="popover-wrapper">
                  <button
                    type="button"
                    className="min-btn-add-cat cat-datetime"
                    onClick={() => setShowAddMenu(showAddMenu === 'datetime' ? null : 'datetime')}
                  >
                    <Calendar size={13} /> วันที่ / วันหมดอายุ ▾
                  </button>
                  {showAddMenu === 'datetime' && (
                    <div className="min-dropdown-menu">
                      <button type="button" onClick={() => addBlock('datetime', 'add_days', {days: 30, format: 'DD/MM/YYYY'})}>
                        📅 บวก/ลบวัน (วันหมดอายุ)
                      </button>
                      <button type="button" onClick={() => addBlock('datetime', 'now', {format: 'DD/MM/YYYY'})}>
                        📅 วันที่ปัจจุบัน (NOW)
                      </button>
                      <button type="button" onClick={() => addBlock('datetime', 'add_months', {months: 1, format: 'DD/MM/YYYY'})}>
                        📅 บวก/ลบเดือน (+Months)
                      </button>
                      <button type="button" onClick={() => addBlock('datetime', 'add_years', {years: 1, format: 'DD/MM/YYYY'})}>
                        📅 บวก/ลบปี (+Years)
                      </button>
                      <button type="button" onClick={() => addBlock('datetime', 'format_date', {format: 'DD/MM/YYYY'})}>
                        📅 แปลงรูปแบบวันที่ (Format)
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Text */}
                <div className="popover-wrapper">
                  <button
                    type="button"
                    className="min-btn-add-cat cat-string"
                    onClick={() => setShowAddMenu(showAddMenu === 'string' ? null : 'string')}
                  >
                    <Type size={13} /> ข้อความ / คำนำหน้า ▾
                  </button>
                  {showAddMenu === 'string' && (
                    <div className="min-dropdown-menu">
                      <button type="button" onClick={() => addBlock('string', 'concat', {prefix: '', append: ''})}>
                        🔤 เติมคำนำหน้า / ต่อท้าย
                      </button>
                      <button type="button" onClick={() => addBlock('string', 'uppercase', {})}>
                        🔤 แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)
                      </button>
                      <button type="button" onClick={() => addBlock('string', 'pad_start', {length: 4, char: '0'})}>
                        🔤 เติมเลข 0 ด้านหน้า (เช่น 0001)
                      </button>
                      <button type="button" onClick={() => addBlock('string', 'substring', {start: 0, length: 5})}>
                        🔤 ตัดข้อความบางส่วน
                      </button>
                      <button type="button" onClick={() => addBlock('string', 'replace', {search: '', replace: ''})}>
                        🔤 ค้นหาและแทนที่คำ
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Numbers */}
                <div className="popover-wrapper">
                  <button
                    type="button"
                    className="min-btn-add-cat cat-numeric"
                    onClick={() => setShowAddMenu(showAddMenu === 'numeric' ? null : 'numeric')}
                  >
                    <Hash size={13} /> ตัวเลขและลำดับ ▾
                  </button>
                  {showAddMenu === 'numeric' && (
                    <div className="min-dropdown-menu">
                      <button type="button" onClick={() => addBlock('numeric', 'counter', {start: 1, padZeros: 4})}>
                        🔢 รันเลขลำดับอัตโนมัติ (Counter)
                      </button>
                      <button type="button" onClick={() => addBlock('numeric', 'math_op', {op: 'add', value: 10})}>
                        🔢 คำนวณเลข (+, -, *, /)
                      </button>
                      <button type="button" onClick={() => addBlock('numeric', 'round', {decimals: 2})}>
                        🔢 ปัดเศษทศนิยม
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Condition */}
                <button
                  type="button"
                  className="min-btn-add-cat cat-if"
                  onClick={() => addBlock('if', 'if_else', {operator: 'is_not_empty', target: '', thenValue: 'พร้อมจำหน่าย', elseValue: 'สินค้าหมด'})}
                >
                  <GitBranch size={13} /> เงื่อนไข (IF/ELSE)
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="min-footer">
          <span className="min-footer-hint">ผลลัพธ์จะถูกนำไปแสดงบนฉลากของคุณโดยอัตโนมัติ</span>
          <div className="min-footer-actions">
            <button type="button" className="min-btn-cancel" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="button" className="min-btn-save" onClick={handleSave}>
              <Check size={14} strokeWidth={2.5} /> บันทึกสูตร (Save)
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
