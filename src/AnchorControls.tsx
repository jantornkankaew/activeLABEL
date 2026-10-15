import {useState, useEffect} from 'react';
import {X,ChevronDown,ChevronRight,Plus,AlignHorizontalDistributeCenter,AlignVerticalDistributeCenter} from 'lucide-react';
import type {LabelDocument, LabelObject} from './core';
import {type AnchorSide, type AnchorConstraint, type ObjectAnchors, calculateCurrentMargin} from './anchors';

interface AnchorControlsProps {
  item: LabelObject;
  doc: LabelDocument;
  disabled?: boolean;
  onUpdate: (changes: Partial<LabelObject>) => boolean | void;
}

const SIDES: AnchorSide[] = ['top', 'left', 'right', 'bottom'];
const MARGIN_PRESETS: Array<number | 'auto'> = [0, 4, 8, 16, 24, 32, 'auto'];

interface MarginComboboxProps {
  side: AnchorSide;
  margin: number | 'auto';
  disabled?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onChange: (margin: number | 'auto') => void;
  onClose: () => void;
}

function MarginCombobox({
  side,
  margin,
  disabled,
  isOpen,
  onToggleOpen,
  onChange,
  onClose
}: MarginComboboxProps) {
  const formattedMargin = margin === 'auto' ? 'auto' : String(Number(margin.toFixed(2)));
  const [draft, setDraft] = useState(formattedMargin);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(formattedMargin);
    }
  }, [formattedMargin, isFocused]);

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(`.as-${side}-slot .as-margin-selector-wrap`)) {
        onClose();
      }
    }
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose, side]);

  function commitValue(val: string) {
    const trimmed = val.trim().toLowerCase();
    if (trimmed === 'auto') {
      onChange('auto');
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        onChange(Math.max(0, Number(num.toFixed(2))));
      } else {
        setDraft(formattedMargin);
      }
    }
  }

  return (
    <div className="as-margin-selector-wrap">
      <div
        className={`as-margin-combobox ${isOpen ? 'open' : ''} ${isFocused ? 'focused' : ''}`}
        title={`${side.charAt(0).toUpperCase() + side.slice(1)} Margin (type or choose preset)`}
      >
        <input
          type="text"
          className="as-margin-input"
          value={isFocused ? draft : formattedMargin}
          disabled={disabled}
          aria-label={`${side} margin`}
          onFocus={() => {
            setIsFocused(true);
            setDraft(formattedMargin);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setIsFocused(false);
            commitValue(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            } else if (e.key === 'Escape') {
              setDraft(formattedMargin);
              setIsFocused(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <span className="as-combobox-divider" />
        <button
          type="button"
          className="as-combobox-arrow"
          title="Choose margin preset"
          disabled={disabled}
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onToggleOpen();
          }}
        >
          <ChevronDown size={11} className="as-chevron" />
        </button>
      </div>

      {isOpen && (
        <div className="as-preset-popover">
          {MARGIN_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={margin === preset ? 'chosen' : ''}
              onClick={() => {
                onChange(preset);
                onClose();
              }}
            >
              {preset === 'auto' ? 'Auto' : `${preset} mm`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnchorControls({item, doc, disabled, onUpdate}: AnchorControlsProps) {
  const [activeMarginSide, setActiveMarginSide] = useState<AnchorSide | null>(null);
  const [constraintsExpanded, setConstraintsExpanded] = useState(true);
  const anchors = item.anchors ?? {};
  const otherObjects = doc.objects.filter(o => o.id !== item.id);

  const hasLeft = Boolean(anchors.left);
  const hasRight = Boolean(anchors.right);
  const hasTop = Boolean(anchors.top);
  const hasBottom = Boolean(anchors.bottom);
  const activeCount = Object.keys(anchors).filter(k => k === 'top' || k === 'bottom' || k === 'left' || k === 'right').length;
  const hBias = anchors.horizontalBias ?? 0.5;

  function updateAnchor(side: AnchorSide, constraint: AnchorConstraint | null) {
    const next: ObjectAnchors = {...anchors};
    if (!constraint) {
      delete next[side];
    } else {
      next[side] = constraint;
    }
    const clean = Object.keys(next).length > 0 ? next : undefined;
    onUpdate({anchors: clean});
  }

  function toggleAnchorNode(side: AnchorSide) {
    if (disabled) return;
    if (anchors[side]) {
      updateAnchor(side, null);
      if (activeMarginSide === side) setActiveMarginSide(null);
    } else {
      const defaultTargetEdge = side;
      const currentMargin = calculateCurrentMargin(side, 'parent', defaultTargetEdge, item, doc);
      updateAnchor(side, {
        target: 'parent',
        targetEdge: defaultTargetEdge,
        margin: currentMargin
      });
    }
  }

  function handleTargetChange(side: AnchorSide, targetValue: string) {
    if (targetValue === 'none') {
      updateAnchor(side, null);
      return;
    }
    const defaultTargetEdge = side === 'top' || side === 'bottom'
      ? (targetValue === 'parent' ? side : (side === 'top' ? 'bottom' : 'top'))
      : (targetValue === 'parent' ? side : (side === 'left' ? 'right' : 'left'));

    const existing = anchors[side];
    const margin = existing?.margin ?? calculateCurrentMargin(side, targetValue, defaultTargetEdge, item, doc);
    updateAnchor(side, {
      target: targetValue,
      targetEdge: existing?.targetEdge ?? defaultTargetEdge,
      margin
    });
  }

  function handleEdgeChange(side: AnchorSide, targetEdge: AnchorSide) {
    const current = anchors[side];
    if (!current) return;
    updateAnchor(side, {...current, targetEdge});
  }

  function handleMarginChange(side: AnchorSide, margin: number | 'auto') {
    const current = anchors[side];
    if (!current) {
      updateAnchor(side, {
        target: 'parent',
        targetEdge: side,
        margin
      });
      return;
    }
    updateAnchor(side, {...current, margin});
  }

  function centerHorizontal() {
    onUpdate({
      anchors: {
        ...anchors,
        left: {target: 'parent', targetEdge: 'left', margin: 0},
        right: {target: 'parent', targetEdge: 'right', margin: 0},
        horizontalBias: 0.5
      }
    });
  }

  function centerVertical() {
    onUpdate({
      anchors: {
        ...anchors,
        top: {target: 'parent', targetEdge: 'top', margin: 0},
        bottom: {target: 'parent', targetEdge: 'bottom', margin: 0},
        verticalBias: 0.5
      }
    });
  }

  function clearAll() {
    onUpdate({anchors: undefined});
    setActiveMarginSide(null);
  }

  return (
    <div className="as-constraint-panel">
      {/* Header & Quick Action Buttons */}
      <div className="as-constraint-header">
        <h4>Constraint Widget</h4>
        <div className="as-toolbar-actions">
          <button
            type="button"
            className="as-tool-btn"
            title="Center Horizontally in Parent"
            disabled={disabled}
            onClick={centerHorizontal}
          >
            <AlignHorizontalDistributeCenter size={13}/>
          </button>
          <button
            type="button"
            className="as-tool-btn"
            title="Center Vertically in Parent"
            disabled={disabled}
            onClick={centerVertical}
          >
            <AlignVerticalDistributeCenter size={13}/>
          </button>
          {activeCount > 0 && (
            <button
              type="button"
              className="as-tool-btn danger"
              title="Clear All Constraints"
              disabled={disabled}
              onClick={clearAll}
            >
              <X size={13}/>
            </button>
          )}
        </div>
      </div>

      {/* Android Studio Authentic Constraint Widget Stage */}
      <div className="as-widget-stage">
        <div className="as-widget-frame">
          {/* Top Slot (Row 1, Col 2) */}
          <div className="as-top-slot">
            {hasTop ? (
              <MarginCombobox
                side="top"
                margin={anchors.top!.margin}
                disabled={disabled}
                isOpen={activeMarginSide === 'top'}
                onToggleOpen={() => setActiveMarginSide(activeMarginSide === 'top' ? null : 'top')}
                onChange={(m) => handleMarginChange('top', m)}
                onClose={() => setActiveMarginSide(null)}
              />
            ) : (
              <button
                type="button"
                className="as-blue-plus-btn"
                title="Add Top constraint to parent"
                disabled={disabled}
                onClick={() => toggleAnchorNode('top')}
              >
                <Plus size={10} strokeWidth={2.4}/>
              </button>
            )}

            {hasTop ? (
              <div className="as-solid-connector as-v-conn"/>
            ) : (
              <div className="as-dotted-connector as-v-dotted"/>
            )}

            {hasTop && (
              <button
                type="button"
                className="as-anchor-dot linked"
                title="Top constrained. Click to remove."
                aria-label="Remove top constraint"
                disabled={disabled}
                onClick={() => toggleAnchorNode('top')}
              >
                <span className="as-dot-normal" />
                <X className="as-dot-hover-x" size={10} strokeWidth={2.8} />
              </button>
            )}
          </div>

          {/* Left Slot (Row 2, Col 1) */}
          <div className="as-left-slot">
            {hasLeft ? (
              <MarginCombobox
                side="left"
                margin={anchors.left!.margin}
                disabled={disabled}
                isOpen={activeMarginSide === 'left'}
                onToggleOpen={() => setActiveMarginSide(activeMarginSide === 'left' ? null : 'left')}
                onChange={(m) => handleMarginChange('left', m)}
                onClose={() => setActiveMarginSide(null)}
              />
            ) : (
              <button
                type="button"
                className="as-blue-plus-btn"
                title="Add Left constraint to parent"
                disabled={disabled}
                onClick={() => toggleAnchorNode('left')}
              >
                <Plus size={10} strokeWidth={2.4}/>
              </button>
            )}

            {hasLeft ? (
              <div className="as-solid-connector as-h-conn"/>
            ) : (
              <div className="as-dotted-connector as-h-dotted"/>
            )}

            {hasLeft && (
              <button
                type="button"
                className="as-anchor-dot linked"
                title="Left constrained. Click to remove."
                aria-label="Remove left constraint"
                disabled={disabled}
                onClick={() => toggleAnchorNode('left')}
              >
                <span className="as-dot-normal" />
                <X className="as-dot-hover-x" size={10} strokeWidth={2.8} />
              </button>
            )}
          </div>

          {/* Center Box representing the view (Row 2, Col 2) */}
          <div className="as-center-view">
            {/* Android Studio Fixed Dimension I-beam Glyphs */}
            <svg className="as-box-glyph-svg" viewBox="0 0 50 36">
              {/* Horizontal I-beam */}
              <line x1="8" y1="18" x2="42" y2="18" stroke="#606672" strokeWidth="1.2"/>
              <line x1="8" y1="14" x2="8" y2="22" stroke="#606672" strokeWidth="1.2"/>
              <line x1="42" y1="14" x2="42" y2="22" stroke="#606672" strokeWidth="1.2"/>

              {/* Vertical I-beam */}
              <line x1="25" y1="6" x2="25" y2="30" stroke="#606672" strokeWidth="1.2"/>
              <line x1="21" y1="6" x2="29" y2="6" stroke="#606672" strokeWidth="1.2"/>
              <line x1="21" y1="30" x2="29" y2="30" stroke="#606672" strokeWidth="1.2"/>
            </svg>

            {/* Horizontal Zigzag Spring (when centered) */}
            {hasLeft && hasRight && (
              <svg className="as-spring-svg as-h-spring" viewBox="0 0 50 8">
                <path d="M 0 4 L 5 4 L 9 1 L 15 7 L 21 1 L 27 7 L 33 1 L 39 7 L 45 4 L 50 4" fill="none" stroke="#2196F3" strokeWidth="1.3"/>
              </svg>
            )}

            {/* Vertical Zigzag Spring (when centered) */}
            {hasTop && hasBottom && (
              <svg className="as-spring-svg as-v-spring" viewBox="0 0 8 36">
                <path d="M 4 0 L 4 4 L 1 7 L 7 13 L 1 19 L 7 25 L 1 29 L 4 32 L 4 36" fill="none" stroke="#2196F3" strokeWidth="1.3"/>
              </svg>
            )}

            <div className="as-view-meta">
              <span className="as-view-name">{item.name || item.kind}</span>
              <span className="as-view-dim">{Number(item.width.toFixed(1))} × {Number(item.height.toFixed(1))}</span>
            </div>
          </div>

          {/* Right Slot (Row 2, Col 3) */}
          <div className="as-right-slot">
            {hasRight && (
              <button
                type="button"
                className="as-anchor-dot linked"
                title="Right constrained. Click to remove."
                aria-label="Remove right constraint"
                disabled={disabled}
                onClick={() => toggleAnchorNode('right')}
              >
                <span className="as-dot-normal" />
                <X className="as-dot-hover-x" size={10} strokeWidth={2.8} />
              </button>
            )}

            {hasRight ? (
              <div className="as-solid-connector as-h-conn"/>
            ) : (
              <div className="as-dotted-connector as-h-dotted"/>
            )}

            {hasRight ? (
              <MarginCombobox
                side="right"
                margin={anchors.right!.margin}
                disabled={disabled}
                isOpen={activeMarginSide === 'right'}
                onToggleOpen={() => setActiveMarginSide(activeMarginSide === 'right' ? null : 'right')}
                onChange={(m) => handleMarginChange('right', m)}
                onClose={() => setActiveMarginSide(null)}
              />
            ) : (
              <button
                type="button"
                className="as-blue-plus-btn"
                title="Add Right constraint to parent"
                disabled={disabled}
                onClick={() => toggleAnchorNode('right')}
              >
                <Plus size={10} strokeWidth={2.4}/>
              </button>
            )}
          </div>

          {/* Bottom Slot (Row 3, Col 2) */}
          <div className="as-bottom-slot">
            {hasBottom && (
              <button
                type="button"
                className="as-anchor-dot linked"
                title="Bottom constrained. Click to remove."
                aria-label="Remove bottom constraint"
                disabled={disabled}
                onClick={() => toggleAnchorNode('bottom')}
              >
                <span className="as-dot-normal" />
                <X className="as-dot-hover-x" size={10} strokeWidth={2.8} />
              </button>
            )}

            {hasBottom ? (
              <div className="as-solid-connector as-v-conn"/>
            ) : (
              <div className="as-dotted-connector as-v-dotted"/>
            )}

            {hasBottom ? (
              <MarginCombobox
                side="bottom"
                margin={anchors.bottom!.margin}
                disabled={disabled}
                isOpen={activeMarginSide === 'bottom'}
                onToggleOpen={() => setActiveMarginSide(activeMarginSide === 'bottom' ? null : 'bottom')}
                onChange={(m) => handleMarginChange('bottom', m)}
                onClose={() => setActiveMarginSide(null)}
              />
            ) : (
              <button
                type="button"
                className="as-blue-plus-btn"
                title="Add Bottom constraint to parent"
                disabled={disabled}
                onClick={() => toggleAnchorNode('bottom')}
              >
                <Plus size={10} strokeWidth={2.4}/>
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Bias Slider (matches Android Studio's circular (50) badge thumb) */}
        {hasLeft && hasRight && (
          <div className="as-bias-slider-container">
            <div className="as-bias-track-wrap">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(hBias * 100)}
                disabled={disabled}
                onChange={e => {
                  const val = Number(e.target.value) / 100;
                  onUpdate({anchors: {...anchors, horizontalBias: val}});
                }}
                className="as-bias-range-input"
              />
              <div
                className="as-bias-badge"
                style={{left: `calc(${hBias * 100}% - 11px)`}}
              >
                {Math.round(hBias * 100)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Constraints Accordion Section (> Constraints (N)) */}
      <div className="as-constraints-accordion">
        <button
          type="button"
          className="as-accordion-toggle"
          onClick={() => setConstraintsExpanded(!constraintsExpanded)}
        >
          <ChevronRight size={13} className={`as-toggle-arrow ${constraintsExpanded ? 'open' : ''}`}/>
          <span>Constraints ({activeCount})</span>
        </button>

        {constraintsExpanded && (
          <div className="as-constraint-list">
            {SIDES.map(side => {
              const constraint = anchors[side];
              const isLinked = Boolean(constraint);
              const isVertical = side === 'top' || side === 'bottom';

              return (
                <div key={side} className={`as-constraint-row ${isLinked ? 'is-linked' : ''}`}>
                  <div className="as-row-label">
                    <span className={`as-side-dot ${isLinked ? 'linked' : ''}`}/>
                    <span className="as-side-title">{side.toUpperCase()}</span>
                  </div>

                  <div className="as-row-controls">
                    <select
                      aria-label={`${side} target`}
                      className="as-target-select"
                      value={constraint ? constraint.target : 'none'}
                      disabled={disabled}
                      onChange={e => handleTargetChange(side, e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="parent">Parent (Label)</option>
                      {otherObjects.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name || o.kind} ({o.kind})
                        </option>
                      ))}
                    </select>

                    {constraint && (
                      <>
                        <select
                          aria-label={`${side} target edge`}
                          className="as-edge-select"
                          value={constraint.targetEdge}
                          disabled={disabled}
                          onChange={e => handleEdgeChange(side, e.target.value as AnchorSide)}
                        >
                          {isVertical ? (
                            <>
                              <option value="top">to Top</option>
                              <option value="bottom">to Bottom</option>
                            </>
                          ) : (
                            <>
                              <option value="left">to Left</option>
                              <option value="right">to Right</option>
                            </>
                          )}
                        </select>

                        {constraint.margin !== 'auto' ? (
                          <div className="as-margin-input-box">
                            <input
                              aria-label={`${side} margin value`}
                              type="number"
                              step="0.5"
                              min="0"
                              value={constraint.margin}
                              disabled={disabled}
                              onChange={e => handleMarginChange(side, Math.max(0, parseFloat(e.target.value) || 0))}
                            />
                            <span className="as-unit">mm</span>
                          </div>
                        ) : (
                          <span className="as-auto-badge">Auto</span>
                        )}

                        <button
                          type="button"
                          className={`as-auto-btn ${constraint.margin === 'auto' ? 'active' : ''}`}
                          title={constraint.margin === 'auto' ? 'Switch to fixed margin' : 'Set to Auto (Centering)'}
                          disabled={disabled}
                          onClick={() => handleMarginChange(side, constraint.margin === 'auto' ? 0 : 'auto')}
                        >
                          Auto
                        </button>

                        <button
                          type="button"
                          className="as-remove-btn"
                          title={`Remove ${side} constraint`}
                          disabled={disabled}
                          onClick={() => updateAnchor(side, null)}
                        >
                          <X size={12}/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

