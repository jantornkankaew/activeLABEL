import test from 'node:test';import assert from 'node:assert/strict';
import {integerPercent} from '../src/canvasGeometry';
test('mouse barcode magnification rounds to whole percentages within fractional bounds',()=>{assert.equal(integerPercent(100.49,80,200),100);assert.equal(integerPercent(100.51,80,200),101);assert.equal(integerPercent(205,80,103.8),103);assert.equal(integerPercent(70,80,200),80);assert.equal(integerPercent(102.626,80,200),103);assert.equal(integerPercent(99.8,100.1,100.8),null);assert.equal(integerPercent(199.9,80,200),200);});
