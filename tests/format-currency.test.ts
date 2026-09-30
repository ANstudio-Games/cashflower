import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNumberInput,
  parseCurrencyInput,
  parseCurrencyWithBackspace,
} from '../src/utils/format-currency';

describe('format-currency nominal input formatting', () => {
  describe('formatNumberInput', () => {
    it('formats 1000000 to "1.000.000" by default (id locale)', () => {
      assert.equal(formatNumberInput(1000000), '1.000.000');
      assert.equal(formatNumberInput('1000000'), '1.000.000');
    });

    it('formats numbers less than 1000 without separators', () => {
      assert.equal(formatNumberInput(5), '5');
      assert.equal(formatNumberInput('50'), '50');
      assert.equal(formatNumberInput(500), '500');
    });

    it('returns empty string for 0, empty string, or invalid input', () => {
      assert.equal(formatNumberInput(0), '');
      assert.equal(formatNumberInput('0'), '');
      assert.equal(formatNumberInput(''), '');
      assert.equal(formatNumberInput(null as any), '');
      assert.equal(formatNumberInput(undefined as any), '');
    });

    it('respects English locale with comma separator', () => {
      assert.equal(formatNumberInput(1000000, 'en'), '1,000,000');
    });
  });

  describe('parseCurrencyWithBackspace', () => {
    it('handles progressive digit typing up to 1.000.000', () => {
      let state = '';
      const digits = ['1', '0', '0', '0', '0', '0', '0'];
      const expectedStates = ['1', '10', '100', '1000', '10000', '100000', '1000000'];
      const expectedFormatted = ['1', '10', '100', '1.000', '10.000', '100.000', '1.000.000'];

      for (let i = 0; i < digits.length; i++) {
        const prevFormatted = formatNumberInput(state, 'id');
        const nextText = prevFormatted + digits[i];
        state = parseCurrencyWithBackspace(nextText, prevFormatted);
        assert.equal(state, expectedStates[i]);
        assert.equal(formatNumberInput(state, 'id'), expectedFormatted[i]);
      }
    });

    it('handles backspace from the end', () => {
      const prevFormatted = '1.000.000';
      const backspacedText = '1.000.00';
      const result = parseCurrencyWithBackspace(backspacedText, prevFormatted);
      assert.equal(result, '100000');
      assert.equal(formatNumberInput(result, 'id'), '100.000');
    });

    it('handles backspace on separator dot properly', () => {
      // User deletes dot in "1.000"
      const result1 = parseCurrencyWithBackspace('1000', '1.000');
      assert.equal(result1, '');

      // User deletes dot in "25.000"
      const result2 = parseCurrencyWithBackspace('25000', '25.000');
      assert.equal(result2, '2000');
      assert.equal(formatNumberInput(result2, 'id'), '2.000');
    });

    it('ignores leading zero when typing on empty field', () => {
      assert.equal(parseCurrencyWithBackspace('0', ''), '');
    });

    it('handles pasted formatted strings', () => {
      assert.equal(parseCurrencyWithBackspace('1.000.000', ''), '1000000');
      assert.equal(parseCurrencyWithBackspace('Rp 1.000.000', ''), '1000000');
    });
  });

  describe('parseCurrencyInput', () => {
    it('parses formatted string to integer number', () => {
      assert.equal(parseCurrencyInput('1.000.000'), 1000000);
      assert.equal(parseCurrencyInput('1000000'), 1000000);
      assert.equal(parseCurrencyInput(''), 0);
    });
  });
});
