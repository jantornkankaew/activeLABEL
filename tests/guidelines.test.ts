import test from 'node:test';
import assert from 'node:assert/strict';
import {object, type LabelObject} from '../src/core';
import {textMetrics} from '../src/typography';
import {computeAlignment, getActiveGuidelines, getObjectEdges} from '../src/guidelines';

test('text object bottom edge is character baseline instead of bounding box bottom', () => {
  const textObj = object('text', {
    content: 'ACTIVE 5',
    fontSize: 5,
    x: 10,
    y: 10,
  });
  const metrics = textMetrics(textObj.content, textObj.fontSize, textObj.fontName, textObj.bold);
  const edges = getObjectEdges(textObj);

  assert.equal(edges.left, 10);
  assert.equal(edges.top, 10);
  // Bottom must strictly be character baseline (y + metrics.baseline), NOT y + height
  assert.equal(edges.bottom, 10 + metrics.baseline);
  assert.notEqual(edges.bottom, 10 + textObj.height);
});

test('non-text object bottom edge is y + height', () => {
  const boxObj = object('box', {
    x: 5,
    y: 12,
    width: 25,
    height: 15,
  });
  const edges = getObjectEdges(boxObj);

  assert.equal(edges.left, 5);
  assert.equal(edges.right, 30);
  assert.equal(edges.top, 12);
  assert.equal(edges.bottom, 27);
});

test('moving box snaps bottom to text character baseline and shows horizontal purple guideline', () => {
  const textObj = object('text', {
    id: 'target-text',
    content: 'Title',
    fontSize: 4,
    x: 5,
    y: 10,
  });
  const metrics = textMetrics(textObj.content, textObj.fontSize, textObj.fontName, textObj.bold);
  const textBaselineY = 10 + metrics.baseline;

  const movingBox = object('box', {
    id: 'moving-box',
    x: 25,
    y: 0,
    width: 10,
    height: 8,
  });

  // Position box bottom near text baseline: rawY = textBaselineY - 8 + 0.2
  const rawY = textBaselineY - 8 + 0.2;
  const rawX = 25;
  const result = computeAlignment(movingBox, [textObj], rawX, rawY, 0.5);

  // Box bottom should snap to textBaselineY => box y = textBaselineY - 8
  assert.ok(Math.abs(result.snappedY - (textBaselineY - 8)) < 1e-6);
  assert.ok(result.guidelines.some(g => g.orientation === 'horizontal' && Math.abs(g.position - textBaselineY) < 0.05));
});

test('moving text snaps character baseline to box bottom', () => {
  const boxObj = object('box', {
    id: 'target-box',
    x: 5,
    y: 5,
    width: 20,
    height: 15, // bottom = 20
  });

  const movingText = object('text', {
    id: 'moving-text',
    content: 'Subtitle',
    fontSize: 4,
    x: 30,
    y: 0,
  });
  const metrics = textMetrics(movingText.content, movingText.fontSize, movingText.fontName, movingText.bold);

  // Position text baseline near box bottom 20: rawY = 20 - metrics.baseline - 0.2
  const rawY = 20 - metrics.baseline - 0.2;
  const rawX = 30;
  const result = computeAlignment(movingText, [boxObj], rawX, rawY, 0.5);

  // Text baseline should snap to 20 => y = 20 - metrics.baseline
  const expectedY = 20 - metrics.baseline;
  assert.ok(Math.abs(result.snappedY - expectedY) < 1e-6);
  assert.ok(result.guidelines.some(g => g.orientation === 'horizontal' && Math.abs(g.position - 20) < 0.05));
});

test('snaps left and right edges with vertical guidelines', () => {
  const target = object('box', {
    id: 'target',
    x: 10,
    y: 10,
    width: 20,
    height: 10,
  }); // left = 10, right = 30

  const moving = object('box', {
    id: 'moving',
    x: 0,
    y: 10,
    width: 15,
    height: 10,
  });

  // 1. Left to Left snap
  const res1 = computeAlignment(moving, [target], 10.3, 10, 0.5);
  assert.equal(res1.snappedX, 10);
  assert.ok(res1.guidelines.some(g => g.orientation === 'vertical' && g.position === 10));

  // 2. Right to Right snap: moving right (x + 15) near target right (30) => rawX = 14.8
  const res2 = computeAlignment(moving, [target], 14.8, 10, 0.5);
  assert.equal(res2.snappedX, 15);
  assert.ok(res2.guidelines.some(g => g.orientation === 'vertical' && g.position === 30));

  // 3. Left to Right snap: moving left near target right (30) => rawX = 29.8
  const res3 = computeAlignment(moving, [target], 29.8, 10, 0.5);
  assert.equal(res3.snappedX, 30);
  assert.ok(res3.guidelines.some(g => g.orientation === 'vertical' && g.position === 30));

  // 4. Right to Left snap: moving right near target left (10) => rawX = -5.2 (10 - 15 = -5)
  const res4 = computeAlignment(moving, [target], -4.8, 10, 0.5);
  assert.equal(res4.snappedX, -5);
  assert.ok(res4.guidelines.some(g => g.orientation === 'vertical' && g.position === 10));
});

test('getActiveGuidelines returns active guidelines for aligned objects', () => {
  const box1 = object('box', { id: 'b1', x: 10, y: 15, width: 20, height: 10 });
  const box2 = object('box', { id: 'b2', x: 10, y: 35, width: 20, height: 10 });

  // box1 and box2 share left (10) and right (30)
  const guidelines = getActiveGuidelines(box1, [box2]);
  assert.ok(guidelines.some(g => g.orientation === 'vertical' && g.position === 10));
  assert.ok(guidelines.some(g => g.orientation === 'vertical' && g.position === 30));
  assert.ok(!guidelines.some(g => g.orientation === 'horizontal'));
});

test('guidelines are empty when objects are not aligned', () => {
  const box1 = object('box', { id: 'b1', x: 10, y: 15, width: 20, height: 10 });
  const box2 = object('box', { id: 'b2', x: 55, y: 43, width: 12, height: 8 });

  const guidelines = getActiveGuidelines(box1, [box2]);
  assert.equal(guidelines.length, 0);
});
