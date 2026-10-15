import test from 'node:test';
import assert from 'node:assert/strict';
import {seed, apply, validate, object} from '../src/core';
import {computeAnchoredPosition, solveAnchors, validateAnchors} from '../src/anchors';

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
