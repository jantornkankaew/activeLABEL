import type {LabelDocument, LabelObject} from './core';

export type AnchorSide = 'top' | 'bottom' | 'left' | 'right';
export type AnchorTarget = 'parent' | string;

export interface AnchorConstraint {
  target: AnchorTarget;
  targetEdge: AnchorSide;
  margin: number | 'auto';
}

export interface ObjectAnchors {
  top?: AnchorConstraint;
  bottom?: AnchorConstraint;
  left?: AnchorConstraint;
  right?: AnchorConstraint;
  horizontalBias?: number;
  verticalBias?: number;
}

export function validateAnchors(anchors: unknown, docObjects: LabelObject[], selfId: string): void {
  if (anchors === undefined || anchors === null) return;
  if (typeof anchors !== 'object' || Array.isArray(anchors)) {
    throw Error('Anchors must be an object');
  }
  const obj = anchors as Record<string, unknown>;
  const validSides: AnchorSide[] = ['top', 'bottom', 'left', 'right'];
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'horizontalBias' || key === 'verticalBias') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
        throw Error(`${key} must be a number between 0 and 1`);
      }
      continue;
    }
    if (!validSides.includes(key as AnchorSide)) {
      throw Error(`Invalid anchor side: ${key}`);
    }
    if (value === undefined || value === null) continue;
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw Error(`Anchor ${key} must be an object`);
    }
    const c = value as Record<string, unknown>;
    if (typeof c.target !== 'string' || !c.target) {
      throw Error(`Anchor ${key} must have a valid target string`);
    }
    if (c.target === selfId) {
      throw Error('An object cannot anchor to itself');
    }
    if (c.target !== 'parent' && !docObjects.some(o => o.id === c.target)) {
      throw Error(`Anchor target ${c.target} not found`);
    }
    if (typeof c.targetEdge !== 'string' || !validSides.includes(c.targetEdge as AnchorSide)) {
      throw Error(`Anchor ${key} must have a valid targetEdge`);
    }
    if (c.margin !== 'auto' && (typeof c.margin !== 'number' || !Number.isFinite(c.margin))) {
      throw Error(`Anchor ${key} margin must be a number or 'auto'`);
    }
  }
}

export function computeAnchoredPosition(item: LabelObject, doc: Pick<LabelDocument, 'width' | 'height' | 'objects'>): { x: number; y: number } {
  if (!item.anchors || Object.keys(item.anchors).length === 0) {
    return { x: item.x, y: item.y };
  }

  const w = item.width;
  const h = item.height;
  let newX = item.x;
  let newY = item.y;

  const aL = item.anchors.left;
  const aR = item.anchors.right;
  const aT = item.anchors.top;
  const aB = item.anchors.bottom;
  const hBias = item.anchors.horizontalBias ?? 0.5;
  const vBias = item.anchors.verticalBias ?? 0.5;

  // Resolve Horizontal (X)
  let targetXL: number | null = null;
  if (aL) {
    if (aL.target === 'parent') {
      targetXL = aL.targetEdge === 'right' ? doc.width : 0;
    } else {
      const tObj = doc.objects.find(o => o.id === aL.target);
      if (tObj) {
        targetXL = aL.targetEdge === 'left' ? tObj.x : aL.targetEdge === 'right' ? tObj.x + tObj.width : tObj.x;
      }
    }
  }

  let targetXR: number | null = null;
  if (aR) {
    if (aR.target === 'parent') {
      targetXR = aR.targetEdge === 'left' ? 0 : doc.width;
    } else {
      const tObj = doc.objects.find(o => o.id === aR.target);
      if (tObj) {
        targetXR = aR.targetEdge === 'right' ? tObj.x + tObj.width : aR.targetEdge === 'left' ? tObj.x : tObj.x + tObj.width;
      }
    }
  }

  if (targetXL !== null && targetXR !== null) {
    if (aL!.margin === 'auto' && aR!.margin === 'auto') {
      newX = targetXL + (targetXR - targetXL - w) * hBias;
    } else if (typeof aL!.margin === 'number' && typeof aR!.margin === 'number') {
      const available = (targetXR - targetXL) - aL!.margin - aR!.margin;
      newX = targetXL + aL!.margin + (available - w) * hBias;
    } else if (typeof aL!.margin === 'number') {
      newX = targetXL + aL!.margin;
    } else if (typeof aR!.margin === 'number') {
      newX = targetXR - w - aR!.margin;
    } else {
      newX = targetXL + (targetXR - targetXL - w) * hBias;
    }
  } else if (targetXL !== null) {
    const m = aL!.margin === 'auto' ? 0 : aL!.margin;
    newX = targetXL + m;
  } else if (targetXR !== null) {
    const m = aR!.margin === 'auto' ? 0 : aR!.margin;
    newX = targetXR - w - m;
  }

  // Resolve Vertical (Y)
  let targetYT: number | null = null;
  if (aT) {
    if (aT.target === 'parent') {
      targetYT = aT.targetEdge === 'bottom' ? doc.height : 0;
    } else {
      const tObj = doc.objects.find(o => o.id === aT.target);
      if (tObj) {
        targetYT = aT.targetEdge === 'top' ? tObj.y : aT.targetEdge === 'bottom' ? tObj.y + tObj.height : tObj.y;
      }
    }
  }

  let targetYB: number | null = null;
  if (aB) {
    if (aB.target === 'parent') {
      targetYB = aB.targetEdge === 'top' ? 0 : doc.height;
    } else {
      const tObj = doc.objects.find(o => o.id === aB.target);
      if (tObj) {
        targetYB = aB.targetEdge === 'bottom' ? tObj.y + tObj.height : aB.targetEdge === 'top' ? tObj.y : tObj.y + tObj.height;
      }
    }
  }

  if (targetYT !== null && targetYB !== null) {
    if (aT!.margin === 'auto' && aB!.margin === 'auto') {
      newY = targetYT + (targetYB - targetYT - h) * vBias;
    } else if (typeof aT!.margin === 'number' && typeof aB!.margin === 'number') {
      const available = (targetYB - targetYT) - aT!.margin - aB!.margin;
      newY = targetYT + aT!.margin + (available - h) * vBias;
    } else if (typeof aT!.margin === 'number') {
      newY = targetYT + aT!.margin;
    } else if (typeof aB!.margin === 'number') {
      newY = targetYB - h - aB!.margin;
    } else {
      newY = targetYT + (targetYB - targetYT - h) * vBias;
    }
  } else if (targetYT !== null) {
    const m = aT!.margin === 'auto' ? 0 : aT!.margin;
    newY = targetYT + m;
  } else if (targetYB !== null) {
    const m = aB!.margin === 'auto' ? 0 : aB!.margin;
    newY = targetYB - h - m;
  }

  const clampedX = Math.max(0, Math.min(doc.width - w, newX));
  const clampedY = Math.max(0, Math.min(doc.height - h, newY));

  return {
    x: Number(clampedX.toFixed(3)),
    y: Number(clampedY.toFixed(3))
  };
}

export function solveAnchors(doc: LabelDocument): LabelDocument {
  const hasAny = doc.objects.some(o => o.anchors && Object.keys(o.anchors).length > 0);
  if (!hasAny) return doc;

  // Clean dangling targets if any
  const ids = new Set(doc.objects.map(o => o.id));
  for (const o of doc.objects) {
    if (!o.anchors) continue;
    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      const a = o.anchors[side];
      if (a && a.target !== 'parent' && !ids.has(a.target)) {
        delete o.anchors[side];
      }
    }
    if (Object.keys(o.anchors).length === 0) {
      delete o.anchors;
    }
  }

  // Iterate up to 10 passes to propagate through dependency chains
  let changed = true;
  let passes = 0;
  while (changed && passes < 10) {
    changed = false;
    passes++;
    for (const o of doc.objects) {
      if (!o.anchors || Object.keys(o.anchors).length === 0) continue;
      const { x, y } = computeAnchoredPosition(o, doc);
      if (Math.abs(o.x - x) > 0.001 || Math.abs(o.y - y) > 0.001) {
        o.x = x;
        o.y = y;
        changed = true;
      }
    }
  }

  return doc;
}

export function updateAnchorsOnMove(item: LabelObject, newX: number, newY: number, doc: LabelDocument): ObjectAnchors | undefined {
  if (!item.anchors || Object.keys(item.anchors).length === 0) return undefined;
  const next: ObjectAnchors = structuredClone(item.anchors);
  const w = item.width;
  const h = item.height;

  if (next.left) {
    let tX = 0;
    if (next.left.target === 'parent') {
      tX = next.left.targetEdge === 'right' ? doc.width : 0;
    } else {
      const t = doc.objects.find(o => o.id === next.left!.target);
      if (t) tX = next.left.targetEdge === 'right' ? t.x + t.width : t.x;
    }
    if (typeof next.left.margin === 'number') {
      next.left.margin = Number(Math.max(0, newX - tX).toFixed(2));
    }
  }

  if (next.right) {
    let tX = doc.width;
    if (next.right.target === 'parent') {
      tX = next.right.targetEdge === 'left' ? 0 : doc.width;
    } else {
      const t = doc.objects.find(o => o.id === next.right!.target);
      if (t) tX = next.right.targetEdge === 'left' ? t.x : t.x + t.width;
    }
    if (typeof next.right.margin === 'number') {
      next.right.margin = Number(Math.max(0, tX - (newX + w)).toFixed(2));
    }
  }

  if (next.top) {
    let tY = 0;
    if (next.top.target === 'parent') {
      tY = next.top.targetEdge === 'bottom' ? doc.height : 0;
    } else {
      const t = doc.objects.find(o => o.id === next.top!.target);
      if (t) tY = next.top.targetEdge === 'bottom' ? t.y + t.height : t.y;
    }
    if (typeof next.top.margin === 'number') {
      next.top.margin = Number(Math.max(0, newY - tY).toFixed(2));
    }
  }

  if (next.bottom) {
    let tY = doc.height;
    if (next.bottom.target === 'parent') {
      tY = next.bottom.targetEdge === 'top' ? 0 : doc.height;
    } else {
      const t = doc.objects.find(o => o.id === next.bottom!.target);
      if (t) tY = next.bottom.targetEdge === 'top' ? t.y : t.y + t.height;
    }
    if (typeof next.bottom.margin === 'number') {
      next.bottom.margin = Number(Math.max(0, tY - (newY + h)).toFixed(2));
    }
  }

  return next;
}

export function calculateCurrentMargin(side: AnchorSide, target: AnchorTarget, targetEdge: AnchorSide, item: LabelObject, doc: Pick<LabelDocument, 'width' | 'height' | 'objects'>): number {
  if (target === 'parent') {
    if (side === 'left') {
      return Number(Math.max(0, targetEdge === 'right' ? item.x - doc.width : item.x).toFixed(1));
    }
    if (side === 'right') {
      return Number(Math.max(0, targetEdge === 'left' ? -(item.x + item.width) : doc.width - (item.x + item.width)).toFixed(1));
    }
    if (side === 'top') {
      return Number(Math.max(0, targetEdge === 'bottom' ? item.y - doc.height : item.y).toFixed(1));
    }
    if (side === 'bottom') {
      return Number(Math.max(0, targetEdge === 'top' ? -(item.y + item.height) : doc.height - (item.y + item.height)).toFixed(1));
    }
  } else {
    const tObj = doc.objects.find(o => o.id === target);
    if (!tObj) return 0;
    if (side === 'left') {
      const tx = targetEdge === 'right' ? tObj.x + tObj.width : tObj.x;
      return Number(Math.max(0, item.x - tx).toFixed(1));
    }
    if (side === 'right') {
      const tx = targetEdge === 'left' ? tObj.x : tObj.x + tObj.width;
      return Number(Math.max(0, tx - (item.x + item.width)).toFixed(1));
    }
    if (side === 'top') {
      const ty = targetEdge === 'bottom' ? tObj.y + tObj.height : tObj.y;
      return Number(Math.max(0, item.y - ty).toFixed(1));
    }
    if (side === 'bottom') {
      const ty = targetEdge === 'top' ? tObj.y : tObj.y + tObj.height;
      return Number(Math.max(0, ty - (item.y + item.height)).toFixed(1));
    }
  }
  return 0;
}

export function getAnchorPoint(item: LabelObject, side: AnchorSide): { x: number; y: number } {
  switch (side) {
    case 'top': return { x: item.x + item.width / 2, y: item.y };
    case 'bottom': return { x: item.x + item.width / 2, y: item.y + item.height };
    case 'left': return { x: item.x, y: item.y + item.height / 2 };
    case 'right': return { x: item.x + item.width, y: item.y + item.height / 2 };
  }
}

export interface CandidateTarget {
  targetId: string | 'parent';
  targetEdge: AnchorSide;
  targetName: string;
  snapX: number;
  snapY: number;
}

export function findCandidateAnchorTarget(
  sourceSide: AnchorSide,
  docX: number,
  docY: number,
  sourceItem: LabelObject,
  doc: Pick<LabelDocument, 'width' | 'height' | 'objects'>
): CandidateTarget {
  const otherObjects = doc.objects.filter(o => o.id !== sourceItem.id);

  interface ScoredCandidate {
    candidate: CandidateTarget;
    dist: number;
  }

  const candidates: ScoredCandidate[] = [];

  // 1. Evaluate receptive handles on other objects
  for (const o of otherObjects) {
    if (sourceSide === 'top' || sourceSide === 'bottom') {
      const hx = o.x + o.width / 2;
      const topDist = Math.hypot(docX - hx, docY - o.y);
      const bottomDist = Math.hypot(docX - hx, docY - (o.y + o.height));
      const inside = docX >= o.x - 2 && docX <= o.x + o.width + 2 && docY >= o.y - 2 && docY <= o.y + o.height + 2;
      const bonus = inside ? 0.6 : 1.0;

      candidates.push({
        candidate: {
          targetId: o.id,
          targetEdge: 'top',
          targetName: o.name || o.kind,
          snapX: hx,
          snapY: o.y
        },
        dist: topDist * bonus
      });

      candidates.push({
        candidate: {
          targetId: o.id,
          targetEdge: 'bottom',
          targetName: o.name || o.kind,
          snapX: hx,
          snapY: o.y + o.height
        },
        dist: bottomDist * bonus
      });
    } else {
      const hy = o.y + o.height / 2;
      const leftDist = Math.hypot(docX - o.x, docY - hy);
      const rightDist = Math.hypot(docX - (o.x + o.width), docY - hy);
      const inside = docX >= o.x - 2 && docX <= o.x + o.width + 2 && docY >= o.y - 2 && docY <= o.y + o.height + 2;
      const bonus = inside ? 0.6 : 1.0;

      candidates.push({
        candidate: {
          targetId: o.id,
          targetEdge: 'left',
          targetName: o.name || o.kind,
          snapX: o.x,
          snapY: hy
        },
        dist: leftDist * bonus
      });

      candidates.push({
        candidate: {
          targetId: o.id,
          targetEdge: 'right',
          targetName: o.name || o.kind,
          snapX: o.x + o.width,
          snapY: hy
        },
        dist: rightDist * bonus
      });
    }
  }

  // 2. Parent boundary edge candidates
  if (sourceSide === 'top' || sourceSide === 'bottom') {
    const defaultParentEdge: AnchorSide = sourceSide === 'top' ? 'top' : 'bottom';
    const altParentEdge: AnchorSide = sourceSide === 'top' ? 'bottom' : 'top';
    const defaultY = defaultParentEdge === 'top' ? 0 : doc.height;
    const altY = altParentEdge === 'top' ? 0 : doc.height;
    const dDefault = Math.abs(docY - defaultY);
    const dAlt = Math.abs(docY - altY);

    candidates.push({
      candidate: {
        targetId: 'parent',
        targetEdge: defaultParentEdge,
        targetName: `Label (${defaultParentEdge})`,
        snapX: sourceItem.x + sourceItem.width / 2,
        snapY: defaultY
      },
      dist: dDefault
    });

    if (dAlt < 6) {
      candidates.push({
        candidate: {
          targetId: 'parent',
          targetEdge: altParentEdge,
          targetName: `Label (${altParentEdge})`,
          snapX: sourceItem.x + sourceItem.width / 2,
          snapY: altY
        },
        dist: dAlt
      });
    }
  } else {
    const defaultParentEdge: AnchorSide = sourceSide === 'left' ? 'left' : 'right';
    const altParentEdge: AnchorSide = sourceSide === 'left' ? 'right' : 'left';
    const defaultX = defaultParentEdge === 'left' ? 0 : doc.width;
    const altX = altParentEdge === 'left' ? 0 : doc.width;
    const dDefault = Math.abs(docX - defaultX);
    const dAlt = Math.abs(docX - altX);

    candidates.push({
      candidate: {
        targetId: 'parent',
        targetEdge: defaultParentEdge,
        targetName: `Label (${defaultParentEdge})`,
        snapX: defaultX,
        snapY: sourceItem.y + sourceItem.height / 2
      },
      dist: dDefault
    });

    if (dAlt < 6) {
      candidates.push({
        candidate: {
          targetId: 'parent',
          targetEdge: altParentEdge,
          targetName: `Label (${altParentEdge})`,
          snapX: altX,
          snapY: sourceItem.y + sourceItem.height / 2
        },
        dist: dAlt
      });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  return candidates[0].candidate;
}

