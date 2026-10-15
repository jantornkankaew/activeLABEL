import {useState} from 'react';
import {X,Link2,Unlink,Maximize2,ChevronDown,Minus,AlignHorizontalDistributeCenter,AlignVerticalDistributeCenter} from 'lucide-react';
import type {LabelDocument, LabelObject} from './core';
import {type AnchorSide, type AnchorConstraint, type ObjectAnchors, calculateCurrentMargin} from './anchors';

interface AnchorControlsProps {
  item: LabelObject;
  doc: LabelDocument;
  disabled?: boolean;
  onUpdate: (changes: Partial<LabelObject>) => boolean | void;
}

const SIDES: AnchorSide[] = ['top', 'left', 'right', 'bottom'];
const MARGIN_PRESETS: Array<number | 'auto'> = [0, 2, 4, 8, 16, 24, 'auto'];

export function AnchorControls({item, doc, disabled, onUpdate}: AnchorControlsProps) {
  const [activeMarginSide, setActiveMarginSide] = useState<AnchorSide | null>(null);
  const anchors = item.anchors ?? {};
  const otherObjects = doc.objects.filter(o => o.id !== item.id);

  const hasLeft = Boolean(anchors.left);
  const hasRight = Boolean(anchors.right);
  const hasTop = Boolean(anchors.top);
  const hasBottom = Boolean(anchors.bottom);
  const hasAny = Boolean(item.anchors && Object.keys(item.anchors).length > 0);

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
      // Disconnect
      updateAnchor(side, null);
      if (activeMarginSide === side) setActiveMarginSide(null);
    } else {
      // Connect to parent with current margin distance (authentic Android Studio behavior)
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
        left: {target: 'parent', targetEdge: 'left', margin: 'auto'},
        right: {target: 'parent', targetEdge: 'right', margin: 'auto'}
      }
    });
  }

  function centerVertical() {
    onUpdate({
      anchors: {
        ...anchors,
        top: {target: 'parent', targetEdge: 'top', margin: 'auto'},
        bottom: {target: 'parent', targetEdge: 'bottom', margin: 'auto'}
      }
    });
  }

  function clearAll() {
    onUpdate({anchors: undefined});
    setActiveMarginSide(null);
  }

  return (
    <div className="as-constraint-panel">
      {/* Android Studio Style Header & Action Toolbar */}
      <div className="as-constraint-header">
        <h4>Constraints</h4>
        <div className="as-toolbar-actions">
          <button
            type="button"
            className="as-tool-btn"
            title="Center Horizontally in Parent"
            disabled={disabled}
            onClick={centerHorizontal}
          >
            <AlignHorizontalDistributeCenter size={14}/>
          </button>
          <button
            type="button"
            className="as-tool-btn"
            title="Center Vertically in Parent"
            disabled={disabled}
            onClick={centerVertical}
          >
            <AlignVerticalDistributeCenter size={14}/>
          </button>
          {hasAny && (
            <button
              type="button"
              className="as-tool-btn danger"
              title="Clear All Constraints"
              disabled={disabled}
              onClick={clearAll}
            >
              <X size={14}/>
            </button>
          )}
        </div>
      </div>

      {/* The Android Studio Constraint Widget Box */}
      <div className="as-widget-stage">
        <div className="as-widget-frame">
          {/* Top Anchor & Margin */}
          <div className="as-node-col as-top-col">
            <div className="as-margin-selector-wrap">
              <button
                type="button"
                className={`as-margin-pill ${hasTop ? 'active' : ''}`}
                title="Top Margin"
                disabled={disabled}
                onClick={() => setActiveMarginSide(activeMarginSide === 'top' ? null : 'top')}
              >
                <span>{hasTop ? (anchors.top!.margin === 'auto' ? 'auto' : `${anchors.top!.margin}`) : '—'}</span>
                <ChevronDown size={10} className="as-chevron"/>
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

            <button
              type="button"
              className={`as-anchor-dot ${hasTop ? 'linked' : ''}`}
              title={hasTop ? 'Click to remove Top constraint' : 'Click to constraint Top to Parent'}
              disabled={disabled}
              onClick={() => toggleAnchorNode('top')}
            >
              {hasTop ? <div className="as-dot-inner"/> : <span className="as-dot-plus">+</span>}
            </button>
            {hasTop && <div className="as-link-line as-v-line"/>}
          </div>

          {/* Middle Row: Left - Center Box - Right */}
          <div className="as-widget-mid-row">
            {/* Left Anchor & Margin */}
            <div className="as-node-row as-left-row">
              <div className="as-margin-selector-wrap">
                <button
                  type="button"
                  className={`as-margin-pill ${hasLeft ? 'active' : ''}`}
                  title="Left Margin"
                  disabled={disabled}
                  onClick={() => setActiveMarginSide(activeMarginSide === 'left' ? null : 'left')}
                >
                  <span>{hasLeft ? (anchors.left!.margin === 'auto' ? 'auto' : `${anchors.left!.margin}`) : '—'}</span>
                  <ChevronDown size={10} className="as-chevron"/>
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

              {hasLeft && <div className="as-link-line as-h-line"/>}
              <button
                type="button"
                className={`as-anchor-dot ${hasLeft ? 'linked' : ''}`}
                title={hasLeft ? 'Click to remove Left constraint' : 'Click to constraint Left to Parent'}
                disabled={disabled}
                onClick={() => toggleAnchorNode('left')}
              >
                {hasLeft ? <div className="as-dot-inner"/> : <span className="as-dot-plus">+</span>}
              </button>
            </div>

            {/* Center View Representation */}
            <div className="as-center-view">
              {/* Horizontal Zigzag Spring (when both left & right are constrained) */}
              {hasLeft && hasRight && (
                <svg className="as-spring-svg as-h-spring" viewBox="0 0 40 8">
                  <path d="M 0 4 L 4 4 L 7 1 L 13 7 L 19 1 L 25 7 L 31 1 L 34 7 L 37 4 L 40 4" fill="none" stroke="#00866c" strokeWidth="1.2"/>
                </svg>
              )}

              {/* Vertical Zigzag Spring (when both top & bottom are constrained) */}
              {hasTop && hasBottom && (
                <svg className="as-spring-svg as-v-spring" viewBox="0 0 8 40">
                  <path d="M 4 0 L 4 4 L 1 7 L 7 13 L 1 19 L 7 25 L 1 31 L 7 34 L 4 37 L 4 40" fill="none" stroke="#00866c" strokeWidth="1.2"/>
                </svg>
              )}

              <div className="as-view-meta">
                <span className="as-view-name">{item.name || item.kind}</span>
                <span className="as-view-dim">{Number(item.width.toFixed(1))} × {Number(item.height.toFixed(1))}</span>
              </div>
            </div>

            {/* Right Anchor & Margin */}
            <div className="as-node-row as-right-row">
              <button
                type="button"
                className={`as-anchor-dot ${hasRight ? 'linked' : ''}`}
                title={hasRight ? 'Click to remove Right constraint' : 'Click to constraint Right to Parent'}
                disabled={disabled}
                onClick={() => toggleAnchorNode('right')}
              >
                {hasRight ? <div className="as-dot-inner"/> : <span className="as-dot-plus">+</span>}
              </button>
              {hasRight && <div className="as-link-line as-h-line"/>}

              <div className="as-margin-selector-wrap">
                <button
                  type="button"
                  className={`as-margin-pill ${hasRight ? 'active' : ''}`}
                  title="Right Margin"
                  disabled={disabled}
                  onClick={() => setActiveMarginSide(activeMarginSide === 'right' ? null : 'right')}
                >
                  <span>{hasRight ? (anchors.right!.margin === 'auto' ? 'auto' : `${anchors.right!.margin}`) : '—'}</span>
                  <ChevronDown size={10} className="as-chevron"/>
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
            </div>
          </div>

          {/* Bottom Anchor & Margin */}
          <div className="as-node-col as-bottom-col">
            {hasBottom && <div className="as-link-line as-v-line"/>}
            <button
              type="button"
              className={`as-anchor-dot ${hasBottom ? 'linked' : ''}`}
              title={hasBottom ? 'Click to remove Bottom constraint' : 'Click to constraint Bottom to Parent'}
              disabled={disabled}
              onClick={() => toggleAnchorNode('bottom')}
            >
              {hasBottom ? <div className="as-dot-inner"/> : <span className="as-dot-plus">+</span>}
            </button>

            <div className="as-margin-selector-wrap">
              <button
                type="button"
                className={`as-margin-pill ${hasBottom ? 'active' : ''}`}
                title="Bottom Margin"
                disabled={disabled}
                onClick={() => setActiveMarginSide(activeMarginSide === 'bottom' ? null : 'bottom')}
              >
                <span>{hasBottom ? (anchors.bottom!.margin === 'auto' ? 'auto' : `${anchors.bottom!.margin}`) : '—'}</span>
                <ChevronDown size={10} className="as-chevron"/>
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
          </div>
        </div>
      </div>

      {/* Constraints Attribute Rows (Android Studio Style Attributes) */}
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
                {/* Target Dropdown */}
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
                    {/* Snap Edge Dropdown */}
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

                    {/* Margin input or Auto badge */}
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

                    {/* Auto Toggle Pill */}
                    <button
                      type="button"
                      className={`as-auto-btn ${constraint.margin === 'auto' ? 'active' : ''}`}
                      title={constraint.margin === 'auto' ? 'Switch to fixed margin' : 'Set to Auto (Centering)'}
                      disabled={disabled}
                      onClick={() => handleMarginChange(side, constraint.margin === 'auto' ? 0 : 'auto')}
                    >
                      Auto
                    </button>

                    {/* Disconnect Button */}
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
    </div>
  );
}
