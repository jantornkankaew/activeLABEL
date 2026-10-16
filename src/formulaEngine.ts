import type {LabelVariable} from './core';

export type FunctionCategory = 'datetime' | 'string' | 'numeric' | 'if' | 'loop';

export type FormulaBlock = {
  id: string;
  category: FunctionCategory;
  functionName: string;
  params: Record<string, any>;
};

export type LabelFormula = {
  id: string;
  name: string;
  description?: string;
  blocks: FormulaBlock[];
};

export const FUNCTION_CATALOG: {
  category: FunctionCategory;
  categoryLabel: string;
  categoryIcon: string;
  functions: {
    name: string;
    label: string;
    description: string;
    defaultParams: Record<string, any>;
  }[];
}[] = [
  {
    category: 'datetime',
    categoryLabel: 'DateTime Function',
    categoryIcon: '📅',
    functions: [
      {
        name: 'now',
        label: 'Current Date / Time',
        description: 'Returns the current date and time formatted',
        defaultParams: {format: 'YYYY-MM-DD'},
      },
      {
        name: 'add_days',
        label: 'Add / Offset Days',
        description: 'Adds or subtracts days to date (useful for Expiry)',
        defaultParams: {days: 30, format: 'YYYY-MM-DD'},
      },
      {
        name: 'add_months',
        label: 'Add / Offset Months',
        description: 'Adds or subtracts months to date',
        defaultParams: {months: 1, format: 'YYYY-MM-DD'},
      },
      {
        name: 'add_years',
        label: 'Add / Offset Years',
        description: 'Adds or subtracts years to date',
        defaultParams: {years: 1, format: 'YYYY-MM-DD'},
      },
      {
        name: 'date_part',
        label: 'Extract Date Part',
        description: 'Extracts Year, Month, Day, or Day of Year',
        defaultParams: {part: 'YYYY'},
      },
    ],
  },
  {
    category: 'string',
    categoryLabel: 'String Function',
    categoryIcon: '🔤',
    functions: [
      {
        name: 'variable',
        label: 'ดึงค่าตัวแปร (Use Variable)',
        description: 'ดึงค่าตัวแปรจากเอกสารมาใช้ประมวลผล',
        defaultParams: {variableName: ''},
      },
      {
        name: 'set_variable',
        label: 'กำหนดค่าตัวแปร (Set Variable)',
        description: 'กำหนดค่าให้ตัวแปรเป็นค่าที่ระบุหรือผลลัพธ์จากบล็อกก่อนหน้า',
        defaultParams: {variableName: '', mode: 'custom', value: ''},
      },
      {
        name: 'change_variable',
        label: 'เปลี่ยนค่าตัวแปร (Change Variable)',
        description: 'เพิ่มหรือลดค่าตัวแปรตัวเลขตามจำนวนที่ระบุ',
        defaultParams: {variableName: '', delta: 1},
      },
      {
        name: 'set_value',
        label: 'กำหนดค่าตั้งต้น (Set Value)',
        description: 'กำหนดค่าข้อความหรือตัวเลขตั้งต้นให้กับสายสูตร',
        defaultParams: {value: ''},
      },
      {
        name: 'concat',
        label: 'Combine / Append Text',
        description: 'Appends prefix, suffix, or another variable',
        defaultParams: {text: '', append: ''},
      },
      {
        name: 'pad_start',
        label: 'Pad Zeros / Characters (Start)',
        description: 'Pads text with leading characters to fixed length',
        defaultParams: {length: 6, char: '0'},
      },
      {
        name: 'pad_end',
        label: 'Pad Characters (End)',
        description: 'Pads text with trailing characters to fixed length',
        defaultParams: {length: 6, char: ' '},
      },
      {
        name: 'substring',
        label: 'Cut / Substring (Slice)',
        description: 'Extracts a portion of text from start index',
        defaultParams: {start: 0, length: 4},
      },
      {
        name: 'uppercase',
        label: 'Uppercase (A-Z)',
        description: 'Converts text to all capital letters',
        defaultParams: {},
      },
      {
        name: 'lowercase',
        label: 'Lowercase (a-z)',
        description: 'Converts text to all small letters',
        defaultParams: {},
      },
      {
        name: 'replace',
        label: 'Search & Replace',
        description: 'Replaces specific words or characters',
        defaultParams: {search: '', replace: ''},
      },
      {
        name: 'trim',
        label: 'Trim Whitespace',
        description: 'Removes leading and trailing spaces',
        defaultParams: {},
      },
    ],
  },
  {
    category: 'numeric',
    categoryLabel: 'Numeric Function',
    categoryIcon: '🔢',
    functions: [
      {
        name: 'counter',
        label: 'Sequence / Counter',
        description: 'Generates a numbered sequence with padding',
        defaultParams: {start: 1, step: 1, padZeros: 4},
      },
      {
        name: 'math_op',
        label: 'Math Operation (+, -, *, /)',
        description: 'Adds, subtracts, multiplies, or divides numbers',
        defaultParams: {op: 'add', value: 10},
      },
      {
        name: 'round',
        label: 'Round Number / Decimals',
        description: 'Rounds to specified decimal places',
        defaultParams: {decimals: 2},
      },
    ],
  },
  {
    category: 'if',
    categoryLabel: 'Condition (IF)',
    categoryIcon: '🔀',
    functions: [
      {
        name: 'if_else',
        label: 'If / Then / Else',
        description: 'Checks condition: if matches then A, else B',
        defaultParams: {
          operator: 'equals',
          target: '',
          thenValue: 'APPROVED',
          elseValue: 'PENDING',
        },
      },
    ],
  },
  {
    category: 'loop',
    categoryLabel: 'Loop / Repeat',
    categoryIcon: '🔁',
    functions: [
      {
        name: 'repeat',
        label: 'Repeat Pattern',
        description: 'Repeats text or symbol N times',
        defaultParams: {text: '*', times: 5, separator: ''},
      },
    ],
  },
];

export function formatDate(date: Date, pattern: string): string {
  const yyyy = String(date.getFullYear());
  const yy = yyyy.slice(-2);
  const m = date.getMonth() + 1;
  const mm = String(m).padStart(2, '0');
  const d = date.getDate();
  const dd = String(d).padStart(2, '0');
  const h = date.getHours();
  const hh = String(h).padStart(2, '0');
  const min = date.getMinutes();
  const mins = String(min).padStart(2, '0');
  const s = date.getSeconds();
  const ss = String(s).padStart(2, '0');

  return pattern
    .replace(/YYYY/g, yyyy)
    .replace(/YY/g, yy)
    .replace(/MM/g, mm)
    .replace(/DD/g, dd)
    .replace(/HH/g, hh)
    .replace(/mm/g, mins)
    .replace(/ss/g, ss);
}

export function evaluateBlock(
  block: FormulaBlock,
  input: string,
  variables: Record<string, string>,
  now: Date
): string {
  const resolve = (val: any): string => {
    if (typeof val !== 'string') return String(val ?? '');
    return val.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key) => variables[key] ?? '');
  };

  const resolveNum = (val: any, fallback = 0): number => {
    if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
    const str = resolve(val).trim();
    if (!str) return fallback;
    const parsed = Number(str);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  switch (block.category) {
    case 'datetime': {
      let baseDate = new Date(now.getTime());
      if (input && !isNaN(Date.parse(input))) {
        baseDate = new Date(input);
      }
      const fmt = resolve(block.params.format || 'YYYY-MM-DD') || 'YYYY-MM-DD';

      if (block.functionName === 'now') {
        return formatDate(baseDate, fmt);
      }
      if (block.functionName === 'add_days') {
        const d = resolveNum(block.params.days, 0);
        baseDate.setDate(baseDate.getDate() + d);
        return formatDate(baseDate, fmt);
      }
      if (block.functionName === 'add_months') {
        const m = resolveNum(block.params.months, 0);
        baseDate.setMonth(baseDate.getMonth() + m);
        return formatDate(baseDate, fmt);
      }
      if (block.functionName === 'add_years') {
        const y = resolveNum(block.params.years, 0);
        baseDate.setFullYear(baseDate.getFullYear() + y);
        return formatDate(baseDate, fmt);
      }
      if (block.functionName === 'date_part') {
        const part = resolve(block.params.part || 'YYYY') || 'YYYY';
        return formatDate(baseDate, part);
      }
      return formatDate(baseDate, fmt);
    }

    case 'string': {
      let text = input;
      if (block.functionName === 'variable') {
        const varName = block.params.variableName || '';
        return variables[varName] !== undefined ? variables[varName] : (varName ? `[${varName}]` : input);
      }
      if (block.functionName === 'set_variable') {
        const varName = String(block.params.variableName ?? '').trim();
        const mode = block.params.mode || 'custom';
        const nextVal = mode === 'current' ? input : resolve(block.params.value ?? '');
        if (varName) {
          variables[varName] = nextVal;
        }
        return nextVal;
      }
      if (block.functionName === 'change_variable') {
        const varName = String(block.params.variableName ?? '').trim();
        const currentRaw =
          varName && variables[varName] !== undefined ? variables[varName] : input;
        const baseNum = parseFloat(currentRaw) || 0;
        const delta = resolveNum(block.params.delta ?? 1, 0);
        const nextVal = String(baseNum + delta);
        if (varName) {
          variables[varName] = nextVal;
        }
        return nextVal;
      }
      if (block.functionName === 'set_value') {
        return resolve(block.params.value ?? '');
      }
      if (block.params.source) {
        text = resolve(block.params.source);
      }

      if (block.functionName === 'concat') {
        const append = resolve(block.params.append ?? '');
        const prefix = resolve(block.params.prefix ?? '');
        return `${prefix}${text}${append}`;
      }
      if (block.functionName === 'pad_start') {
        const len = resolveNum(block.params.length, 0);
        const char = resolve(block.params.char ?? '0') || '0';
        return text.padStart(len, char);
      }
      if (block.functionName === 'pad_end') {
        const len = resolveNum(block.params.length, 0);
        const char = resolve(block.params.char ?? ' ') || ' ';
        return text.padEnd(len, char);
      }
      if (block.functionName === 'substring') {
        const start = Math.max(0, resolveNum(block.params.start, 0));
        const len = resolveNum(block.params.length, NaN);
        return isNaN(len) || len <= 0 ? text.slice(start) : text.slice(start, start + len);
      }
      if (block.functionName === 'uppercase') {
        return text.toUpperCase();
      }
      if (block.functionName === 'lowercase') {
        return text.toLowerCase();
      }
      if (block.functionName === 'replace') {
        const s = resolve(block.params.search ?? '');
        const r = resolve(block.params.replace ?? '');
        return s ? text.split(s).join(r) : text;
      }
      if (block.functionName === 'trim') {
        return text.trim();
      }
      return text;
    }

    case 'numeric': {
      if (block.functionName === 'change_variable') {
        const varName = String(block.params.variableName ?? '').trim();
        const currentRaw =
          varName && variables[varName] !== undefined ? variables[varName] : input;
        const baseNum = parseFloat(currentRaw) || 0;
        const delta = resolveNum(block.params.delta ?? 1, 0);
        const nextVal = String(baseNum + delta);
        if (varName) {
          variables[varName] = nextVal;
        }
        return nextVal;
      }

      let num = parseFloat(input);
      if (isNaN(num)) num = 0;

      if (block.functionName === 'counter') {
        const start = resolveNum(block.params.start, 1);
        const pad = resolveNum(block.params.padZeros, 0);
        const s = String(start);
        return pad > 0 ? s.padStart(pad, '0') : s;
      }
      if (block.functionName === 'math_op') {
        const operand = resolveNum(block.params.value ?? '0', 0);
        const op = block.params.op || 'add';
        let res = num;
        if (op === 'add') res += operand;
        else if (op === 'sub') res -= operand;
        else if (op === 'mul') res *= operand;
        else if (op === 'div') res = operand !== 0 ? res / operand : res;
        return String(res);
      }
      if (block.functionName === 'round') {
        const dec = Math.max(0, resolveNum(block.params.decimals, 0));
        return num.toFixed(dec);
      }
      return String(num);
    }

    case 'if': {
      let val = input;
      if (block.params.source) {
        val = resolve(block.params.source);
      }
      const target = resolve(block.params.target ?? '');
      const op = block.params.operator || 'equals';
      let condition = false;

      if (op === 'equals') condition = val === target;
      else if (op === 'not_equals') condition = val !== target;
      else if (op === 'contains') condition = val.includes(target);
      else if (op === 'starts_with') condition = val.startsWith(target);
      else if (op === 'ends_with') condition = val.endsWith(target);
      else if (op === 'greater_than') condition = parseFloat(val) > parseFloat(target);
      else if (op === 'less_than') condition = parseFloat(val) < parseFloat(target);
      else if (op === 'is_empty') condition = val.trim() === '';
      else if (op === 'is_not_empty') condition = val.trim() !== '';

      const thenVal = resolve(block.params.thenValue ?? '');
      const elseVal = resolve(block.params.elseValue ?? '');
      return condition ? thenVal : elseVal;
    }

    case 'loop': {
      if (block.functionName === 'repeat') {
        const t = resolve(block.params.text ?? input);
        const times = Math.max(0, Math.min(100, resolveNum(block.params.times, 1)));
        const sep = block.params.separator ?? '';
        return Array.from({length: times}, () => t).join(sep);
      }
      return input;
    }

    default:
      return input;
  }
}

export function evaluateFormula(
  formula: LabelFormula,
  variables: Record<string, string> = {},
  now: Date = new Date()
): string {
  if (!formula || !Array.isArray(formula.blocks) || formula.blocks.length === 0) {
    return '';
  }

  let current = '';
  for (const block of formula.blocks) {
    current = evaluateBlock(block, current, variables, now);
  }
  return current;
}

export function evaluateAllFormulas(
  formulas: LabelFormula[] = [],
  variables: Record<string, string> = {},
  now: Date = new Date()
): Record<string, string> {
  const results: Record<string, string> = {};
  const runtimeVars: Record<string, string> = {...variables};
  for (const f of formulas) {
    const val = evaluateFormula(f, runtimeVars, now);
    results[f.id] = val;
    results[`formula:${f.id}`] = val;
    results[`formula:${f.name}`] = val;
    results[f.name] = val;
    runtimeVars[f.id] = val;
    runtimeVars[`formula:${f.id}`] = val;
    runtimeVars[`formula:${f.name}`] = val;
    runtimeVars[f.name] = val;
  }
  for (const [k, v] of Object.entries(runtimeVars)) {
    variables[k] = v;
    if (!(k in results)) {
      results[k] = v;
    }
  }
  return results;
}

export function resolveVariableValuesWithFormulas(
  variables: LabelVariable[] = [],
  formulas: LabelFormula[] = [],
  overrides: Record<string, string> = {},
  now: Date = new Date()
): Record<string, string> {
  const initialVars: Record<string, string> = {};
  for (const v of variables) {
    initialVars[v.name] = overrides[v.name] ?? v.value ?? '';
  }
  for (const [k, val] of Object.entries(overrides)) {
    initialVars[k] = val;
  }

  const runtimeVars: Record<string, string> = {...initialVars};
  const formulaValues = evaluateAllFormulas(formulas, runtimeVars, now);
  const resolvedVariables: Record<string, string> = {};

  for (const v of variables) {
    const wasMutatedByFormula =
      !(v.name in overrides) &&
      runtimeVars[v.name] !== undefined &&
      runtimeVars[v.name] !== initialVars[v.name];

    const rawValue = wasMutatedByFormula
      ? runtimeVars[v.name]
      : (overrides[v.name] ?? v.value ?? '');

    const interpolated = rawValue.replace(/\{\{\s*([A-Za-z0-9_:]+)\s*\}\}/g, (_, key) => {
      if (key in formulaValues) return formulaValues[key];
      if (key.startsWith('formula:')) {
        const fKey = key.slice(8);
        return formulaValues[fKey] ?? '';
      }
      return resolvedVariables[key] ?? runtimeVars[key] ?? '';
    });
    resolvedVariables[v.name] = interpolated;
  }

  return {
    ...formulaValues,
    ...resolvedVariables,
  };
}
