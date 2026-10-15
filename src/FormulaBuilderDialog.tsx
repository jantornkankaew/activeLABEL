import {useState, useMemo, useRef, useEffect} from 'react';
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
  Sparkles,
  Layers,
  Flag,
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

type WordBlockCategory = 'variable' | 'datetime' | 'operator' | 'control' | 'preset';

type PresetRecipe = {
  id: string;
  name: string;
  desc: string;
  blocks: FormulaBlock[];
};

const PRESET_RECIPES: PresetRecipe[] = [
  {
    id: 'exp_30_days',
    name: 'วันหมดอายุ (+30 วัน)',
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
    desc: 'รหัส Lot วันนี้ เช่น LOT-20261015',
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
  const [selectedPaletteTab, setSelectedPaletteTab] = useState<WordBlockCategory>('variable');

  const canvasScrollRef = useRef<HTMLDivElement>(null);

  const activeFormula = list.find((f) => f.id === activeId) || list[0];

  const prevBlockCountRef = useRef(activeFormula?.blocks?.length || 0);
  useEffect(() => {
    const currentCount = activeFormula?.blocks?.length || 0;
    if (currentCount > prevBlockCountRef.current && canvasScrollRef.current) {
      const container = canvasScrollRef.current;
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }, 50);
    }
    prevBlockCountRef.current = currentCount;
  }, [activeFormula?.blocks?.length]);

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

  function copyResultToClipboard() {
    if (!finalResult) return;
    navigator.clipboard?.writeText(finalResult).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  // Insert variable into the latest text block or append variable block
  function insertVariableAsBlock(varName: string) {
    addBlock('string', 'variable', {variableName: varName});
  }

  return (
    <div className="modal-backdrop">
      <div
        className={`modal minimal-formula-modal lego-word-blocks-modal ${
          isMaximized ? 'is-maximized' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="formula-title"
      >
        {/* ================= HEADER ================= */}
        <header className="wb-studio-header">
          <div className="wb-header-left">
            <div className="wb-brand-badge">
              <span className="wb-spike-logo">🟧</span>
              <strong className="wb-brand-title">LEGO® Word Blocks Studio</strong>
            </div>

            {/* Formula Tabs */}
            <div className="wb-formula-tabs">
              {list.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`wb-tab-pill ${f.id === activeId ? 'active' : ''}`}
                  onClick={() => setActiveId(f.id)}
                >
                  <span className="wb-tab-dot" />
                  <span className="wb-tab-name">{f.name || 'Untitled'}</span>
                </button>
              ))}
              <button
                type="button"
                className="wb-add-tab-btn"
                title="สร้างสูตรใหม่"
                onClick={addFormula}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>สูตรใหม่</span>
              </button>
            </div>
          </div>

          <div className="wb-header-right">
            <button
              type="button"
              className="wb-header-icon-btn"
              title={isMaximized ? 'ย่อหน้าต่าง' : 'ขยายเต็มจอ (Maximize)'}
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              className="wb-close-dialog-btn"
              aria-label="Close dialog"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ================= WORD BLOCKS 2-PANEL BODY ================= */}
        <div className="wb-studio-body">
          {/* ================= LEFT: CATEGORY DRAWER & WORD BLOCKS PALETTE ================= */}
          <aside className="wb-palette-sidebar">
            {/* Category Switcher Tabs (Scratch / LEGO SPIKE Style) */}
            <div className="wb-category-strip">
              <button
                type="button"
                className={`wb-cat-strip-btn cat-variable ${
                  selectedPaletteTab === 'variable' ? 'active' : ''
                }`}
                onClick={() => setSelectedPaletteTab('variable')}
                title="ตัวแปร (Variables)"
              >
                <span className="cat-dot cat-variable" />
                <span className="cat-strip-label">ตัวแปร</span>
              </button>
              <button
                type="button"
                className={`wb-cat-strip-btn cat-datetime ${
                  selectedPaletteTab === 'datetime' ? 'active' : ''
                }`}
                onClick={() => setSelectedPaletteTab('datetime')}
                title="วันที่ & เวลา (Date & Time)"
              >
                <span className="cat-dot cat-datetime" />
                <span className="cat-strip-label">วันที่</span>
              </button>
              <button
                type="button"
                className={`wb-cat-strip-btn cat-operator ${
                  selectedPaletteTab === 'operator' ? 'active' : ''
                }`}
                onClick={() => setSelectedPaletteTab('operator')}
                title="ตัวดำเนินการ & ข้อความ (Operators)"
              >
                <span className="cat-dot cat-operator" />
                <span className="cat-strip-label">ข้อความ</span>
              </button>
              <button
                type="button"
                className={`wb-cat-strip-btn cat-control ${
                  selectedPaletteTab === 'control' ? 'active' : ''
                }`}
                onClick={() => setSelectedPaletteTab('control')}
                title="เงื่อนไข (Control / IF)"
              >
                <span className="cat-dot cat-control" />
                <span className="cat-strip-label">เงื่อนไข</span>
              </button>
              <button
                type="button"
                className={`wb-cat-strip-btn cat-preset ${
                  selectedPaletteTab === 'preset' ? 'active' : ''
                }`}
                onClick={() => setSelectedPaletteTab('preset')}
                title="แม่แบบสำเร็จรูป (1-Click Recipes)"
              >
                <span className="cat-dot cat-preset">⚡</span>
                <span className="cat-strip-label">แม่แบบ</span>
              </button>
            </div>

            {/* Blocks List Pane */}
            <div className="wb-palette-blocks-scroll">
              {/* 1. VARIABLE BLOCKS (ORANGE) */}
              {selectedPaletteTab === 'variable' && (
                <div className="wb-palette-group">
                  <div className="wb-palette-title orange">
                    <VariableIcon size={14} />
                    <span>บล็อกคำสั่งตัวแปร (Variable Blocks)</span>
                  </div>

                  {/* Document Variables as Clickable Reporter Pills */}
                  {variables && variables.length > 0 ? (
                    <div className="wb-reporter-pills-shelf">
                      <span className="shelf-label">คลิกตัวแปรเพื่อเพิ่มลงในสูตร:</span>
                      <div className="shelf-pills">
                        {variables.map((v) => (
                          <button
                            key={v.name}
                            type="button"
                            className="wb-pill-reporter"
                            onClick={() => insertVariableAsBlock(v.name)}
                            title={`คลิกเพื่อใส่ตัวแปร {{${v.name}}} = "${v.value || ''}"`}
                          >
                            <span className="pill-dot" />
                            <span>{v.label || v.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="wb-empty-vars-hint">
                      💡 ยังไม่มีตัวแปรในโปรเจกต์นี้ สามารถสร้างได้ที่ปุ่ม Variables ด้านบน
                    </p>
                  )}

                  {/* Set Variable Block */}
                  <div
                    className="wb-brick-preview wb-block-variable"
                    onClick={() =>
                      addBlock('string', 'variable', {
                        variableName: variables[0]?.name || '',
                      })
                    }
                  >
                    <span>ตั้งค่าผลลัพธ์เป็นตัวแปร</span>
                    <span className="wb-slot-dropdown">
                      {variables[0]?.name || 'my_variable'} ▾
                    </span>
                  </div>

                  {/* Concat / Prefix Block */}
                  <div
                    className="wb-brick-preview wb-block-variable"
                    onClick={() =>
                      addBlock('string', 'concat', {prefix: 'LOT-', append: ''})
                    }
                  >
                    <span>เติมคำนำหน้า</span>
                    <span className="wb-slot-input">LOT-</span>
                    <span>ต่อกับตัวแปร</span>
                  </div>
                </div>
              )}

              {/* 2. DATE & TIME BLOCKS (BLUE) */}
              {selectedPaletteTab === 'datetime' && (
                <div className="wb-palette-group">
                  <div className="wb-palette-title blue">
                    <Calendar size={14} />
                    <span>บล็อกคำสั่งวันที่ & เวลา (Date & Time Blocks)</span>
                  </div>

                  {/* Now Block */}
                  <div
                    className="wb-brick-preview wb-block-datetime"
                    onClick={() => addBlock('datetime', 'now', {format: 'DD/MM/YYYY'})}
                  >
                    <span>วันที่ปัจจุบัน รูปแบบ</span>
                    <span className="wb-slot-dropdown">DD/MM/YYYY ▾</span>
                  </div>

                  {/* Add Days Block */}
                  <div
                    className="wb-brick-preview wb-block-datetime"
                    onClick={() =>
                      addBlock('datetime', 'add_days', {days: 30, format: 'DD/MM/YYYY'})
                    }
                  >
                    <span>วันที่ปัจจุบัน +</span>
                    <span className="wb-slot-input">30</span>
                    <span>วัน (วันหมดอายุ)</span>
                  </div>

                  {/* Add Months Block */}
                  <div
                    className="wb-brick-preview wb-block-datetime"
                    onClick={() =>
                      addBlock('datetime', 'add_months', {months: 1, format: 'DD/MM/YYYY'})
                    }
                  >
                    <span>วันที่ปัจจุบัน +</span>
                    <span className="wb-slot-input">1</span>
                    <span>เดือน</span>
                  </div>

                  {/* Add Years Block */}
                  <div
                    className="wb-brick-preview wb-block-datetime"
                    onClick={() =>
                      addBlock('datetime', 'add_years', {years: 1, format: 'DD/MM/YYYY'})
                    }
                  >
                    <span>วันที่ปัจจุบัน +</span>
                    <span className="wb-slot-input">1</span>
                    <span>ปี</span>
                  </div>

                  {/* Format Date Block */}
                  <div
                    className="wb-brick-preview wb-block-datetime"
                    onClick={() =>
                      addBlock('datetime', 'format_date', {format: 'DD/MM/YYYY'})
                    }
                  >
                    <span>แปลงรูปแบบวันที่เป็น</span>
                    <span className="wb-slot-input">DD/MM/YYYY</span>
                  </div>

                  {/* Date Part Block */}
                  <div
                    className="wb-brick-preview wb-block-datetime"
                    onClick={() => addBlock('datetime', 'date_part', {part: 'YYYY'})}
                  >
                    <span>ดึงเฉพาะส่วน</span>
                    <span className="wb-slot-dropdown">ปี 4 หลัก (YYYY) ▾</span>
                  </div>
                </div>
              )}

              {/* 3. OPERATORS & STRING BLOCKS (GREEN) */}
              {selectedPaletteTab === 'operator' && (
                <div className="wb-palette-group">
                  <div className="wb-palette-title green">
                    <Type size={14} />
                    <span>บล็อกตัวดำเนินการ & ข้อความ (Operators & String)</span>
                  </div>

                  {/* Concat Block */}
                  <div
                    className="wb-brick-preview wb-block-operator"
                    onClick={() =>
                      addBlock('string', 'concat', {prefix: '', append: ''})
                    }
                  >
                    <span>เชื่อมข้อความ</span>
                    <span className="wb-slot-input">นำหน้า</span>
                    <span>กับ</span>
                    <span className="wb-slot-input">ต่อท้าย</span>
                  </div>

                  {/* Pad 0 Block */}
                  <div
                    className="wb-brick-preview wb-block-operator"
                    onClick={() =>
                      addBlock('string', 'pad_start', {length: 4, char: '0'})
                    }
                  >
                    <span>เติมเลข</span>
                    <span className="wb-slot-input">0</span>
                    <span>ด้านหน้าให้ครบ</span>
                    <span className="wb-slot-input">4</span>
                    <span>หลัก</span>
                  </div>

                  {/* Uppercase Block */}
                  <div
                    className="wb-brick-preview wb-block-operator"
                    onClick={() => addBlock('string', 'uppercase', {})}
                  >
                    <span>แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)</span>
                  </div>

                  {/* Lowercase Block */}
                  <div
                    className="wb-brick-preview wb-block-operator"
                    onClick={() => addBlock('string', 'lowercase', {})}
                  >
                    <span>แปลงเป็นตัวพิมพ์เล็ก (lowercase)</span>
                  </div>

                  {/* Substring Block */}
                  <div
                    className="wb-brick-preview wb-block-operator"
                    onClick={() =>
                      addBlock('string', 'substring', {start: 0, length: 5})
                    }
                  >
                    <span>ตัดข้อความเริ่มที่</span>
                    <span className="wb-slot-input">0</span>
                    <span>ยาว</span>
                    <span className="wb-slot-input">5</span>
                    <span>ตัว</span>
                  </div>

                  {/* Replace Block */}
                  <div
                    className="wb-brick-preview wb-block-operator"
                    onClick={() =>
                      addBlock('string', 'replace', {search: '', replace: ''})
                    }
                  >
                    <span>ค้นหาคำว่า</span>
                    <span className="wb-slot-input">คำเดิม</span>
                    <span>แทนที่ด้วย</span>
                    <span className="wb-slot-input">คำใหม่</span>
                  </div>

                  {/* Trim Block */}
                  <div
                    className="wb-brick-preview wb-block-operator"
                    onClick={() => addBlock('string', 'trim', {})}
                  >
                    <span>ตัดช่องว่างหน้า-หลัง</span>
                  </div>

                  {/* Math Op Block */}
                  <div
                    className="wb-brick-preview wb-block-numeric"
                    onClick={() =>
                      addBlock('numeric', 'math_op', {op: 'add', value: 10})
                    }
                  >
                    <span>คำนวณตัวเลข</span>
                    <span className="wb-slot-dropdown">+ บวก ▾</span>
                    <span className="wb-slot-input">10</span>
                  </div>

                  {/* Counter Block */}
                  <div
                    className="wb-brick-preview wb-block-numeric"
                    onClick={() =>
                      addBlock('numeric', 'counter', {start: 1, padZeros: 4})
                    }
                  >
                    <span>รันเลขลำดับ เริ่มที่</span>
                    <span className="wb-slot-input">1</span>
                    <span>เติม 0 ครบ</span>
                    <span className="wb-slot-input">4</span>
                    <span>หลัก</span>
                  </div>

                  {/* Round Block */}
                  <div
                    className="wb-brick-preview wb-block-numeric"
                    onClick={() => addBlock('numeric', 'round', {decimals: 2})}
                  >
                    <span>ปัดเศษทศนิยม</span>
                    <span className="wb-slot-input">2</span>
                    <span>ตำแหน่ง</span>
                  </div>
                </div>
              )}

              {/* 4. CONTROL / IF BLOCKS (AMBER / GOLD) */}
              {selectedPaletteTab === 'control' && (
                <div className="wb-palette-group">
                  <div className="wb-palette-title amber">
                    <GitBranch size={14} />
                    <span>บล็อกควบคุมเงื่อนไข (Control Blocks)</span>
                  </div>

                  {/* IF-ELSE Block */}
                  <div
                    className="wb-brick-preview wb-block-control"
                    onClick={() =>
                      addBlock('if', 'if_else', {
                        operator: 'is_not_empty',
                        thenValue: 'พร้อมจำหน่าย',
                        elseValue: 'สินค้าหมด',
                      })
                    }
                  >
                    <span>ถ้า &lt; มีค่าไม่ว่าง &gt; แล้วให้ค่า</span>
                    <span className="wb-slot-input">พร้อมจำหน่าย</span>
                    <span>มิฉะนั้น</span>
                    <span className="wb-slot-input">สินค้าหมด</span>
                  </div>

                  {/* Repeat Block */}
                  <div
                    className="wb-brick-preview wb-block-control"
                    onClick={() =>
                      addBlock('loop', 'repeat', {text: '*', times: 5, separator: ''})
                    }
                  >
                    <span>ทำซ้ำข้อความ</span>
                    <span className="wb-slot-input">*</span>
                    <span>จำนวน</span>
                    <span className="wb-slot-input">5</span>
                    <span>ครั้ง</span>
                  </div>
                </div>
              )}

              {/* 5. 1-CLICK PRESETS */}
              {selectedPaletteTab === 'preset' && (
                <div className="wb-palette-group">
                  <div className="wb-palette-title yellow">
                    <Zap size={14} fill="#eab308" color="#eab308" />
                    <span>แม่แบบสูตรสำเร็จรูปยอดนิยม</span>
                  </div>
                  <div className="wb-presets-list">
                    {PRESET_RECIPES.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        className="wb-preset-card-btn"
                        onClick={() => applyPreset(recipe)}
                      >
                        <strong>{recipe.name}</strong>
                        <small>{recipe.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ================= RIGHT: WORKSPACE / CODING CANVAS ================= */}
          <main className="wb-coding-workspace">
            {/* Top Workspace Stage Bar */}
            <div className="wb-stage-bar">
              <div className="wb-formula-name-field">
                <span className="wb-field-label">ชื่อสูตร Word Blocks:</span>
                <div className="wb-name-input-row">
                  <input
                    type="text"
                    className="wb-formula-name-input"
                    value={activeFormula?.name ?? ''}
                    placeholder="เช่น วันหมดอายุ (+30 วัน)"
                    onChange={(e) => updateActiveFormula({name: e.target.value})}
                  />
                  {list.length > 1 && (
                    <button
                      type="button"
                      className="wb-delete-formula-btn"
                      title="ลบสูตรนี้"
                      onClick={() => removeFormula(activeId)}
                    >
                      <Trash2 size={13} />
                      <span>ลบสูตร</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scratch / SPIKE Style Stage Monitor */}
              <div className="wb-stage-monitor-card">
                <div className="wb-monitor-header">
                  <span className="wb-monitor-tag">
                    <span className="wb-monitor-led" /> ผลลัพธ์สูตร (Stage Output)
                  </span>
                  <button
                    type="button"
                    className="wb-monitor-copy-btn"
                    title="คัดลอกผลลัพธ์"
                    onClick={copyResultToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check size={11} color="#16a34a" /> คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> คัดลอก
                      </>
                    )}
                  </button>
                </div>
                <div className="wb-monitor-screen">
                  <strong>{finalResult || '(ไม่มีผลลัพธ์)'}</strong>
                </div>
              </div>
            </div>

            {/* Quick Variable Bar (If Project Variables Exist) */}
            {variables && variables.length > 0 && (
              <div className="wb-variables-ribbon">
                <span className="ribbon-title">
                  <VariableIcon size={12} color="#ff8c1a" />
                  <strong>ตัวแปรในโปรเจกต์:</strong>
                </span>
                <div className="ribbon-pills">
                  {variables.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      className="wb-pill-reporter mini"
                      onClick={() => insertVariableAsBlock(v.name)}
                      title={`คลิกเพื่อต่อบล็อกตัวแปร "${v.name}" = "${v.value || ''}"`}
                    >
                      <span>{v.name}</span>
                      <small>="{v.value || ''}"</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The Stacking Canvas (Interlocking Word Blocks) */}
            <div className="wb-canvas-scroll" ref={canvasScrollRef}>
              <div className="wb-blocks-chain-container">
                {/* 1. HAT BLOCK: When Formula Evaluates */}
                <div className="wb-hat-block">
                  <div className="wb-hat-inner">
                    <Flag size={15} fill="#ffffff" color="#ffffff" />
                    <span>เมื่อคำนวณสูตร</span>
                    <strong className="wb-hat-formula-title">
                      "{activeFormula?.name || 'Untitled'}"
                    </strong>
                  </div>
                </div>

                {/* Blocks Stack */}
                {!activeFormula || activeFormula.blocks.length === 0 ? (
                  <div className="wb-empty-stack-placeholder">
                    <div className="wb-placeholder-jigsaw-icon">🧩</div>
                    <h4>ยังไม่มีบล็อกคำสั่งในสูตรนี้</h4>
                    <p>
                      คลิกบล็อกคำสั่งในเมนูด้านซ้ายเพื่อต่อบล็อกเข้ากับคำสั่งเริ่มต้นด้านบน
                    </p>
                  </div>
                ) : (
                  activeFormula.blocks.map((block, index) => {
                    const isFirst = index === 0;
                    const isLast = index === activeFormula.blocks.length - 1;
                    const stepVal = stepOutputs[index] ?? '';

                    const categoryClass =
                      block.functionName === 'variable'
                        ? 'wb-block-variable'
                        : block.category === 'datetime'
                        ? 'wb-block-datetime'
                        : block.category === 'string'
                        ? 'wb-block-operator'
                        : block.category === 'numeric'
                        ? 'wb-block-numeric'
                        : block.category === 'if'
                        ? 'wb-block-control'
                        : 'wb-block-control';

                    return (
                      <div key={block.id} className="wb-step-row">
                        {/* The Interlocking Word Block */}
                        <div className={`wb-block ${categoryClass}`}>
                          {/* Step Index Dot */}
                          <span className="wb-block-index">{index + 1}</span>

                          {/* Block Content Form */}
                          <div className="wb-block-body">
                            {/* variable */}
                            {block.functionName === 'variable' && (
                              <div className="wb-block-inline-fields">
                                <span>ดึงค่าจากตัวแปร</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.variableName ?? ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {variableName: e.target.value})
                                  }
                                >
                                  <option value="">-- เลือกตัวแปร --</option>
                                  {variables.map((v) => (
                                    <option key={v.name} value={v.name}>
                                      {v.label || v.name} ({v.value ? `"${v.value}"` : 'ว่าง'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* now */}
                            {block.functionName === 'now' && (
                              <div className="wb-block-inline-fields">
                                <span>วันที่ปัจจุบัน รูปแบบ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
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
                              <div className="wb-block-inline-fields">
                                <span>วันที่ปัจจุบัน +</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.days ?? 30}
                                  onChange={(e) =>
                                    updateBlock(block.id, {days: Number(e.target.value)})
                                  }
                                />
                                <span>วัน รูปแบบ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
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
                              <div className="wb-block-inline-fields">
                                <span>วันที่ปัจจุบัน +</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.months ?? 1}
                                  onChange={(e) =>
                                    updateBlock(block.id, {months: Number(e.target.value)})
                                  }
                                />
                                <span>เดือน รูปแบบ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
                                >
                                  <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                  <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                  <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                                </select>
                              </div>
                            )}

                            {/* add_years */}
                            {block.functionName === 'add_years' && (
                              <div className="wb-block-inline-fields">
                                <span>วันที่ปัจจุบัน +</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.years ?? 1}
                                  onChange={(e) =>
                                    updateBlock(block.id, {years: Number(e.target.value)})
                                  }
                                />
                                <span>ปี รูปแบบ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
                                >
                                  <option value="DD/MM/YYYY">15/10/2026 (DD/MM/YYYY)</option>
                                  <option value="YYYY-MM-DD">2026-10-15 (YYYY-MM-DD)</option>
                                  <option value="YYYYMMDD">20261015 (YYYYMMDD)</option>
                                </select>
                              </div>
                            )}

                            {/* format_date */}
                            {block.functionName === 'format_date' && (
                              <div className="wb-block-inline-fields">
                                <span>แปลงรูปแบบวันที่เป็น</span>
                                <input
                                  type="text"
                                  className="wb-slot-input"
                                  style={{width: 120}}
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
                                />
                              </div>
                            )}

                            {/* date_part */}
                            {block.functionName === 'date_part' && (
                              <div className="wb-block-inline-fields">
                                <span>ดึงเฉพาะส่วน</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.part ?? 'YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {part: e.target.value})
                                  }
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
                              <div className="wb-block-inline-fields">
                                <span>เติมข้อความนำหน้า</span>
                                <input
                                  type="text"
                                  className="wb-slot-input"
                                  placeholder="เช่น LOT-"
                                  style={{width: 90}}
                                  value={block.params.prefix ?? ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {prefix: e.target.value})
                                  }
                                />
                                <span>และต่อท้ายด้วย</span>
                                <input
                                  type="text"
                                  className="wb-slot-input"
                                  placeholder="เช่น -TH"
                                  style={{width: 90}}
                                  value={block.params.append ?? ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {append: e.target.value})
                                  }
                                />
                              </div>
                            )}

                            {/* pad_start */}
                            {block.functionName === 'pad_start' && (
                              <div className="wb-block-inline-fields">
                                <span>เติมตัวอักษร</span>
                                <input
                                  type="text"
                                  className="wb-slot-input mini"
                                  value={block.params.char ?? '0'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {char: e.target.value})
                                  }
                                />
                                <span>ด้านหน้าให้ครบ</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.length ?? 4}
                                  onChange={(e) =>
                                    updateBlock(block.id, {length: Number(e.target.value)})
                                  }
                                />
                                <span>หลัก</span>
                              </div>
                            )}

                            {/* uppercase / lowercase / trim */}
                            {block.functionName === 'uppercase' && (
                              <div className="wb-block-inline-fields">
                                <span>แปลงเป็นตัวพิมพ์ใหญ่ (UPPERCASE)</span>
                              </div>
                            )}
                            {block.functionName === 'lowercase' && (
                              <div className="wb-block-inline-fields">
                                <span>แปลงเป็นตัวพิมพ์เล็ก (lowercase)</span>
                              </div>
                            )}
                            {block.functionName === 'trim' && (
                              <div className="wb-block-inline-fields">
                                <span>ตัดช่องว่างด้านหน้าและด้านหลังข้อความออก</span>
                              </div>
                            )}

                            {/* substring */}
                            {block.functionName === 'substring' && (
                              <div className="wb-block-inline-fields">
                                <span>ตัดข้อความเริ่มตัวที่</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.start ?? 0}
                                  onChange={(e) =>
                                    updateBlock(block.id, {start: Number(e.target.value)})
                                  }
                                />
                                <span>ยาว</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.length ?? 5}
                                  onChange={(e) =>
                                    updateBlock(block.id, {length: Number(e.target.value)})
                                  }
                                />
                                <span>ตัวอักษร</span>
                              </div>
                            )}

                            {/* replace */}
                            {block.functionName === 'replace' && (
                              <div className="wb-block-inline-fields">
                                <span>ค้นหาคำว่า</span>
                                <input
                                  type="text"
                                  className="wb-slot-input"
                                  style={{width: 90}}
                                  value={block.params.search ?? ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {search: e.target.value})
                                  }
                                />
                                <span>แทนที่ด้วย</span>
                                <input
                                  type="text"
                                  className="wb-slot-input"
                                  style={{width: 90}}
                                  value={block.params.replace ?? ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {replace: e.target.value})
                                  }
                                />
                              </div>
                            )}

                            {/* counter */}
                            {block.functionName === 'counter' && (
                              <div className="wb-block-inline-fields">
                                <span>รันเลขอัตโนมัติ เริ่มที่</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.start ?? 1}
                                  onChange={(e) =>
                                    updateBlock(block.id, {start: Number(e.target.value)})
                                  }
                                />
                                <span>เติม 0 ครบ</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.padZeros ?? 4}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      padZeros: Number(e.target.value),
                                    })
                                  }
                                />
                                <span>หลัก</span>
                              </div>
                            )}

                            {/* math_op */}
                            {block.functionName === 'math_op' && (
                              <div className="wb-block-inline-fields">
                                <span>คำนวณ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.op ?? 'add'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {op: e.target.value})
                                  }
                                >
                                  <option value="add">+ บวก</option>
                                  <option value="sub">- ลบ</option>
                                  <option value="mul">× คูณ</option>
                                  <option value="div">÷ หาร</option>
                                </select>
                                <span>ด้วยเลข</span>
                                <input
                                  type="number"
                                  step="any"
                                  className="wb-slot-input num"
                                  value={block.params.value ?? 10}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      value: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            )}

                            {/* round */}
                            {block.functionName === 'round' && (
                              <div className="wb-block-inline-fields">
                                <span>ปัดเศษทศนิยม</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.decimals ?? 2}
                                  min={0}
                                  max={6}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      decimals: Number(e.target.value),
                                    })
                                  }
                                />
                                <span>ตำแหน่ง</span>
                              </div>
                            )}

                            {/* if_else */}
                            {block.functionName === 'if_else' && (
                              <div className="wb-block-if-wrap">
                                <div className="wb-block-inline-fields">
                                  <span>ถ้า &lt;</span>
                                  <select
                                    className="wb-slot-dropdown"
                                    value={block.params.operator ?? 'is_not_empty'}
                                    onChange={(e) =>
                                      updateBlock(block.id, {
                                        operator: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="is_not_empty">มีค่าไม่ว่าง</option>
                                    <option value="is_empty">ว่างเปล่า</option>
                                    <option value="equals">เท่ากับ (=)</option>
                                    <option value="not_equals">ไม่เท่ากับ (!=)</option>
                                    <option value="contains">มีคำว่า...</option>
                                  </select>
                                  {(block.params.operator === 'equals' ||
                                    block.params.operator === 'not_equals' ||
                                    block.params.operator === 'contains') && (
                                    <input
                                      type="text"
                                      className="wb-slot-input"
                                      style={{width: 90}}
                                      value={block.params.target ?? ''}
                                      onChange={(e) =>
                                        updateBlock(block.id, {target: e.target.value})
                                      }
                                    />
                                  )}
                                  <span>&gt; แล้ว:</span>
                                </div>
                                <div
                                  className="wb-block-inline-fields"
                                  style={{paddingLeft: 14}}
                                >
                                  <span>จริงให้ส่งค่า</span>
                                  <input
                                    type="text"
                                    className="wb-slot-input"
                                    style={{width: 110}}
                                    value={block.params.thenValue ?? 'พร้อมจำหน่าย'}
                                    onChange={(e) =>
                                      updateBlock(block.id, {thenValue: e.target.value})
                                    }
                                  />
                                  <span>มิฉะนั้น</span>
                                  <input
                                    type="text"
                                    className="wb-slot-input"
                                    style={{width: 110}}
                                    value={block.params.elseValue ?? 'สินค้าหมด'}
                                    onChange={(e) =>
                                      updateBlock(block.id, {elseValue: e.target.value})
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            {/* repeat */}
                            {block.functionName === 'repeat' && (
                              <div className="wb-block-inline-fields">
                                <span>ทำซ้ำข้อความ</span>
                                <input
                                  type="text"
                                  className="wb-slot-input"
                                  style={{width: 70}}
                                  value={block.params.text ?? '*'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {text: e.target.value})
                                  }
                                />
                                <span>จำนวน</span>
                                <input
                                  type="number"
                                  className="wb-slot-input num"
                                  value={block.params.times ?? 5}
                                  onChange={(e) =>
                                    updateBlock(block.id, {times: Number(e.target.value)})
                                  }
                                />
                                <span>ครั้ง</span>
                              </div>
                            )}
                          </div>

                          {/* Block Actions */}
                          <div className="wb-block-actions">
                            {!isFirst && (
                              <button
                                type="button"
                                className="wb-btn-act"
                                title="เลื่อนบล็อกขึ้น"
                                onClick={() => moveBlock(block.id, -1)}
                              >
                                <ChevronUp size={13} strokeWidth={2.5} />
                              </button>
                            )}
                            {!isLast && (
                              <button
                                type="button"
                                className="wb-btn-act"
                                title="เลื่อนบล็อกลง"
                                onClick={() => moveBlock(block.id, 1)}
                              >
                                <ChevronDown size={13} strokeWidth={2.5} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="wb-btn-act"
                              title="ทำซ้ำบล็อกนี้"
                              onClick={() => duplicateBlock(block.id)}
                            >
                              <Copy size={11} />
                            </button>
                            <button
                              type="button"
                              className="wb-btn-act del"
                              title="ลบบล็อกนี้"
                              onClick={() => removeBlock(block.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Step Result Speech Bubble */}
                        <div
                          className="wb-step-speech-bubble"
                          title="ผลลัพธ์ของบล็อกนี้"
                        >
                          <span className="bubble-pointer">◀</span>
                          <span className="bubble-text">
                            ได้ค่า: <strong>"{stepVal}"</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>

        {/* ================= FOOTER ================= */}
        <footer className="wb-studio-footer">
          <div className="wb-footer-hint">
            <span>
              🧩 <strong>LEGO® Word Blocks:</strong> บล็อกคำสั่งจะประมวลผลต่อเนื่องจากบนลงล่างตามรอยต่อจิ๊กซอว์
            </span>
          </div>

          <div className="wb-footer-actions">
            <button type="button" className="wb-btn-cancel" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="wb-btn-save"
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
