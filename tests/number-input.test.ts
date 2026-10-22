import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Use the real component with a host input at the React Native boundary.
function renderInput(props: Record<string, unknown>) {
  let inputProps: any;
  const module = { exports: {} as any };
  const source = ts.transpileModule(readFileSync('src/components/number-input.tsx', 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: (name: string) => {
      if (name === 'react') return React;
      if (name === 'react-native') return {
        Platform: { OS: 'web' },
        TextInput: (props: any) => { inputProps = props; return React.createElement('input', { value: props.value, readOnly: true }); },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  renderToStaticMarkup(React.createElement(module.exports.NumberInput, props));
  return inputProps;
}

it('groups every money input while emitting unformatted digits for saving', () => {
  let raw = '';
  let input = renderInput({ value: '1000', onChangeText: (value: string) => { raw = value; } });
  assert.equal(input.value, '1.000');
  input.onChangeText('1.0000');
  assert.equal(raw, '10000');
  input = renderInput({ value: raw });
  assert.equal(input.value, '10.000');
  assert.equal(input.inputMode, 'numeric');
});

it('handles pasted amounts, clearing, zero, and deleting a separator', () => {
  let raw = '';
  const input = renderInput({ value: '1000', onChangeText: (value: string) => { raw = value; } });
  input.onChangeText('Rp 1.250.000');
  assert.equal(raw, '1250000');
  input.onChangeText('');
  assert.equal(raw, '');
  input.onChangeText('1000');
  assert.equal(raw, '000');
  assert.equal(renderInput({ value: '0' }).value, '0');
});

it('groups investment prices without losing fractional precision or trailing zeroes', () => {
  let raw = '';
  const input = renderInput({ keyboardType: 'decimal-pad', value: '1234.00500', onChangeText: (value: string) => { raw = value; } });
  assert.equal(input.value, '1.234,00500');
  input.onChangeText('1.234,005001');
  assert.equal(raw, '1234.005001');
  assert.equal(input.inputMode, 'decimal');
  assert.equal(renderInput({ keyboardType: 'decimal-pad', value: '1000,' }).value, '1.000,');
  assert.equal(renderInput({ keyboardType: 'decimal-pad', value: '0.00000001' }).value, '0,00000001');
});
