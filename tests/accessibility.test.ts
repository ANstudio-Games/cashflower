import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { colors } from '../src/theme/colors';
function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722;
}
function contrast(a: string,b: string) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
it('shared normal text and financial badge colors meet 4.5:1', () => {
  for (const color of [colors.text, colors.textSecondary, colors.textMuted]) {
    assert.ok(contrast(color, colors.surface)>=4.5, color);
    assert.ok(contrast(color, colors.background)>=4.5, color);
  }
  for (const color of [colors.primary,colors.income,colors.expense]) assert.ok(contrast('#FFFFFF',color)>=4.5,color);
  for (const [color,bg] of [[colors.debt,colors.debtSoft],[colors.receivable,colors.receivableSoft]]) assert.ok(contrast(color,bg)>=4.5,color);
});
it('shared destructive controls declare labels and 48dp targets', () => {
  for (const file of ['transaction-item','debt-item','investment-item','plan-item']) {
    const s=readFileSync(`src/components/${file}.tsx`,'utf8');
    assert.match(s,/a11y_delete/,file);
    assert.match(s,/minWidth: 48/,file);
    assert.match(s,/minHeight: 48/,file);
  }
});
