import {useState} from 'react';
import {X,Link2,Unlink,Maximize2} from 'lucide-react';
import type {LabelDocument, LabelObject} from './core';
import type {AnchorSide, AnchorConstraint, ObjectAnchors} from './anchors';

interface AnchorControlsProps {
  item: LabelObject;
  doc: LabelDocument;
  disabled?: boolean;
  onUpdate: (changes: Partial<LabelObject>) => boolean | void;
}

const SIDES: AnchorSide[] = ['top', 'bottom', 'left', 'right'];

export function AnchorControls({item, doc, disabled, onUpdate}: AnchorControlsProps) {
  const [activeSide, setActiveSide] = useState<AnchorSide>('top');
  const anchors = item.anchors ?? {};

  const otherObjects = doc.objects.filter(o => o.id !== item.id);

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

  function handleTargetChange(side: AnchorSide, targetValue: string) {
    if (targetValue === 'none') {
      updateAnchor(side, null);
      return;
    }
    const defaultTargetEdge = side === 'top' || side === 'bottom'
      ? (targetValue === 'parent' ? side : (side === 'top' ? 'bottom' : 'top'))
      : (targetValue === 'parent' ? side : (side === 'left' ? 'right' : 'left'));

    const existing = anchors[side];
    updateAnchor(side, {
      target: targetValue,
      targetEdge: existing?.targetEdge ?? defaultTargetEdge,
      margin: existing?.margin ?? 0
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
      const defaultTargetEdge = side === 'top' || side === 'bottom' ? side : side;
      updateAnchor(side, {
        target: 'parent',
        targetEdge: defaultTargetEdge,
        margin
      });
      return;
    }
    updateAnchor(side, {...current, margin});
  }

  function quickCenterHorizontal() {
    onUpdate({
      anchors: {
        ...anchors,
        left: {target: 'parent', targetEdge: 'left', margin: 'auto'},
        right: {target: 'parent', targetEdge: 'right', margin: 'auto'}
      }
    });
  }

  function quickCenterVertical() {
    onUpdate({
      anchors: {
        ...anchors,
        top: {target: 'parent', targetEdge: 'top', margin: 'auto'},
        bottom: {target: 'parent', targetEdge: 'bottom', margin: 'auto'}
      }
    });
  }

  function quickCenterAll() {
    onUpdate({
      anchors: {
        top: {target: 'parent', targetEdge: 'top', margin: 'auto'},
        bottom: {target: 'parent', targetEdge: 'bottom', margin: 'auto'},
        left: {target: 'parent', targetEdge: 'left', margin: 'auto'},
        right: {target: 'parent', targetEdge: 'right', margin: 'auto'}
      }
    });
  }

  function clearAllAnchors() {
    onUpdate({anchors: undefined});
  }

  const currentConstraint = anchors[activeSide];

  return (
    <div className="anchor-controls">
      <div className="anchor-header">
        <h4>Anchors & Constraints</h4>
        <div className="anchor-quick-actions">
          <button
            type="button"
            className="anchor-pill-btn"
            title="Center horizontally in label"
            disabled={disabled}
            onClick={quickCenterHorizontal}
          >
            H-Center
          </button>
          <button
            type="button"
            className="anchor-pill-btn"
            title="Center vertically in label"
            disabled={disabled}
            onClick={quickCenterVertical}
          >
            V-Center
          </button>
          <button
            type="button"
            className="anchor-pill-btn"
            title="Center in label"
            disabled={disabled}
            onClick={quickCenterAll}
          >
            <Maximize2 size={12}/>
          </button>
          {Boolean(item.anchors && Object.keys(item.anchors).length > 0) && (
            <button
              type="button"
              className="anchor-pill-btn danger-pill"
              title="Clear all anchors"
              disabled={disabled}
              onClick={clearAllAnchors}
            >
              <X size={12}/>
            </button>
          )}
        </div>
      </div>

      {/* Blueprint Visual Constraint Box (Android Studio style) */}
      <div className="constraint-widget-container">
        <div className="constraint-blueprint">
          {/* Top Node & Margin */}
          <div className="blueprint-top">
            <button
              type="button"
              className={`anchor-node ${anchors.top ? 'linked' : ''} ${activeSide === 'top' ? 'active' : ''}`}
              title={anchors.top ? `Top anchored: ${anchors.top.margin === 'auto' ? 'Auto' : anchors.top.margin + 'mm'}` : 'Click to edit Top anchor'}
              disabled={disabled}
              onClick={() => setActiveSide('top')}
            >
              {anchors.top ? <span className="anchor-dot"/> : <span className="anchor-plus">+</span>}
            </button>
            <span
              className={`blueprint-margin-badge ${activeSide === 'top' ? 'active' : ''}`}
              onClick={() => setActiveSide('top')}
            >
              {anchors.top ? (anchors.top.margin === 'auto' ? 'auto' : `${anchors.top.margin}`) : '—'}
            </span>
          </div>

          {/* Middle Row: Left - Center Box - Right */}
          <div className="blueprint-middle">
            {/* Left Node & Margin */}
            <div className="blueprint-left">
              <span
                className={`blueprint-margin-badge ${activeSide === 'left' ? 'active' : ''}`}
                onClick={() => setActiveSide('left')}
              >
                {anchors.left ? (anchors.left.margin === 'auto' ? 'auto' : `${anchors.left.margin}`) : '—'}
              </span>
              <button
                type="button"
                className={`anchor-node ${anchors.left ? 'linked' : ''} ${activeSide === 'left' ? 'active' : ''}`}
                title={anchors.left ? `Left anchored: ${anchors.left.margin === 'auto' ? 'Auto' : anchors.left.margin + 'mm'}` : 'Click to edit Left anchor'}
                disabled={disabled}
                onClick={() => setActiveSide('left')}
              >
                {anchors.left ? <span className="anchor-dot"/> : <span className="anchor-plus">+</span>}
              </button>
            </div>

            {/* Center Object Box */}
            <div className="blueprint-center-box">
              <span className="blueprint-item-name">{item.name || item.kind}</span>
              <span className="blueprint-item-size">{Number(item.width.toFixed(1))}×{Number(item.height.toFixed(1))}</span>
            </div>

            {/* Right Node & Margin */}
            <div className="blueprint-right">
              <button
                type="button"
                className={`anchor-node ${anchors.right ? 'linked' : ''} ${activeSide === 'right' ? 'active' : ''}`}
                title={anchors.right ? `Right anchored: ${anchors.right.margin === 'auto' ? 'Auto' : anchors.right.margin + 'mm'}` : 'Click to edit Right anchor'}
                disabled={disabled}
                onClick={() => setActiveSide('right')}
              >
                {anchors.right ? <span className="anchor-dot"/> : <span className="anchor-plus">+</span>}
              </button>
              <span
                className={`blueprint-margin-badge ${activeSide === 'right' ? 'active' : ''}`}
                onClick={() => setActiveSide('right')}
              >
                {anchors.right ? (anchors.right.margin === 'auto' ? 'auto' : `${anchors.right.margin}`) : '—'}
              </span>
            </div>
          </div>

          {/* Bottom Node & Margin */}
          <div className="blueprint-bottom">
            <span
              className={`blueprint-margin-badge ${activeSide === 'bottom' ? 'active' : ''}`}
              onClick={() => setActiveSide('bottom')}
            >
              {anchors.bottom ? (anchors.bottom.margin === 'auto' ? 'auto' : `${anchors.bottom.margin}`) : '—'}
            </span>
            <button
              type="button"
              className={`anchor-node ${anchors.bottom ? 'linked' : ''} ${activeSide === 'bottom' ? 'active' : ''}`}
              title={anchors.bottom ? `Bottom anchored: ${anchors.bottom.margin === 'auto' ? 'Auto' : anchors.bottom.margin + 'mm'}` : 'Click to edit Bottom anchor'}
              disabled={disabled}
              onClick={() => setActiveSide('bottom')}
            >
              {anchors.bottom ? <span className="anchor-dot"/> : <span className="anchor-plus">+</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Side Selector Tabs */}
      <div className="quick-btn-group anchor-side-tabs" aria-label="Anchor sides">
        {SIDES.map(side => {
          const isLinked = Boolean(anchors[side]);
          return (
            <button
              key={side}
              type="button"
              className={`${activeSide === side ? 'chosen' : ''}`}
              disabled={disabled}
              onClick={() => setActiveSide(side)}
            >
              {side.charAt(0).toUpperCase() + side.slice(1)}
              {isLinked && <span className="anchor-tab-dot"/>}
            </button>
          );
        })}
      </div>

      {/* Active Side Configuration Panel */}
      <div className="anchor-side-config">
        <div className="anchor-field-row">
          <label>
            <span>Target</span>
            <div className="font-family-select anchor-target-select">
              <select
                value={currentConstraint ? currentConstraint.target : 'none'}
                disabled={disabled}
                onChange={e => handleTargetChange(activeSide, e.target.value)}
              >
                <option value="none">None (Free)</option>
                <option value="parent">Label (Parent)</option>
                {otherObjects.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name || o.kind} ({o.kind})
                  </option>
                ))}
              </select>
            </div>
          </label>

          {currentConstraint && (
            <button
              type="button"
              className="unlink-btn"
              title="Remove this anchor"
              disabled={disabled}
              onClick={() => updateAnchor(activeSide, null)}
            >
              <Unlink size={13}/>
            </button>
          )}
        </div>

        {currentConstraint && (
          <>
            {/* Target Edge Selection */}
            <div className="anchor-field-row">
              <label>
                <span>Snap to</span>
                <div className="quick-btn-group" aria-label="Target edge">
                  {(activeSide === 'top' || activeSide === 'bottom' ? ['top', 'bottom'] as const : ['left', 'right'] as const).map(edge => (
                    <button
                      key={edge}
                      type="button"
                      className={currentConstraint.targetEdge === edge ? 'chosen' : ''}
                      disabled={disabled}
                      onClick={() => handleEdgeChange(activeSide, edge)}
                    >
                      {edge.charAt(0).toUpperCase() + edge.slice(1)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {/* Padding / Margin Control */}
            <div className="anchor-margin-control">
              <div className="anchor-margin-header">
                <small>Margin (mm)</small>
                <button
                  type="button"
                  className={`auto-toggle-btn ${currentConstraint.margin === 'auto' ? 'chosen' : ''}`}
                  disabled={disabled}
                  onClick={() => handleMarginChange(activeSide, currentConstraint.margin === 'auto' ? 0 : 'auto')}
                >
                  Auto
                </button>
              </div>

              {currentConstraint.margin !== 'auto' ? (
                <div className="margin-input-row">
                  <div className="quick-btn-group margin-presets" aria-label="Margin presets">
                    {[0, 2, 4, 8].map(val => (
                      <button
                        key={val}
                        type="button"
                        className={currentConstraint.margin === val ? 'chosen' : ''}
                        disabled={disabled}
                        onClick={() => handleMarginChange(activeSide, val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="margin-input-wrap">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentConstraint.margin}
                      disabled={disabled}
                      onChange={e => handleMarginChange(activeSide, Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="unit-label">mm</span>
                  </div>
                </div>
              ) : (
                <div className="auto-margin-badge">
                  <span>Centering / Auto distribution active</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
