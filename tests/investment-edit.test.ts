import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

it('updates an investment in place without duplicating it or changing its creation time', async () => {
  // Native Expo imports are unavailable in Node; execute the real database module
  // with an SQLite adapter. These imports are not used by updateInvestment.
  const exports: Record<string, any> = {};
  const source = ts.transpileModule(readFileSync('src/db/index.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(source, { exports, require: () => ({}) });
  assert.equal(typeof exports.updateInvestment, 'function');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE investments (id TEXT PRIMARY KEY, instrument_type TEXT, asset_name TEXT,
      capital REAL, buy_price REAL, sell_price REAL, pnl REAL, pnl_percentage REAL,
      trade_date TEXT, notes TEXT, created_at INTEGER);
      INSERT INTO investments VALUES ('inv_1', 'saham', 'OLD', 1000, 10, 11, 100, 10, '2026-01-01', 'old', 123);
      INSERT INTO investments VALUES ('inv_2', 'emas', 'OTHER', 100, 1, 1, 0, 0, '2026-01-01', NULL, 456);`);
    await exports.updateInvestment({
      runAsync: async (sql: string, params: any[]) => db.prepare(sql).run(...params),
    }, { id: 'inv_1', instrument_type: 'kripto', asset_name: 'BTC', capital: 2000,
      buy_price: 20, sell_price: 15, pnl: -500, pnl_percentage: -25,
      trade_date: '2026-02-02', notes: null, created_at: 999 });
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM investments').get()!.count, 2);
    assert.deepEqual({ ...db.prepare("SELECT * FROM investments WHERE id = 'inv_1'").get() }, {
      id: 'inv_1', instrument_type: 'kripto', asset_name: 'BTC', capital: 2000,
      buy_price: 20, sell_price: 15, pnl: -500, pnl_percentage: -25,
      trade_date: '2026-02-02', notes: null, created_at: 123,
    });
    assert.equal(db.prepare("SELECT asset_name FROM investments WHERE id = 'inv_2'").get()!.asset_name, 'OTHER');
  } finally { db.close(); }
});
