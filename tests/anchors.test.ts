import test from 'node:test';
import assert from 'node:assert/strict';
import {seed, apply, validate, object} from '../src/core';
import {computeAnchoredPosition, solveAnchors, validateAnchors, getAnchorPoint, findCandidateAnchorTarget} from '../src/anchors';
import {bezierWirePath} from '../src/renderer';

test('anchoring to parent with fixed margin places object accurately', () => {
  const doc = seed(); // width: 50, height: 30
  const price = doc.objects.find(o => o.id === 'price')!;
  
  // Anchor to parent left with 5mm, top with 8mm
  const next = apply(doc, [{
    op: 'update',
    id: price.id,
    changes: {
      anchors: {
        left: {target: 'parent', targetEdge: 'left', margin: 5},
        top: {target: 'parent', targetEdge: 'top', margin: 8}
      }
    }
  }]);

  const updatedPrice = next.objects.find(o => o.id === 'price')!;
  assert.equal(updatedPrice.x, 5);
  assert.equal(updatedPrice.y, 8);
});

test('auto margin centers object between parent edges', () => {
  const doc = seed(); // 50 x 30
  const item = doc.objects.find(o => o.id === 'brand')!; // width: 27, height: 5

  const next = apply(doc, [{
    op: 'update',
    id: item.id,
    changes: {
      anchors: {
        left: {target: 'parent', targetEdge: 'left', margin: 'auto'},
        right: {target: 'parent', targetEdge: 'right', margin: 'auto'},
        top: {target: 'parent', targetEdge: 'top', margin: 'auto'},
        bottom: {target: 'parent', targetEdge: 'bottom', margin: 'auto'}
      }
    }
  }]);

  const updated = next.objects.find(o => o.id === 'brand')!;
  assert.equal(updated.x, Number(((50 - updated.width) / 2).toFixed(3)));
  assert.equal(updated.y, Number(((30 - updated.height) / 2).toFixed(3)));
});

test('anchoring to another object positions relative to that object', () => {
  const doc = seed();
  const barcode = doc.objects.find(o => o.id === 'barcode')!; // x: 4, y: 19, width: 42, height: 8
  const sku = doc.objects.find(o => o.id === 'sku')!;

  // Anchor sku top to barcode bottom with 2mm margin
  const next = apply(doc, [{
    op: 'update',
    id: sku.id,
    changes: {
      anchors: {
        top: {target: barcode.id, targetEdge: 'bottom', margin: 2},
        left: {target: barcode.id, targetEdge: 'left', margin: 0}
      }
    }
  }]);

  const updatedSku = next.objects.find(o => o.id === 'sku')!;
  assert.equal(updatedSku.x, barcode.x);
  assert.equal(updatedSku.y, Math.min(doc.height - updatedSku.height, barcode.y + barcode.height + 2));
});

test('dependent object moves automatically when anchor target moves', () => {
  const doc = seed();
  const brand = doc.objects.find(o => o.id === 'brand')!;
  const price = doc.objects.find(o => o.id === 'price')!;

  // First anchor price to brand right edge with 3mm margin
  const anchoredDoc = apply(doc, [{
    op: 'update',
    id: price.id,
    changes: {
      anchors: {
        left: {target: brand.id, targetEdge: 'right', margin: 3}
      }
    }
  }]);

  const priceAfterAnchor = anchoredDoc.objects.find(o => o.id === 'price')!;
  assert.equal(priceAfterAnchor.x, brand.x + brand.width + 3);

  // Now move brand by 5mm to the right
  const movedDoc = apply(anchoredDoc, [{
    op: 'update',
    id: brand.id,
    changes: {x: brand.x + 5}
  }]);

  const movedBrand = movedDoc.objects.find(o => o.id === 'brand')!;
  const followedPrice = movedDoc.objects.find(o => o.id === 'price')!;
  assert.equal(followedPrice.x, movedBrand.x + movedBrand.width + 3);
});

test('resizing document adjusts objects anchored to parent edges', () => {
  const doc = seed(); // 50 x 30
  const barcode = doc.objects.find(o => o.id === 'barcode')!;

  // Anchor barcode right to parent right with 4mm margin
  const anchoredDoc = apply(doc, [{
    op: 'update',
    id: barcode.id,
    changes: {
      anchors: {
        right: {target: 'parent', targetEdge: 'right', margin: 4}
      }
    }
  }]);

  const b1 = anchoredDoc.objects.find(o => o.id === 'barcode')!;
  assert.equal(b1.x, Number((50 - b1.width - 4).toFixed(3)));

  // Resize document to 70 x 40
  const resizedDoc = apply(anchoredDoc, [{
    op: 'resize',
    width: 70,
    height: 40
  }]);

  const b2 = resizedDoc.objects.find(o => o.id === 'barcode')!;
  assert.equal(b2.x, Number((70 - b2.width - 4).toFixed(3)));
});

test('validation rejects self-anchoring and invalid targets', () => {
  const doc = seed();
  assert.throws(() => {
    validateAnchors({
      left: {target: 'brand', targetEdge: 'left', margin: 0}
    }, doc.objects, 'brand');
  }, /cannot anchor to itself/);

  assert.throws(() => {
    validateAnchors({
      left: {target: 'non-existent-obj', targetEdge: 'left', margin: 0}
    }, doc.objects, 'brand');
  }, /not found/);

  assert.throws(() => {
    validateAnchors({
      left: {target: 'parent', targetEdge: 'invalid-edge', margin: 0}
    }, doc.objects, 'brand');
  }, /valid targetEdge/);
});

test('getAnchorPoint returns accurate midpoint perimeter coordinates', () => {
  const item = object('box', { id: 'obj1', x: 10, y: 20, width: 30, height: 10 });
  const top = { x: 25, y: 20 };
  const bottom = { x: 25, y: 30 };
  const left = { x: 10, y: 25 };
  const right = { x: 40, y: 25 };

  assert.deepEqual(getAnchorPoint(item, 'top'), top);
  assert.deepEqual(getAnchorPoint(item, 'bottom'), bottom);
  assert.deepEqual(getAnchorPoint(item, 'left'), left);
  assert.deepEqual(getAnchorPoint(item, 'right'), right);
});

test('findCandidateAnchorTarget snaps to closest handle on another object or parent edge', () => {
  const doc = seed(); // 50 x 30
  const brand = doc.objects.find(o => o.id === 'brand')!; // x: 3, y: 3, w: 27, h: 5 -> bottom at 8
  const name = doc.objects.find(o => o.id === 'name')!; // y: 9, h: 4

  // Dragging from name top handle towards brand bottom handle (around y: 8)
  const cand = findCandidateAnchorTarget('top', 16.5, 7.8, name, doc);
  assert.equal(cand.targetId, brand.id);
  assert.equal(cand.targetEdge, 'bottom');
  assert.equal(cand.snapX, brand.x + brand.width / 2);
  assert.equal(cand.snapY, brand.y + brand.height);
  assert.equal(cand.isSnapped, true);

  // Dragging upwards towards parent top boundary
  const candParent = findCandidateAnchorTarget('top', 15, 0.5, brand, doc);
  assert.equal(candParent.targetId, 'parent');
  assert.equal(candParent.targetEdge, 'top');
  assert.equal(candParent.snapY, 0);
  assert.equal(candParent.isSnapped, true);

  // Dragging in free open space far from candidate edges (> 10mm)
  const largeDoc = { ...doc, width: 100, height: 100 };
  const candFar = findCandidateAnchorTarget('top', 50, 50, brand, largeDoc);
  assert.equal(candFar.isSnapped, false);
});

test('bezierWirePath creates smooth cubic bezier curves and arrowheads connecting anchors', () => {
  // Connect sku top to brand bottom
  const wire = bezierWirePath(14, 10, 17.5, 8, 'top', 'bottom');
  assert.match(wire.path, /^M 14 10 C/);
  assert.ok(wire.arrowD);
  assert.match(wire.arrowD, /L 17\.5 8/);
  assert.ok(typeof wire.midX === 'number' && typeof wire.midY === 'number');
});

