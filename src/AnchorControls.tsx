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

function ConstraintLinkIcon({size = 14, className}: {size?: number; className?: string}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{flexShrink: 0}}>
      <circle cx="3" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 13 C 7.5 13, 8.5 3, 11.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

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
  const [selectedConstraintSide, setSelectedConstraintSide] = useState<AnchorSide | null>(null);
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
            {/* Android Studio Fixed Dimension I-beam Glyphs with center gap */}
            <svg className="as-box-glyph-svg" viewBox="0 0 64 54">
              {/* Horizontal I-beam: Left segment */}
              <line x1="8" y1="27" x2="24" y2="27" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="8" y1="21" x2="8" y2="33" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="24" y1="22" x2="24" y2="32" stroke="#7f838c" strokeWidth="1.2"/>

              {/* Horizontal I-beam: Right segment */}
              <line x1="40" y1="27" x2="56" y2="27" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="40" y1="22" x2="40" y2="32" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="56" y1="21" x2="56" y2="33" stroke="#7f838c" strokeWidth="1.2"/>

              {/* Vertical I-beam: Top segment */}
              <line x1="32" y1="8" x2="32" y2="20" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="26" y1="8" x2="38" y2="8" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="27" y1="20" x2="37" y2="20" stroke="#7f838c" strokeWidth="1.2"/>

              {/* Vertical I-beam: Bottom segment */}
              <line x1="32" y1="34" x2="32" y2="46" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="27" y1="34" x2="37" y2="34" stroke="#7f838c" strokeWidth="1.2"/>
              <line x1="26" y1="46" x2="38" y2="46" stroke="#7f838c" strokeWidth="1.2"/>
            </svg>

            {/* Horizontal Zigzag Spring (when centered) */}
            {hasLeft && hasRight && (
              <svg className="as-spring-svg as-h-spring" viewBox="0 0 64 8">
                <path d="M 0 4 L 8 4 L 14 1 L 22 7 L 30 1 L 38 7 L 46 1 L 54 7 L 58 4 L 64 4" fill="none" stroke="#2196F3" strokeWidth="1.3"/>
              </svg>
            )}

            {/* Vertical Zigzag Spring (when centered) */}
            {hasTop && hasBottom && (
              <svg className="as-spring-svg as-v-spring" viewBox="0 0 8 54">
                <path d="M 4 0 L 4 6 L 1 11 L 7 19 L 1 27 L 7 35 L 1 43 L 4 48 L 4 54" fill="none" stroke="#2196F3" strokeWidth="1.3"/>
              </svg>
            )}
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
                ({Math.round(hBias * 100)})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Constraints Accordion Section (⌄ Constraints) */}
      <div className="as-constraints-accordion">
        <button
          type="button"
          className="as-accordion-toggle"
          onClick={() => setConstraintsExpanded(!constraintsExpanded)}
        >
          <ChevronDown size={14} className={`as-toggle-arrow ${constraintsExpanded ? 'open' : ''}`}/>
          <span>Constraints</span>
        </button>

        {constraintsExpanded && (
          <div className="as-as-constraint-list">
            {SIDES.filter(s => Boolean(anchors[s])).map(side => {
              const constraint = anchors[side]!;
              const isVertical = side === 'top' || side === 'bottom';
              const sideName = side === 'left' ? 'Start' : side === 'right' ? 'End' : side === 'top' ? 'Top' : 'Bottom';
              const edgeName = constraint.targetEdge === 'left' ? 'StartOf' : constraint.targetEdge === 'right' ? 'EndOf' : constraint.targetEdge === 'top' ? 'TopOf' : 'BottomOf';
              let targetName = 'parent';
              if (constraint.target !== 'parent') {
                const targetObj = doc.objects.find(o => o.id === constraint.target);
                targetName = targetObj ? (targetObj.name || targetObj.kind) : constraint.target;
              }
              const marginStr = constraint.margin === 'auto' ? 'auto' : `${constraint.margin}mm`;
              const isSelected = selectedConstraintSide === side;

              return (
                <div
                  key={side}
                  className={`as-as-constraint-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedConstraintSide(isSelected ? null : side)}
                >
                  <div className="as-as-row-header">
                    <ConstraintLinkIcon size={14} className="as-as-wire-icon" />
                    <span className="as-as-row-label">
                      <span>{sideName} → {edgeName} </span>
                      <strong className="as-as-target">{targetName}</strong>
                      <span className="as-as-margin"> ({marginStr})</span>
                    </span>
                    <button
                      type="button"
                      className="as-as-row-del"
                      title={`Remove ${sideName} constraint`}
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAnchor(side, null);
                        if (selectedConstraintSide === side) setSelectedConstraintSide(null);
                      }}
                    >
                      <X size={11} strokeWidth={2.4} />
                    </button>
                  </div>

                  {isSelected && (
                    <div className="as-as-inline-controls" onClick={(e) => e.stopPropagation()}>
                      <div className="as-as-control-group">
                        <label>Target:</label>
                        <select
                          value={constraint.target}
                          disabled={disabled}
                          onChange={(e) => handleTargetChange(side, e.target.value)}
                        >
                          <option value="parent">parent (Label)</option>
                          {otherObjects.map(o => (
                            <option key={o.id} value={o.id}>{o.name || o.kind}</option>
                          ))}
                        </select>
                      </div>

                      <div className="as-as-control-group">
                        <label>Target Edge:</label>
                        <select
                          value={constraint.targetEdge}
                          disabled={disabled}
                          onChange={(e) => handleEdgeChange(side, e.target.value as AnchorSide)}
                        >
                          {isVertical ? (
                            <>
                              <option value="top">TopOf</option>
                              <option value="bottom">BottomOf</option>
                            </>
                          ) : (
                            <>
                              <option value="left">StartOf</option>
                              <option value="right">EndOf</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="as-as-control-group">
                        <label>Margin:</label>
                        <div className="as-as-margin-wrap">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={constraint.margin === 'auto' ? 0 : constraint.margin}
                            disabled={disabled || constraint.margin === 'auto'}
                            onChange={(e) => handleMarginChange(side, Math.max(0, parseFloat(e.target.value) || 0))}
                          />
                          <span className="as-unit">mm</span>
                        </div>
                        <button
                          type="button"
                          className={`as-as-auto-toggle ${constraint.margin === 'auto' ? 'active' : ''}`}
                          disabled={disabled}
                          onClick={() => handleMarginChange(side, constraint.margin === 'auto' ? 0 : 'auto')}
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Dimension rows like Android Studio */}
            <div className="as-as-constraint-row as-dimension-row">
              <div className="as-as-row-header">
                <ConstraintLinkIcon size={14} className="as-as-wire-icon dim" />
                <span className="as-as-row-label">
                  <span>Width</span>
                  <span className="as-as-margin"> ({Number(item.width.toFixed(1))}mm)</span>
                </span>
              </div>
            </div>
            <div className="as-as-constraint-row as-dimension-row">
              <div className="as-as-row-header">
                <ConstraintLinkIcon size={14} className="as-as-wire-icon dim" />
                <span className="as-as-row-label">
                  <span>Height</span>
                  <span className="as-as-margin"> ({Number(item.height.toFixed(1))}mm)</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

