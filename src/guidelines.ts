import {textMetrics} from './typography';
import type {LabelObject} from './core';

export type AlignmentGuideline = {
  orientation: 'horizontal' | 'vertical';
  position: number;
};

export function getObjectBottom(o: LabelObject): number {
  if (o.kind === 'text') {
    const metrics = textMetrics(o.content, o.fontSize, o.fontName ?? 'Noto Sans', Boolean(o.bold));
    return o.y + metrics.baseline;
  }
  return o.y + o.height;
}

export function getObjectEdges(o: LabelObject) {
  return {
    left: o.x,
    right: o.x + o.width,
    top: o.y,
    bottom: getObjectBottom(o),
  };
}

export function getActiveGuidelines(
  item: LabelObject,
  otherObjects: LabelObject[],
  eps = 0.05
): AlignmentGuideline[] {
  const itemEdges = getObjectEdges(item);
  const guidelines: AlignmentGuideline[] = [];

  for (const other of otherObjects) {
    const oEdges = getObjectEdges(other);
    for (const targetY of [oEdges.top, oEdges.bottom]) {
      if (Math.abs(itemEdges.top - targetY) < eps || Math.abs(itemEdges.bottom - targetY) < eps) {
        if (!guidelines.some(g => g.orientation === 'horizontal' && Math.abs(g.position - targetY) < eps)) {
          guidelines.push({ orientation: 'horizontal', position: Number(targetY.toFixed(3)) });
        }
      }
    }
    for (const targetX of [oEdges.left, oEdges.right]) {
      if (Math.abs(itemEdges.left - targetX) < eps || Math.abs(itemEdges.right - targetX) < eps) {
        if (!guidelines.some(g => g.orientation === 'vertical' && Math.abs(g.position - targetX) < eps)) {
          guidelines.push({ orientation: 'vertical', position: Number(targetX.toFixed(3)) });
        }
      }
    }
  }

  return guidelines;
}

export function computeAlignment(
  movingItem: LabelObject,
  otherObjects: LabelObject[],
  rawX: number,
  rawY: number,
  threshold = 0.6
): {
  snappedX: number;
  snappedY: number;
  guidelines: AlignmentGuideline[];
} {
  if (!otherObjects.length) {
    return { snappedX: rawX, snappedY: rawY, guidelines: [] };
  }

  const movingBottomOffset = movingItem.kind === 'text'
    ? textMetrics(movingItem.content, movingItem.fontSize, movingItem.fontName ?? 'Noto Sans', Boolean(movingItem.bold)).baseline
    : movingItem.height;

  let bestYDiff = Infinity;
  let snappedY = rawY;

  for (const other of otherObjects) {
    const edges = getObjectEdges(other);
    const targetYs = [edges.top, edges.bottom];

    for (const targetY of targetYs) {
      // Align moving top with target
      const diffTop = targetY - rawY;
      if (Math.abs(diffTop) <= threshold && Math.abs(diffTop) < Math.abs(bestYDiff)) {
        bestYDiff = diffTop;
        snappedY = targetY;
      }

      // Align moving bottom with target
      const candYBottom = targetY - movingBottomOffset;
      const diffBottom = candYBottom - rawY;
      if (Math.abs(diffBottom) <= threshold && Math.abs(diffBottom) < Math.abs(bestYDiff)) {
        bestYDiff = diffBottom;
        snappedY = candYBottom;
      }
    }
  }

  let bestXDiff = Infinity;
  let snappedX = rawX;

  for (const other of otherObjects) {
    const edges = getObjectEdges(other);
    const targetXs = [edges.left, edges.right];

    for (const targetX of targetXs) {
      // Align moving left with target
      const diffLeft = targetX - rawX;
      if (Math.abs(diffLeft) <= threshold && Math.abs(diffLeft) < Math.abs(bestXDiff)) {
        bestXDiff = diffLeft;
        snappedX = targetX;
      }

      // Align moving right with target
      const candXRight = targetX - movingItem.width;
      const diffRight = candXRight - rawX;
      if (Math.abs(diffRight) <= threshold && Math.abs(diffRight) < Math.abs(bestXDiff)) {
        bestXDiff = diffRight;
        snappedX = candXRight;
      }
    }
  }

  const simulatedItem = {
    ...movingItem,
    x: snappedX,
    y: snappedY,
  };

  const guidelines = getActiveGuidelines(simulatedItem, otherObjects);

  return { snappedX, snappedY, guidelines };
}
