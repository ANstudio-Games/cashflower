import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { colors } from '../src/theme/colors';
function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722;
}
function contrast(a: string,b: string) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
it('primary reading text retains sufficient contrast in the restored 1.6 palette', () => {
  // Muted/accent pairs intentionally return to 1.6; not a WCAG pass claim.
  assert.equal(colors.primary, '#0D9488');
  assert.equal(colors.textMuted, '#94A3B8');
  for (const color of [colors.text, colors.textSecondary]) {
    assert.ok(contrast(color, colors.surface)>=4.5, color);
    assert.ok(contrast(color, colors.background)>=4.5, color);
  }
});
it('shared destructive controls preserve explicit labels after visual rollback', () => {
  for (const file of ['transaction-item','debt-item','investment-item','plan-item']) {
    const s=readFileSync(`src/components/${file}.tsx`,'utf8');
    assert.match(s,/a11y_delete/,file);
  }
});
