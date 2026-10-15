import {useState, useEffect} from 'react';
import {Plus, Trash2, X, ChevronUp, ChevronDown, Play, Sparkles} from 'lucide-react';
import type {LabelVariable} from './core';
import {
  FUNCTION_CATALOG,
  evaluateFormula,
  type LabelFormula,
  type FormulaBlock,
  type FunctionCategory,
} from './formulaEngine';
import './formula.css';

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
    // Create an initial sample formula if none exist
    return [
      {
        id: 'formula_1',
        name: 'Date + 30 Days',
        blocks: [
          {
            id: 'b1',
            category: 'datetime',
            functionName: 'add_days',
            params: {days: 30, format: 'YYYY-MM-DD'},
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

  const activeFormula = list.find((f) => f.id === activeId) || list[0];
  const [simulatedResult, setSimulatedResult] = useState('');

  // Re-run simulation whenever formula or variables change
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
      setSimulatedResult(res || '(Empty output)');
    } catch {
      setSimulatedResult('(Evaluation error)');
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
      name: `Formula ${list.length + 1}`,
      blocks: [
        {
          id: `blk_${Date.now()}`,
          category: 'datetime',
          functionName: 'now',
          params: {format: 'YYYY-MM-DD'},
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

  function addBlock(cat: FunctionCategory, fnName: string, defaultParams: Record<string, any>) {
    if (!activeFormula) return;
    const newBlock: FormulaBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: cat,
      functionName: fnName,
      params: {...defaultParams},
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

  function moveBlock(index: number, direction: 'up' | 'down') {
    if (!activeFormula) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= activeFormula.blocks.length) return;
    const blocks = [...activeFormula.blocks];
    const temp = blocks[index];
    blocks[index] = blocks[target];
    blocks[target] = temp;
    updateActiveFormula({blocks});
  }

  function handleSave() {
    onSave(list);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal formula-modal" role="dialog" aria-modal="true" aria-label="Formula Builder">
        <div className="formula-heading">
          <div>
            <h2>Formula Builder (ตัวสร้างสูตร)</h2>
            <p>เลือกฟังก์ชันเหมือน LEGO ต่อกันเพื่อสร้างสูตร วันที่ ข้อความ ตัวเลข และเงื่อนไขอัตโนมัติ</p>
          </div>
          <button aria-label="Close formula builder" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Formula Switcher & Naming Bar */}
        <div className="formula-manager-bar">
          <label>
            Formula:
            <div className="formula-select-wrap">
              <select
                aria-label="Select formula to edit"
                value={activeId}
                onChange={(e) => setActiveId(e.target.value)}
              >
                {list.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.blocks.length} blocks)
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label>
            Name:
            <input
              type="text"
              className="formula-name-input"
              aria-label="Formula name"
              value={activeFormula?.name || ''}
              onChange={(e) => updateActiveFormula({name: e.target.value})}
              placeholder="e.g. Expiry Date"
            />
          </label>

          <button type="button" className="btn-add-formula" onClick={addFormula} title="Create another formula">
            <Plus size={14} /> New Formula
          </button>

          {list.length > 1 && (
            <button
              type="button"
              className="btn-remove-formula"
              onClick={() => removeFormula(activeId)}
              title="Delete this formula"
              aria-label="Delete formula"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className="formula-builder-body">
          {/* Left Column: LEGO Palette */}
          <aside className="formula-palette">
            <h4>LEGO Blocks Palette</h4>
            {FUNCTION_CATALOG.map((catGroup) => (
              <div key={catGroup.category} className="palette-category">
                <div className="palette-category-title">
                  <span>{catGroup.categoryIcon}</span>
                  <span>{catGroup.categoryLabel}</span>
                </div>
                {catGroup.functions.map((fn) => (
                  <button
                    key={fn.name}
                    type="button"
                    className={`palette-btn cat-${catGroup.category}`}
                    onClick={() => addBlock(catGroup.category, fn.name, fn.defaultParams)}
                    title={fn.description}
                  >
                    <Plus size={12} />
                    <span>{fn.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          {/* Right Column: Blocks Stack & Live Simulation */}
          <main className="formula-stage">
            <div className="blocks-container">
              {!activeFormula || activeFormula.blocks.length === 0 ? (
                <div className="blocks-empty">
                  <Sparkles size={28} />
                  <strong>ยังไม่มี Function Block ในสูตรนี้</strong>
                  <span>คลิกเลือกฟังก์ชันจากด้านซ้ายเพื่อนำมาต่อเหมือนตัวต่อ LEGO</span>
                </div>
              ) : (
                activeFormula.blocks.map((block, index) => (
                  <div key={block.id} className={`lego-block cat-${block.category}`}>
                    <div className="lego-block-header">
                      <div className="lego-block-title">
                        <span className="lego-badge">{index + 1}</span>
                        <span>
                          {FUNCTION_CATALOG.flatMap((c) => c.functions).find((f) => f.name === block.functionName)
                            ?.label || block.functionName}
                        </span>
                      </div>
                      <div className="lego-block-actions">
                        <button
                          type="button"
                          className="lego-action-btn"
                          disabled={index === 0}
                          onClick={() => moveBlock(index, 'up')}
                          title="Move up"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          className="lego-action-btn"
                          disabled={index === activeFormula.blocks.length - 1}
                          onClick={() => moveBlock(index, 'down')}
                          title="Move down"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          type="button"
                          className="lego-action-btn delete"
                          onClick={() => removeBlock(block.id)}
                          title="Remove block"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Block Parameter Inputs */}
                    <div className="lego-block-fields">
                      {/* DateTime: now, add_days, add_months, add_years */}
                      {block.category === 'datetime' && (
                        <>
                          {block.functionName === 'add_days' && (
                            <label className="lego-field">
                              Days:
                              <input
                                type="number"
                                style={{width: 60}}
                                value={block.params.days ?? 30}
                                onChange={(e) => updateBlock(block.id, {days: Number(e.target.value)})}
                              />
                            </label>
                          )}
                          {block.functionName === 'add_months' && (
                            <label className="lego-field">
                              Months:
                              <input
                                type="number"
                                style={{width: 60}}
                                value={block.params.months ?? 1}
                                onChange={(e) => updateBlock(block.id, {months: Number(e.target.value)})}
                              />
                            </label>
                          )}
                          {block.functionName === 'add_years' && (
                            <label className="lego-field">
                              Years:
                              <input
                                type="number"
                                style={{width: 60}}
                                value={block.params.years ?? 1}
                                onChange={(e) => updateBlock(block.id, {years: Number(e.target.value)})}
                              />
                            </label>
                          )}
                          {block.functionName === 'date_part' ? (
                            <label className="lego-field">
                              Part:
                              <select
                                value={block.params.part ?? 'YYYY'}
                                onChange={(e) => updateBlock(block.id, {part: e.target.value})}
                              >
                                <option value="YYYY">Year (2026)</option>
                                <option value="YY">Year short (26)</option>
                                <option value="MM">Month (01-12)</option>
                                <option value="DD">Day (01-31)</option>
                                <option value="HH">Hour (00-23)</option>
                                <option value="mm">Minute (00-59)</option>
                              </select>
                            </label>
                          ) : (
                            <label className="lego-field">
                              Format:
                              <select
                                value={block.params.format ?? 'YYYY-MM-DD'}
                                onChange={(e) => updateBlock(block.id, {format: e.target.value})}
                              >
                                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-15)</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY (15/10/2026)</option>
                                <option value="YYMMDD">YYMMDD (261015)</option>
                                <option value="YYYYMMDD">YYYYMMDD (20261015)</option>
                                <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm</option>
                              </select>
                            </label>
                          )}
                        </>
                      )}

                      {/* String: concat, pad_start, pad_end, substring, replace */}
                      {block.category === 'string' && (
                        <>
                          {variables.length > 0 && (
                            <label className="lego-field">
                              Source:
                              <select
                                value={block.params.source ?? ''}
                                onChange={(e) => updateBlock(block.id, {source: e.target.value})}
                              >
                                <option value="">(Previous block output)</option>
                                {variables.map((v) => (
                                  <option key={v.name} value={`{{${v.name}}}`}>
                                    Variable: {v.label || v.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}

                          {block.functionName === 'concat' && (
                            <>
                              <label className="lego-field">
                                Prefix:
                                <input
                                  type="text"
                                  style={{width: 80}}
                                  value={block.params.prefix ?? ''}
                                  placeholder="e.g. SKU-"
                                  onChange={(e) => updateBlock(block.id, {prefix: e.target.value})}
                                />
                              </label>
                              <label className="lego-field">
                                Append:
                                <input
                                  type="text"
                                  style={{width: 80}}
                                  value={block.params.append ?? ''}
                                  placeholder="e.g. -A"
                                  onChange={(e) => updateBlock(block.id, {append: e.target.value})}
                                />
                              </label>
                            </>
                          )}

                          {block.functionName === 'pad_start' && (
                            <>
                              <label className="lego-field">
                                Target digits:
                                <input
                                  type="number"
                                  style={{width: 55}}
                                  value={block.params.length ?? 6}
                                  onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                                />
                              </label>
                              <label className="lego-field">
                                Character:
                                <input
                                  type="text"
                                  style={{width: 40}}
                                  value={block.params.char ?? '0'}
                                  onChange={(e) => updateBlock(block.id, {char: e.target.value})}
                                />
                              </label>
                            </>
                          )}

                          {block.functionName === 'substring' && (
                            <>
                              <label className="lego-field">
                                Start:
                                <input
                                  type="number"
                                  style={{width: 50}}
                                  value={block.params.start ?? 0}
                                  onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                                />
                              </label>
                              <label className="lego-field">
                                Length:
                                <input
                                  type="number"
                                  style={{width: 50}}
                                  value={block.params.length ?? 4}
                                  onChange={(e) => updateBlock(block.id, {length: Number(e.target.value)})}
                                />
                              </label>
                            </>
                          )}

                          {block.functionName === 'replace' && (
                            <>
                              <label className="lego-field">
                                Find:
                                <input
                                  type="text"
                                  style={{width: 70}}
                                  value={block.params.search ?? ''}
                                  onChange={(e) => updateBlock(block.id, {search: e.target.value})}
                                />
                              </label>
                              <label className="lego-field">
                                Replace with:
                                <input
                                  type="text"
                                  style={{width: 70}}
                                  value={block.params.replace ?? ''}
                                  onChange={(e) => updateBlock(block.id, {replace: e.target.value})}
                                />
                              </label>
                            </>
                          )}
                        </>
                      )}

                      {/* Numeric */}
                      {block.category === 'numeric' && (
                        <>
                          {block.functionName === 'counter' && (
                            <>
                              <label className="lego-field">
                                Start:
                                <input
                                  type="number"
                                  style={{width: 60}}
                                  value={block.params.start ?? 1}
                                  onChange={(e) => updateBlock(block.id, {start: Number(e.target.value)})}
                                />
                              </label>
                              <label className="lego-field">
                                Pad zeros:
                                <input
                                  type="number"
                                  style={{width: 50}}
                                  value={block.params.padZeros ?? 4}
                                  onChange={(e) => updateBlock(block.id, {padZeros: Number(e.target.value)})}
                                />
                              </label>
                            </>
                          )}
                          {block.functionName === 'math_op' && (
                            <>
                              <label className="lego-field">
                                Operation:
                                <select
                                  value={block.params.op ?? 'add'}
                                  onChange={(e) => updateBlock(block.id, {op: e.target.value})}
                                >
                                  <option value="add">+ Add</option>
                                  <option value="sub">- Subtract</option>
                                  <option value="mul">× Multiply</option>
                                  <option value="div">÷ Divide</option>
                                </select>
                              </label>
                              <label className="lego-field">
                                Value:
                                <input
                                  type="number"
                                  style={{width: 60}}
                                  value={block.params.value ?? 10}
                                  onChange={(e) => updateBlock(block.id, {value: Number(e.target.value)})}
                                />
                              </label>
                            </>
                          )}
                          {block.functionName === 'round' && (
                            <label className="lego-field">
                              Decimals:
                              <input
                                type="number"
                                style={{width: 50}}
                                value={block.params.decimals ?? 2}
                                onChange={(e) => updateBlock(block.id, {decimals: Number(e.target.value)})}
                              />
                            </label>
                          )}
                        </>
                      )}

                      {/* Condition IF */}
                      {block.category === 'if' && (
                        <>
                          <label className="lego-field">
                            Source:
                            <select
                              value={block.params.source ?? ''}
                              onChange={(e) => updateBlock(block.id, {source: e.target.value})}
                            >
                              <option value="">(Previous output)</option>
                              {variables.map((v) => (
                                <option key={v.name} value={`{{${v.name}}}`}>
                                  {v.label || v.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="lego-field">
                            Operator:
                            <select
                              value={block.params.operator ?? 'equals'}
                              onChange={(e) => updateBlock(block.id, {operator: e.target.value})}
                            >
                              <option value="equals">= Equals</option>
                              <option value="not_equals">≠ Not equals</option>
                              <option value="contains">Contains</option>
                              <option value="greater_than">&gt; Greater than</option>
                              <option value="less_than">&lt; Less than</option>
                              <option value="is_empty">Is empty</option>
                              <option value="is_not_empty">Is not empty</option>
                            </select>
                          </label>
                          <label className="lego-field">
                            Target:
                            <input
                              type="text"
                              style={{width: 70}}
                              value={block.params.target ?? ''}
                              onChange={(e) => updateBlock(block.id, {target: e.target.value})}
                            />
                          </label>
                          <label className="lego-field">
                            Then:
                            <input
                              type="text"
                              style={{width: 80}}
                              value={block.params.thenValue ?? 'APPROVED'}
                              onChange={(e) => updateBlock(block.id, {thenValue: e.target.value})}
                            />
                          </label>
                          <label className="lego-field">
                            Else:
                            <input
                              type="text"
                              style={{width: 80}}
                              value={block.params.elseValue ?? 'PENDING'}
                              onChange={(e) => updateBlock(block.id, {elseValue: e.target.value})}
                            />
                          </label>
                        </>
                      )}

                      {/* Loop Repeat */}
                      {block.category === 'loop' && (
                        <>
                          <label className="lego-field">
                            Text to repeat:
                            <input
                              type="text"
                              style={{width: 60}}
                              value={block.params.text ?? '*'}
                              onChange={(e) => updateBlock(block.id, {text: e.target.value})}
                            />
                          </label>
                          <label className="lego-field">
                            Times:
                            <input
                              type="number"
                              style={{width: 50}}
                              value={block.params.times ?? 5}
                              onChange={(e) => updateBlock(block.id, {times: Number(e.target.value)})}
                            />
                          </label>
                          <label className="lego-field">
                            Separator:
                            <input
                              type="text"
                              style={{width: 40}}
                              value={block.params.separator ?? ''}
                              onChange={(e) => updateBlock(block.id, {separator: e.target.value})}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Live Simulation Card */}
            <div className="formula-simulation-card">
              <div className="sim-info">
                <span className="sim-label">
                  <Play size={10} fill="currentColor" /> Live Simulation (จำลองผลลัพธ์)
                </span>
                <span className="sim-result">{simulatedResult}</span>
              </div>
            </div>
          </main>
        </div>

        {/* Modal Actions */}
        <div className="formula-modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={handleSave}>
            Save Formulas
          </button>
        </div>
      </div>
    </div>
  );
}
