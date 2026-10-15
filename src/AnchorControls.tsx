import {useState} from 'react';
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
          {/* Top Constraint or Blue Plus Button */}
          <div className="as-node-col as-top-col">
            {hasTop ? (
              <div className="as-margin-selector-wrap">
                <button
                  type="button"
                  className="as-margin-pill active"
                  title="Top Margin"
                  disabled={disabled}
                  onClick={() => setActiveMarginSide(activeMarginSide === 'top' ? null : 'top')}
                >
                  <span className="as-pill-val">{anchors.top!.margin === 'auto' ? 'auto' : `${anchors.top!.margin}`}</span>
                  <span className="as-pill-divider"/>
                  <ChevronDown size={11} className="as-chevron"/>
                </button>
                {activeMarginSide === 'top' && (
                  <div className="as-preset-popover">
                    {MARGIN_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        className={anchors.top?.margin === preset ? 'chosen' : ''}
                        onClick={() => {
                          handleMarginChange('top', preset);
                          setActiveMarginSide(null);
                        }}
                      >
                        {preset === 'auto' ? 'Auto' : `${preset} mm`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {hasTop ? (
              <div className="as-solid-connector as-v-conn"/>
            ) : (
              <div className="as-dotted-connector as-v-dotted"/>
            )}

            {hasTop ? (
              <div
                className="as-anchor-dot linked"
                title="Top constrained. Click to remove."
                onClick={() => toggleAnchorNode('top')}
              >
                <div className="as-dot-inner"/>
              </div>
            ) : (
              <button
                type="button"
                className="as-blue-plus-btn"
                title="Add Top constraint to parent"
                disabled={disabled}
                onClick={() => toggleAnchorNode('top')}
              >
                <Plus size={12}/>
              </button>
            )}
          </div>

          {/* Middle Row: Left - Center Box - Right */}
          <div className="as-widget-mid-row">
            {/* Left Constraint or Blue Plus Button */}
            <div className="as-node-row as-left-row">
              {hasLeft ? (
                <div className="as-margin-selector-wrap">
                  <button
                    type="button"
                    className="as-margin-pill active"
                    title="Left Margin"
                    disabled={disabled}
                    onClick={() => setActiveMarginSide(activeMarginSide === 'left' ? null : 'left')}
                  >
                    <span className="as-pill-val">{anchors.left!.margin === 'auto' ? 'auto' : `${anchors.left!.margin}`}</span>
                    <span className="as-pill-divider"/>
                    <ChevronDown size={11} className="as-chevron"/>
                  </button>
                  {activeMarginSide === 'left' && (
                    <div className="as-preset-popover">
                      {MARGIN_PRESETS.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          className={anchors.left?.margin === preset ? 'chosen' : ''}
                          onClick={() => {
                            handleMarginChange('left', preset);
                            setActiveMarginSide(null);
                          }}
                        >
                          {preset === 'auto' ? 'Auto' : `${preset} mm`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {hasLeft ? (
                <div className="as-solid-connector as-h-conn"/>
              ) : (
                <button
                  type="button"
                  className="as-blue-plus-btn"
                  title="Add Left constraint to parent"
                  disabled={disabled}
                  onClick={() => toggleAnchorNode('left')}
                >
                  <Plus size={12}/>
                </button>
              )}

              {hasLeft ? (
                <div
                  className="as-anchor-dot linked"
                  title="Left constrained. Click to remove."
                  onClick={() => toggleAnchorNode('left')}
                >
                  <div className="as-dot-inner"/>
                </div>
              ) : (
                <div className="as-dotted-connector as-h-dotted"/>
              )}
            </div>

            {/* Center Box representing the view */}
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

            {/* Right Constraint or Blue Plus Button */}
            <div className="as-node-row as-right-row">
              {hasRight ? (
                <div
                  className="as-anchor-dot linked"
                  title="Right constrained. Click to remove."
                  onClick={() => toggleAnchorNode('right')}
                >
                  <div className="as-dot-inner"/>
                </div>
              ) : (
                <div className="as-dotted-connector as-h-dotted"/>
              )}

              {hasRight ? (
                <div className="as-solid-connector as-h-conn"/>
              ) : (
                <button
                  type="button"
                  className="as-blue-plus-btn"
                  title="Add Right constraint to parent"
                  disabled={disabled}
                  onClick={() => toggleAnchorNode('right')}
                >
                  <Plus size={12}/>
                </button>
              )}

              {hasRight ? (
                <div className="as-margin-selector-wrap">
                  <button
                    type="button"
                    className="as-margin-pill active"
                    title="Right Margin"
                    disabled={disabled}
                    onClick={() => setActiveMarginSide(activeMarginSide === 'right' ? null : 'right')}
                  >
                    <span className="as-pill-val">{anchors.right!.margin === 'auto' ? 'auto' : `${anchors.right!.margin}`}</span>
                    <span className="as-pill-divider"/>
                    <ChevronDown size={11} className="as-chevron"/>
                  </button>
                  {activeMarginSide === 'right' && (
                    <div className="as-preset-popover">
                      {MARGIN_PRESETS.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          className={anchors.right?.margin === preset ? 'chosen' : ''}
                          onClick={() => {
                            handleMarginChange('right', preset);
                            setActiveMarginSide(null);
                          }}
                        >
                          {preset === 'auto' ? 'Auto' : `${preset} mm`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Bottom Constraint or Blue Plus Button (matches screenshot exactly) */}
          <div className="as-node-col as-bottom-col">
            {hasBottom ? (
              <div
                className="as-anchor-dot linked"
                title="Bottom constrained. Click to remove."
                onClick={() => toggleAnchorNode('bottom')}
              >
                <div className="as-dot-inner"/>
              </div>
            ) : (
              <div className="as-dotted-connector as-v-dotted"/>
            )}

            {hasBottom ? (
              <div className="as-solid-connector as-v-conn"/>
            ) : (
              <button
                type="button"
                className="as-blue-plus-btn"
                title="Add Bottom constraint to parent"
                disabled={disabled}
                onClick={() => toggleAnchorNode('bottom')}
              >
                <Plus size={12}/>
              </button>
            )}

            {hasBottom ? (
              <div className="as-margin-selector-wrap">
                <button
                  type="button"
                  className="as-margin-pill active"
                  title="Bottom Margin"
                  disabled={disabled}
                  onClick={() => setActiveMarginSide(activeMarginSide === 'bottom' ? null : 'bottom')}
                >
                  <span className="as-pill-val">{anchors.bottom!.margin === 'auto' ? 'auto' : `${anchors.bottom!.margin}`}</span>
                  <span className="as-pill-divider"/>
                  <ChevronDown size={11} className="as-chevron"/>
                </button>
                {activeMarginSide === 'bottom' && (
                  <div className="as-preset-popover">
                    {MARGIN_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        className={anchors.bottom?.margin === preset ? 'chosen' : ''}
                        onClick={() => {
                          handleMarginChange('bottom', preset);
                          setActiveMarginSide(null);
                        }}
                      >
                        {preset === 'auto' ? 'Auto' : `${preset} mm`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
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

