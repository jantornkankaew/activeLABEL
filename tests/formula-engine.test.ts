import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDate,
  evaluateFormula,
  evaluateAllFormulas,
  resolveVariableValuesWithFormulas,
  type LabelFormula,
  type FormulaBlock,
} from '../src/formulaEngine';

test('formatDate correctly formats dates', () => {
  const d = new Date(2026, 9, 15, 14, 30, 45); // 2026-10-15 14:30:45
  assert.equal(formatDate(d, 'YYYY-MM-DD'), '2026-10-15');
  assert.equal(formatDate(d, 'DD/MM/YYYY'), '15/10/2026');
  assert.equal(formatDate(d, 'YYMMDD'), '261015');
  assert.equal(formatDate(d, 'YYYY-MM-DD HH:mm:ss'), '2026-10-15 14:30:45');
});

test('evaluates DateTime functions (now, add_days, add_months)', () => {
  const baseTime = new Date(2026, 0, 1); // 2026-01-01
  const formulaDays: LabelFormula = {
    id: 'f_exp',
    name: 'Expiry Date',
    blocks: [
      {
        id: 'b1',
        category: 'datetime',
        functionName: 'add_days',
        params: {days: 30, format: 'YYYY-MM-DD'},
      },
    ],
  };
  const resDays = evaluateFormula(formulaDays, {}, baseTime);
  assert.equal(resDays, '2026-01-31');

  const formulaMonths: LabelFormula = {
    id: 'f_m',
    name: 'Add Months',
    blocks: [
      {
        id: 'b1',
        category: 'datetime',
        functionName: 'add_months',
        params: {months: 2, format: 'YYYY-MM-DD'},
      },
    ],
  };
  assert.equal(evaluateFormula(formulaMonths, {}, baseTime), '2026-03-01');
});

test('evaluates String functions (concat, pad_start, uppercase, substring, replace)', () => {
  const formula: LabelFormula = {
    id: 'f_sku',
    name: 'Format SKU',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'concat',
        params: {source: 'item', append: '_01', prefix: 'SKU-'},
      },
      {
        id: 'b2',
        category: 'string',
        functionName: 'uppercase',
        params: {},
      },
    ],
  };
  assert.equal(evaluateFormula(formula, {}), 'SKU-ITEM_01');

  const padFormula: LabelFormula = {
    id: 'f_pad',
    name: 'Pad Counter',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'pad_start',
        params: {source: '42', length: 6, char: '0'},
      },
    ],
  };
  assert.equal(evaluateFormula(padFormula, {}), '000042');

  const subFormula: LabelFormula = {
    id: 'f_sub',
    name: 'Substring',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'substring',
        params: {source: 'ABCDEFGH', start: 2, length: 3},
      },
    ],
  };
  assert.equal(evaluateFormula(subFormula, {}), 'CDE');

  const varFormula: LabelFormula = {
    id: 'f_var',
    name: 'Variable block',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'variable',
        params: {variableName: 'sku_code'},
      },
      {
        id: 'b2',
        category: 'string',
        functionName: 'concat',
        params: {prefix: 'ITEM-', append: '-TH'},
      },
    ],
  };
  assert.equal(evaluateFormula(varFormula, {sku_code: '9988'}), 'ITEM-9988-TH');
});

test('evaluates Numeric functions (counter, math_op, round)', () => {
  const formula: LabelFormula = {
    id: 'f_calc',
    name: 'Calc',
    blocks: [
      {
        id: 'b1',
        category: 'numeric',
        functionName: 'counter',
        params: {start: 5, padZeros: 4},
      },
      {
        id: 'b2',
        category: 'numeric',
        functionName: 'math_op',
        params: {op: 'add', value: 15},
      },
    ],
  };
  assert.equal(evaluateFormula(formula, {}), '20');

  const roundFormula: LabelFormula = {
    id: 'f_round',
    name: 'Round',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'concat',
        params: {source: '123.4567'},
      },
      {
        id: 'b2',
        category: 'numeric',
        functionName: 'round',
        params: {decimals: 2},
      },
    ],
  };
  assert.equal(evaluateFormula(roundFormula, {}), '123.46');
});

test('evaluates Condition IF/ELSE and Loop repeat', () => {
  const ifFormula: LabelFormula = {
    id: 'f_status',
    name: 'Status check',
    blocks: [
      {
        id: 'b1',
        category: 'if',
        functionName: 'if_else',
        params: {
          source: '{{qty}}',
          operator: 'greater_than',
          target: '0',
          thenValue: 'IN_STOCK',
          elseValue: 'OUT_OF_STOCK',
        },
      },
    ],
  };
  assert.equal(evaluateFormula(ifFormula, {qty: '10'}), 'IN_STOCK');
  assert.equal(evaluateFormula(ifFormula, {qty: '0'}), 'OUT_OF_STOCK');

  const repeatFormula: LabelFormula = {
    id: 'f_stars',
    name: 'Repeat stars',
    blocks: [
      {
        id: 'b1',
        category: 'loop',
        functionName: 'repeat',
        params: {text: '#', times: 4, separator: '-'},
      },
    ],
  };
  assert.equal(evaluateFormula(repeatFormula, {}), '#-#-#-#');
});

test('variable can use values from multiple formulas', () => {
  const baseTime = new Date(2026, 9, 15);
  const formulas: LabelFormula[] = [
    {
      id: 'date_code',
      name: 'Date Code',
      blocks: [
        {
          id: 'b1',
          category: 'datetime',
          functionName: 'now',
          params: {format: 'YYYYMMDD'},
        },
      ],
    },
    {
      id: 'batch_num',
      name: 'Batch Number',
      blocks: [
        {
          id: 'b1',
          category: 'string',
          functionName: 'pad_start',
          params: {source: '7', length: 4, char: '0'},
        },
      ],
    },
  ];

  const variables = [
    {
      name: 'lot_id',
      label: 'Full Lot ID',
      value: 'LOT-{{formula:date_code}}-{{formula:batch_num}}',
      prompt: false,
    },
  ];

  const resolved = resolveVariableValuesWithFormulas(variables, formulas, {}, baseTime);
  assert.equal(resolved['lot_id'], 'LOT-20261015-0007');
});

test('set_variable, change_variable, and set_value mutate and propagate variable values', () => {
  const formula: LabelFormula = {
    id: 'f_var_ops',
    name: 'Var_Ops',
    blocks: [
      {
        id: 'b1',
        category: 'string',
        functionName: 'set_variable',
        params: {variableName: 'price', mode: 'custom', value: '100'},
      },
      {
        id: 'b2',
        category: 'string',
        functionName: 'change_variable',
        params: {variableName: 'price', delta: 25},
      },
      {
        id: 'b3',
        category: 'string',
        functionName: 'concat',
        params: {prefix: 'THB ', append: '.00'},
      },
      {
        id: 'b4',
        category: 'string',
        functionName: 'set_variable',
        params: {variableName: 'formatted_price', mode: 'current', value: ''},
      },
    ],
  };

  const variables = [
    {name: 'price', label: 'Price', value: '50', prompt: true},
    {name: 'formatted_price', label: 'Formatted', value: '', prompt: false},
  ];

  const resolved = resolveVariableValuesWithFormulas(variables, [formula]);
  assert.equal(resolved['f_var_ops'], 'THB 125.00');
  assert.equal(resolved['price'], '125');
  assert.equal(resolved['formatted_price'], 'THB 125.00');
});

