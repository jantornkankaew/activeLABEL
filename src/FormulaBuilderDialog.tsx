import {useState, useMemo, useRef, useEffect} from 'react';
import {
  Plus,
  Trash2,
  X,
  GripVertical,
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
    name: 'Expiry_30_Days',
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
    name: 'Expiry_1_Year',
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
    name: 'Lot_Today',
    desc: 'รหัส Lot วันนี้ เช่น LOT-YYYYMMDD',
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
    name: 'Auto_Sequence',
    desc: 'รันลำดับตัวเลข 4 หลัก มีคำนำหน้า (เช่น SEQ-0001)',
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
    name: 'Uppercase_Text',
    desc: 'เปลี่ยนตัวอักษรเป็นตัวพิมพ์ใหญ่',
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
    name: 'Price_With_VAT',
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
  onVariablesChange,
  onSave,
  onClose,
}: {
  formulas: LabelFormula[];
  variables: LabelVariable[];
  initialFormulaId?: string;
  onVariablesChange?: (variables: LabelVariable[]) => void;
  onSave: (formulas: LabelFormula[], updatedVariables?: LabelVariable[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<LabelFormula[]>(() => {
    if (formulas && formulas.length > 0) {
      return structuredClone(formulas);
    }
    return [
      {
        id: 'formula_1',
        name: 'Expiry_30_Days',
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

  const [localVariables, setLocalVariables] = useState<LabelVariable[]>(() =>
    variables && variables.length > 0 ? structuredClone(variables) : []
  );
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  function commitLocalVariables(next: LabelVariable[]) {
    setLocalVariables(next);
    onVariablesChange?.(next);
  }

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
    for (const v of localVariables) {
      map[v.name] = v.value !== '' ? v.value : '';
    }
    return map;
  }, [localVariables]);

  // Compute intermediate step-by-step results for EACH block
  const {stepOutputs, runtimeVarMap} = useMemo(() => {
    const runtimeVars: Record<string, string> = {...varMap};
    if (!activeFormula || !activeFormula.blocks) {
      return {stepOutputs: [] as string[], runtimeVarMap: runtimeVars};
    }
    let current = '';
    const outputs: string[] = [];
    const now = new Date();
    for (const block of activeFormula.blocks) {
      try {
        current = evaluateBlock(block, current, runtimeVars, now);
        outputs.push(current || '(ค่าว่าง)');
      } catch {
        outputs.push('(เกิดข้อผิดพลาด)');
      }
    }
    return {stepOutputs: outputs, runtimeVarMap: runtimeVars};
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
      name: `Formula_${list.length + 1}`,
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

  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const draggedBlockIdRef = useRef<string | null>(null);
  const draggedVarNameRef = useRef<string | null>(null);
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);

  function startVariableDrag(e: React.DragEvent, varName: string) {
    draggedVarNameRef.current = varName;
    draggedBlockIdRef.current = null;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-labelcraft-var', varName);
    e.dataTransfer.setData('text/plain', `{{${varName}}}`);
  }

  function endVariableDrag() {
    draggedVarNameRef.current = null;
    setHoveredSlotKey(null);
  }

  function extractDroppedVariable(e: React.DragEvent): string | null {
    if (draggedVarNameRef.current) return draggedVarNameRef.current;
    const customVar = e.dataTransfer.getData('application/x-labelcraft-var');
    if (customVar) return customVar;
    const plain = e.dataTransfer.getData('text/plain') || '';
    const m = plain.match(/^\{\{\s*([A-Za-z0-9_]+)\s*\}\}$/);
    return m ? m[1] : null;
  }

  function renderSlotInput(
    blockId: string,
    paramKey: string,
    currentValue: any,
    options: {
      type?: 'text' | 'number';
      className?: string;
      style?: React.CSSProperties;
      placeholder?: string;
      clearValue?: any;
      min?: number;
      max?: number;
      step?: string;
    } = {}
  ) {
    const {
      type = 'text',
      className = 'wb-slot-input',
      style,
      placeholder,
      clearValue = type === 'number' ? 0 : '',
      min,
      max,
      step,
    } = options;

    const rawStr = String(currentValue ?? '');
    const varMatch = rawStr.match(/^\{\{\s*([A-Za-z0-9_]+)\s*\}\}$/);
    const boundVarName = varMatch ? varMatch[1] : null;
    const slotKey = `${blockId}:${paramKey}`;
    const isDropOver = hoveredSlotKey === slotKey;

    const handleSlotDragOver = (e: React.DragEvent) => {
      if (!draggedVarNameRef.current && !e.dataTransfer.types.includes('application/x-labelcraft-var')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (hoveredSlotKey !== slotKey) {
        setHoveredSlotKey(slotKey);
      }
    };

    const handleSlotDragLeave = (e: React.DragEvent) => {
      e.stopPropagation();
      if (hoveredSlotKey === slotKey) {
        setHoveredSlotKey(null);
      }
    };

    const handleSlotDrop = (e: React.DragEvent) => {
      const droppedVar = extractDroppedVariable(e);
      if (!droppedVar) return;
      e.preventDefault();
      e.stopPropagation();
      updateBlock(blockId, {[paramKey]: `{{${droppedVar}}}`});
      draggedVarNameRef.current = null;
      setHoveredSlotKey(null);
    };

    if (boundVarName) {
      const foundVar = localVariables.find((v) => v.name === boundVarName);
      return (
        <span
          className={`wb-slot-var-chip ${isDropOver ? 'is-drop-over' : ''}`}
          onDragOver={handleSlotDragOver}
          onDragLeave={handleSlotDragLeave}
          onDrop={handleSlotDrop}
          title={
            foundVar
              ? `ใช้ค่าจากตัวแปร "${boundVarName}" (ปัจจุบัน = "${foundVar.value}") — ลากตัวแปรอื่นทับเพื่อเปลี่ยน หรือกด × เพื่อเอาออก`
              : `ใช้ค่าจากตัวแปร "${boundVarName}" — กด × เพื่อเอาออก`
          }
        >
          <span className="wb-slot-var-dot" />
          <span className="wb-slot-var-name">{boundVarName}</span>
          <button
            type="button"
            className="wb-slot-var-clear"
            title={`นำตัวแปร ${boundVarName} ออกจากช่องนี้`}
            onClick={(e) => {
              e.stopPropagation();
              updateBlock(blockId, {[paramKey]: clearValue});
            }}
          >
            <X size={10} strokeWidth={3} />
          </button>
        </span>
      );
    }

    return (
      <span
        className={`wb-slot-drop-wrap ${isDropOver ? 'is-drop-over' : ''}`}
        onDragOver={handleSlotDragOver}
        onDragLeave={handleSlotDragLeave}
        onDrop={handleSlotDrop}
        title="พิมพ์ค่าได้โดยตรง หรือลากตัวแปรมาวางในช่องนี้"
      >
        <input
          type={type}
          step={step}
          min={min}
          max={max}
          className={className}
          style={style}
          placeholder={placeholder}
          value={currentValue ?? clearValue}
          onChange={(e) =>
            updateBlock(blockId, {
              [paramKey]: type === 'number' ? Number(e.target.value) : e.target.value,
            })
          }
        />
      </span>
    );
  }

  function reorderBlock(sourceId: string, targetId: string) {
    if (!activeFormula || sourceId === targetId) return;
    const fromIdx = activeFormula.blocks.findIndex((b) => b.id === sourceId);
    const toIdx = activeFormula.blocks.findIndex((b) => b.id === targetId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const next = [...activeFormula.blocks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    updateActiveFormula({blocks: next});
  }

  function copyResultToClipboard() {
    if (!finalResult) return;
    navigator.clipboard?.writeText(finalResult).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function sanitizeVarKey(raw: string): string {
    const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '').slice(0, 31);
    if (!cleaned) return '';
    return /^[A-Za-z_]/.test(cleaned) ? cleaned : `v_${cleaned}`.slice(0, 31);
  }

  function ensureDefaultVariable(): string {
    if (localVariables.length > 0) {
      return localVariables[0].name;
    }
    const defaultVar: LabelVariable = {
      name: 'my_var',
      label: 'my_var',
      value: '100',
      prompt: true,
    };
    commitLocalVariables([defaultVar]);
    return defaultVar.name;
  }

  function createOrSetLocalVariable() {
    const fallbackName = `var_${localVariables.length + 1}`;
    const key = sanitizeVarKey(newVarName.trim()) || fallbackName;
    const val = newVarValue;
    const existingIdx = localVariables.findIndex((v) => v.name === key);
    const next =
      existingIdx >= 0
        ? localVariables.map((v, idx) => (idx === existingIdx ? {...v, value: val} : v))
        : [
            ...localVariables,
            {
              name: key,
              label: key,
              value: val,
              prompt: true,
            },
          ];
    commitLocalVariables(next);
    setNewVarName('');
    setNewVarValue('');
  }

  function updateLocalVarValue(name: string, val: string) {
    const next = localVariables.map((v) => (v.name === name ? {...v, value: val} : v));
    commitLocalVariables(next);
  }

  function deleteLocalVar(name: string) {
    const next = localVariables.filter((v) => v.name !== name);
    commitLocalVariables(next);
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
                <span className="cat-dot cat-preset" />
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

                  {/* Quick Create & Set Variable Value Shelf */}
                  <div className="wb-reporter-pills-shelf">
                    <span className="shelf-label">สร้างตัวแปรใหม่ / กำหนดค่าตัวแปร:</span>
                    <div className="wb-var-create-row">
                      <input
                        type="text"
                        className="wb-var-create-input name"
                        placeholder="ชื่อตัวแปร (เช่น price)"
                        value={newVarName}
                        onChange={(e) =>
                          setNewVarName(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            createOrSetLocalVariable();
                          }
                        }}
                      />
                      <span className="wb-var-eq">=</span>
                      <input
                        type="text"
                        className="wb-var-create-input val"
                        placeholder="ค่าเริ่มต้น"
                        value={newVarValue}
                        onChange={(e) => setNewVarValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            createOrSetLocalVariable();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="wb-var-create-btn"
                        title="สร้างตัวแปรหรือตั้งค่า"
                        onClick={createOrSetLocalVariable}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        <span>ตั้งค่า</span>
                      </button>
                    </div>

                    {localVariables.length > 0 ? (
                      <div className="wb-var-shelf-list">
                        {localVariables.map((v) => (
                          <div key={v.name} className="wb-var-shelf-item">
                            <button
                              type="button"
                              className="wb-pill-reporter"
                              draggable
                              onDragStart={(e) => startVariableDrag(e, v.name)}
                              onDragEnd={endVariableDrag}
                              onClick={() => insertVariableAsBlock(v.name)}
                              title={`ลากไปวางในช่องรับค่าของบล็อก หรือคลิกเพื่อดึงค่าตัวแปร ${v.name} ลงในสูตร`}
                            >
                              <span className="pill-dot" />
                              <span>{v.label || v.name}</span>
                            </button>
                            <span className="wb-var-eq">=</span>
                            <input
                              type="text"
                              className="wb-var-shelf-val-input"
                              placeholder="ค่าตัวแปร..."
                              value={v.value}
                              onChange={(e) => updateLocalVarValue(v.name, e.target.value)}
                              title={`แก้ไขค่าของตัวแปร ${v.name}`}
                            />
                            <button
                              type="button"
                              className="wb-var-shelf-set-btn"
                              title={`เพิ่มบล็อกกำหนดค่าให้ ${v.name}`}
                              onClick={() =>
                                addBlock('string', 'set_variable', {
                                  variableName: v.name,
                                  mode: 'custom',
                                  value: v.value || '100',
                                })
                              }
                            >
                              Set
                            </button>
                            <button
                              type="button"
                              className="wb-var-shelf-del-btn"
                              title={`ลบตัวแปร ${v.name}`}
                              onClick={() => deleteLocalVar(v.name)}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="wb-var-empty-inline">
                        ยังไม่มีตัวแปร พิมพ์ชื่อและค่าด้านบนแล้วกด <strong>+ ตั้งค่า</strong> หรือคลิกบล็อกด้านล่างได้เลย
                      </span>
                    )}
                  </div>

                  {/* 1. Set Variable to Custom Value (LEGO: set [var v] to [value]) */}
                  <div
                    className="wb-brick-preview wb-block-variable"
                    onClick={() => {
                      const targetVar = ensureDefaultVariable();
                      addBlock('string', 'set_variable', {
                        variableName: targetVar,
                        mode: 'custom',
                        value: '100',
                      });
                    }}
                  >
                    <span>กำหนดค่าตัวแปร</span>
                    <span className="wb-slot-dropdown">
                      {localVariables[0]?.name || 'my_var'} ▾
                    </span>
                    <span>เป็น</span>
                    <span className="wb-slot-input">100</span>
                  </div>

                  {/* 2. Set Variable to Previous Output */}
                  <div
                    className="wb-brick-preview wb-block-variable"
                    onClick={() => {
                      const targetVar = ensureDefaultVariable();
                      addBlock('string', 'set_variable', {
                        variableName: targetVar,
                        mode: 'current',
                        value: '',
                      });
                    }}
                  >
                    <span>บันทึกผลลัพธ์ลงตัวแปร</span>
                    <span className="wb-slot-dropdown">
                      {localVariables[0]?.name || 'my_var'} ▾
                    </span>
                  </div>

                  {/* 3. Change Variable by Delta (LEGO: change [var v] by (1)) */}
                  <div
                    className="wb-brick-preview wb-block-variable"
                    onClick={() => {
                      const targetVar = ensureDefaultVariable();
                      addBlock('string', 'change_variable', {
                        variableName: targetVar,
                        delta: 1,
                      });
                    }}
                  >
                    <span>เปลี่ยนค่าตัวแปร</span>
                    <span className="wb-slot-dropdown">
                      {localVariables[0]?.name || 'my_var'} ▾
                    </span>
                    <span>ทีละ</span>
                    <span className="wb-slot-input">1</span>
                  </div>

                  {/* 4. Get Variable Value */}
                  <div
                    className="wb-brick-preview wb-block-variable"
                    onClick={() => {
                      const targetVar = ensureDefaultVariable();
                      addBlock('string', 'variable', {
                        variableName: targetVar,
                      });
                    }}
                  >
                    <span>ดึงค่าจากตัวแปร</span>
                    <span className="wb-slot-dropdown">
                      {localVariables[0]?.name || 'my_var'} ▾
                    </span>
                  </div>

                  {/* 5. Set Initial Value */}
                  <div
                    className="wb-brick-preview wb-block-variable"
                    onClick={() =>
                      addBlock('string', 'set_value', {
                        value: 'SAMPLE-01',
                      })
                    }
                  >
                    <span>กำหนดค่าตั้งต้นเป็น</span>
                    <span className="wb-slot-input">SAMPLE-01</span>
                  </div>

                  {/* 6. Concat / Prefix Block */}
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
                <span className="wb-field-label">ชื่อสูตร (English only):</span>
                <div className="wb-name-input-row">
                  <input
                    type="text"
                    className="wb-formula-name-input"
                    value={activeFormula?.name ?? ''}
                    placeholder="e.g. Expiry_Date, Lot_Number"
                    title="กรุณาตั้งชื่อสูตรเป็นภาษาอังกฤษเท่านั้น (A-Z, a-z, 0-9, _, -)"
                    onChange={(e) => {
                      const englishOnly = e.target.value.replace(/[^A-Za-z0-9_\-\s]/g, '');
                      updateActiveFormula({name: englishOnly});
                    }}
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

              {/* Minimal Stage Output Badge */}
              <div className="wb-stage-monitor-card">
                <span className="wb-monitor-tag">
                  <span className="wb-monitor-led" /> ผลลัพธ์:
                </span>
                <div className="wb-monitor-screen">
                  <strong>{finalResult || '—'}</strong>
                </div>
                <button
                  type="button"
                  className="wb-monitor-copy-btn"
                  title="คัดลอกผลลัพธ์"
                  onClick={copyResultToClipboard}
                >
                  {copied ? (
                    <>
                      <Check size={11} color="#007a62" /> คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy size={11} /> คัดลอก
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Variable Bar (If Project Variables Exist) */}
            {localVariables.length > 0 && (
              <div className="wb-variables-ribbon">
                <span className="ribbon-title">
                  <VariableIcon size={12} color="#ff8c1a" />
                  <strong>ตัวแปรในโปรเจกต์:</strong>
                </span>
                <div className="ribbon-pills">
                  {localVariables.map((v) => {
                    const liveVal = runtimeVarMap[v.name] ?? v.value ?? '';
                    return (
                      <button
                        key={v.name}
                        type="button"
                        className="wb-pill-reporter mini"
                        draggable
                        onDragStart={(e) => startVariableDrag(e, v.name)}
                        onDragEnd={endVariableDrag}
                        onClick={() => insertVariableAsBlock(v.name)}
                        title={`ลากไปวางในช่องรับค่าของบล็อกใดก็ได้ หรือคลิกเพื่อต่อบล็อกตัวแปร "${v.name}" = "${liveVal}"`}
                      >
                        <span className="pill-dot" />
                        <span>{v.name}</span>
                        <small>="{liveVal}"</small>
                      </button>
                    );
                  })}
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
                    const stepVal = stepOutputs[index] ?? '';
                    const isDragging = draggingBlockId === block.id;

                    const categoryClass =
                      block.functionName === 'variable' ||
                      block.functionName === 'set_variable' ||
                      block.functionName === 'change_variable' ||
                      block.functionName === 'set_value'
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
                      <div
                        key={block.id}
                        className={`wb-step-row ${isDragging ? 'is-dragging' : ''}`}
                        draggable
                        onMouseDown={(e) => {
                          const target = e.target as HTMLElement;
                          if (
                            target.tagName === 'INPUT' ||
                            target.tagName === 'SELECT' ||
                            target.tagName === 'BUTTON' ||
                            target.tagName === 'OPTION' ||
                            target.closest('.wb-slot-var-chip')
                          ) {
                            e.currentTarget.draggable = false;
                          } else {
                            e.currentTarget.draggable = true;
                          }
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.draggable = true;
                        }}
                        onDragStart={(e) => {
                          if (draggedVarNameRef.current) return;
                          draggedBlockIdRef.current = block.id;
                          setDraggingBlockId(block.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', block.id);
                        }}
                        onDragOver={(e) => {
                          if (draggedVarNameRef.current || !draggedBlockIdRef.current) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          const sourceId = draggedBlockIdRef.current;
                          if (sourceId && sourceId !== block.id) {
                            reorderBlock(sourceId, block.id);
                          }
                        }}
                        onDrop={(e) => {
                          if (draggedVarNameRef.current) return;
                          e.preventDefault();
                          draggedBlockIdRef.current = null;
                          setDraggingBlockId(null);
                        }}
                        onDragEnd={() => {
                          draggedBlockIdRef.current = null;
                          setDraggingBlockId(null);
                        }}
                      >
                        {/* The Interlocking Word Block */}
                        <div className={`wb-block ${categoryClass}`} title="ลากเพื่อสลับลำดับบล็อก">
                          {/* Drag Handle & Step Index */}
                          <span className="wb-block-index" title="ลากเพื่อสลับลำดับ">
                            <GripVertical size={11} strokeWidth={2.5} />
                            {index + 1}
                          </span>

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
                                  {localVariables.map((v) => (
                                    <option key={v.name} value={v.name}>
                                      {v.label || v.name} ({v.value ? `"${v.value}"` : 'ว่าง'})
                                    </option>
                                  ))}
                                  {block.params.variableName &&
                                    !localVariables.some(
                                      (v) => v.name === block.params.variableName
                                    ) && (
                                      <option value={block.params.variableName}>
                                        {block.params.variableName}
                                      </option>
                                    )}
                                </select>
                              </div>
                            )}

                            {/* set_variable */}
                            {block.functionName === 'set_variable' && (
                              <div className="wb-block-inline-fields">
                                <span>กำหนดค่าตัวแปร</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.variableName ?? ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {variableName: e.target.value})
                                  }
                                >
                                  <option value="">-- เลือกตัวแปร --</option>
                                  {localVariables.map((v) => (
                                    <option key={v.name} value={v.name}>
                                      {v.label || v.name}
                                    </option>
                                  ))}
                                  {block.params.variableName &&
                                    !localVariables.some(
                                      (v) => v.name === block.params.variableName
                                    ) && (
                                      <option value={block.params.variableName}>
                                        {block.params.variableName}
                                      </option>
                                    )}
                                </select>
                                <span>เป็น</span>
                                <select
                                  className="wb-slot-dropdown"
                                  style={{minWidth: 112}}
                                  value={block.params.mode ?? 'custom'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {mode: e.target.value})
                                  }
                                >
                                  <option value="custom">ค่าที่ระบุ</option>
                                  <option value="current">ผลลัพธ์ก่อนหน้า</option>
                                </select>
                                {(block.params.mode ?? 'custom') === 'custom' &&
                                  renderSlotInput(block.id, 'value', block.params.value ?? '', {
                                    type: 'text',
                                    style: {width: 120},
                                    placeholder: 'ใส่ค่าตัวแปร...',
                                    clearValue: '',
                                  })}
                              </div>
                            )}

                            {/* change_variable */}
                            {block.functionName === 'change_variable' && (
                              <div className="wb-block-inline-fields">
                                <span>เปลี่ยนค่าตัวแปร</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.variableName ?? ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {variableName: e.target.value})
                                  }
                                >
                                  <option value="">-- เลือกตัวแปร --</option>
                                  {localVariables.map((v) => (
                                    <option key={v.name} value={v.name}>
                                      {v.label || v.name}
                                    </option>
                                  ))}
                                  {block.params.variableName &&
                                    !localVariables.some(
                                      (v) => v.name === block.params.variableName
                                    ) && (
                                      <option value={block.params.variableName}>
                                        {block.params.variableName}
                                      </option>
                                    )}
                                </select>
                                <span>เพิ่ม/ลดทีละ</span>
                                {renderSlotInput(block.id, 'delta', block.params.delta ?? 1, {
                                  type: 'number',
                                  step: 'any',
                                  className: 'wb-slot-input num',
                                  clearValue: 1,
                                })}
                              </div>
                            )}

                            {/* set_value */}
                            {block.functionName === 'set_value' && (
                              <div className="wb-block-inline-fields">
                                <span>กำหนดค่าตั้งต้นเป็น</span>
                                {renderSlotInput(block.id, 'value', block.params.value ?? '', {
                                  type: 'text',
                                  style: {width: 130},
                                  placeholder: 'ข้อความ/ตัวเลข...',
                                  clearValue: '',
                                })}
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
                                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                  <option value="YYYYMMDD">YYYYMMDD</option>
                                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                                  <option value="DD/MM/YY">DD/MM/YY</option>
                                </select>
                              </div>
                            )}

                            {/* add_days */}
                            {block.functionName === 'add_days' && (
                              <div className="wb-block-inline-fields">
                                <span>วันที่ปัจจุบัน +</span>
                                {renderSlotInput(block.id, 'days', block.params.days ?? 30, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 30,
                                })}
                                <span>วัน รูปแบบ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
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
                              <div className="wb-block-inline-fields">
                                <span>วันที่ปัจจุบัน +</span>
                                {renderSlotInput(block.id, 'months', block.params.months ?? 1, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 1,
                                })}
                                <span>เดือน รูปแบบ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
                                >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                  <option value="YYYYMMDD">YYYYMMDD</option>
                                </select>
                              </div>
                            )}

                            {/* add_years */}
                            {block.functionName === 'add_years' && (
                              <div className="wb-block-inline-fields">
                                <span>วันที่ปัจจุบัน +</span>
                                {renderSlotInput(block.id, 'years', block.params.years ?? 1, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 1,
                                })}
                                <span>ปี รูปแบบ</span>
                                <select
                                  className="wb-slot-dropdown"
                                  value={block.params.format ?? 'DD/MM/YYYY'}
                                  onChange={(e) =>
                                    updateBlock(block.id, {format: e.target.value})
                                  }
                                >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                  <option value="YYYYMMDD">YYYYMMDD</option>
                                </select>
                              </div>
                            )}

                            {/* format_date */}
                            {block.functionName === 'format_date' && (
                              <div className="wb-block-inline-fields">
                                <span>แปลงรูปแบบวันที่เป็น</span>
                                {renderSlotInput(
                                  block.id,
                                  'format',
                                  block.params.format ?? 'DD/MM/YYYY',
                                  {
                                    type: 'text',
                                    style: {width: 120},
                                    clearValue: 'DD/MM/YYYY',
                                  }
                                )}
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
                                {renderSlotInput(block.id, 'prefix', block.params.prefix ?? '', {
                                  type: 'text',
                                  placeholder: 'เช่น LOT-',
                                  style: {width: 110},
                                  clearValue: '',
                                })}
                                <span>และต่อท้ายด้วย</span>
                                {renderSlotInput(block.id, 'append', block.params.append ?? '', {
                                  type: 'text',
                                  placeholder: 'เช่น -TH',
                                  style: {width: 110},
                                  clearValue: '',
                                })}
                              </div>
                            )}

                            {/* pad_start */}
                            {block.functionName === 'pad_start' && (
                              <div className="wb-block-inline-fields">
                                <span>เติมตัวอักษร</span>
                                {renderSlotInput(block.id, 'char', block.params.char ?? '0', {
                                  type: 'text',
                                  className: 'wb-slot-input mini',
                                  clearValue: '0',
                                })}
                                <span>ด้านหน้าให้ครบ</span>
                                {renderSlotInput(block.id, 'length', block.params.length ?? 4, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 4,
                                })}
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
                                {renderSlotInput(block.id, 'start', block.params.start ?? 0, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 0,
                                })}
                                <span>ยาว</span>
                                {renderSlotInput(block.id, 'length', block.params.length ?? 5, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 5,
                                })}
                                <span>ตัวอักษร</span>
                              </div>
                            )}

                            {/* replace */}
                            {block.functionName === 'replace' && (
                              <div className="wb-block-inline-fields">
                                <span>ค้นหาคำว่า</span>
                                {renderSlotInput(block.id, 'search', block.params.search ?? '', {
                                  type: 'text',
                                  style: {width: 110},
                                  clearValue: '',
                                })}
                                <span>แทนที่ด้วย</span>
                                {renderSlotInput(block.id, 'replace', block.params.replace ?? '', {
                                  type: 'text',
                                  style: {width: 110},
                                  clearValue: '',
                                })}
                              </div>
                            )}

                            {/* counter */}
                            {block.functionName === 'counter' && (
                              <div className="wb-block-inline-fields">
                                <span>รันเลขอัตโนมัติ เริ่มที่</span>
                                {renderSlotInput(block.id, 'start', block.params.start ?? 1, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 1,
                                })}
                                <span>เติม 0 ครบ</span>
                                {renderSlotInput(block.id, 'padZeros', block.params.padZeros ?? 4, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 4,
                                })}
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
                                {renderSlotInput(block.id, 'value', block.params.value ?? 10, {
                                  type: 'number',
                                  step: 'any',
                                  className: 'wb-slot-input num',
                                  clearValue: 10,
                                })}
                              </div>
                            )}

                            {/* round */}
                            {block.functionName === 'round' && (
                              <div className="wb-block-inline-fields">
                                <span>ปัดเศษทศนิยม</span>
                                {renderSlotInput(block.id, 'decimals', block.params.decimals ?? 2, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  min: 0,
                                  max: 6,
                                  clearValue: 2,
                                })}
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
                                    block.params.operator === 'contains') &&
                                    renderSlotInput(block.id, 'target', block.params.target ?? '', {
                                      type: 'text',
                                      style: {width: 110},
                                      clearValue: '',
                                    })}
                                  <span>&gt; แล้ว:</span>
                                </div>
                                <div
                                  className="wb-block-inline-fields"
                                  style={{paddingLeft: 14}}
                                >
                                  <span>จริงให้ส่งค่า</span>
                                  {renderSlotInput(
                                    block.id,
                                    'thenValue',
                                    block.params.thenValue ?? 'พร้อมจำหน่าย',
                                    {
                                      type: 'text',
                                      style: {width: 125},
                                      clearValue: 'พร้อมจำหน่าย',
                                    }
                                  )}
                                  <span>มิฉะนั้น</span>
                                  {renderSlotInput(
                                    block.id,
                                    'elseValue',
                                    block.params.elseValue ?? 'สินค้าหมด',
                                    {
                                      type: 'text',
                                      style: {width: 125},
                                      clearValue: 'สินค้าหมด',
                                    }
                                  )}
                                </div>
                              </div>
                            )}

                            {/* repeat */}
                            {block.functionName === 'repeat' && (
                              <div className="wb-block-inline-fields">
                                <span>ทำซ้ำข้อความ</span>
                                {renderSlotInput(block.id, 'text', block.params.text ?? '*', {
                                  type: 'text',
                                  style: {width: 90},
                                  clearValue: '*',
                                })}
                                <span>จำนวน</span>
                                {renderSlotInput(block.id, 'times', block.params.times ?? 5, {
                                  type: 'number',
                                  className: 'wb-slot-input num',
                                  clearValue: 5,
                                })}
                                <span>ครั้ง</span>
                              </div>
                            )}
                          </div>

                          {/* Block Actions */}
                          <div className="wb-block-actions">
                            <button
                              type="button"
                              className="wb-btn-act"
                              title="ทำซ้ำบล็อกนี้"
                              onClick={() => duplicateBlock(block.id)}
                            >
                              <Copy size={11} color="#ffffff" />
                            </button>
                            <button
                              type="button"
                              className="wb-btn-act del"
                              title="ลบบล็อกนี้"
                              onClick={() => removeBlock(block.id)}
                            >
                              <Trash2 size={11} color="#ffffff" />
                            </button>
                          </div>
                        </div>

                        {/* Step Result Speech Bubble */}
                        <div
                          className="wb-step-speech-bubble"
                          title={`ผลลัพธ์ของขั้นตอนนี้: "${stepVal}"`}
                        >
                          <span className="bubble-pointer">◀</span>
                          <span className="bubble-text">
                            = <strong>"{stepVal}"</strong>
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
              onClick={() => {
                const sanitized = list.map((f, i) => {
                  const cleaned = (f.name || '').replace(/[^A-Za-z0-9_\-\s]/g, '').trim();
                  return {
                    ...f,
                    name: cleaned || `Formula_${i + 1}`,
                  };
                });

                const varList = [...localVariables];
                if (newVarName.trim()) {
                  const pendingKey = sanitizeVarKey(newVarName.trim());
                  if (pendingKey && !varList.some((v) => v.name === pendingKey)) {
                    varList.push({
                      name: pendingKey,
                      label: pendingKey,
                      value: newVarValue.slice(0, 300),
                      prompt: true,
                    });
                  }
                }
                for (const f of sanitized) {
                  for (const b of f.blocks) {
                    if (
                      (b.functionName === 'set_variable' ||
                        b.functionName === 'change_variable' ||
                        b.functionName === 'variable') &&
                      b.params.variableName
                    ) {
                      const vKey = sanitizeVarKey(String(b.params.variableName));
                      if (vKey && !varList.some((v) => v.name === vKey)) {
                        varList.push({
                          name: vKey,
                          label: vKey,
                          value:
                            b.functionName === 'set_variable' &&
                            (b.params.mode ?? 'custom') === 'custom'
                              ? String(b.params.value ?? '').slice(0, 300)
                              : '',
                          prompt: true,
                        });
                      }
                    }
                  }
                }

                onSave(sanitized, varList);
              }}
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
