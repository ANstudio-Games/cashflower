const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const ts = require('typescript');
const React = require('react');

// Execute the real components and their event handlers without a native runtime.
function load(path, mocks) {
  const filename = resolve(path);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? resolve('src', id.slice(2)) : resolve(dirname(filename), id);
      const target = [base + '.ts', base + '.tsx', base + '/index.ts'].find(existsSync);
      if (target) return load(target, mocks);
    }
    return require(id);
  }, module, module.exports);
  return module.exports;
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

const item = {
  id: 'inv_existing', instrument_type: 'saham', asset_name: 'BBCA', capital: 1000000,
  buy_price: 2000, sell_price: 2500, pnl: 250000, pnl_percentage: 25,
  trade_date: '2026-10-20', notes: 'Original strategy', created_at: 123,
};

function harness(params = {}, investments = [item]) {
  let states = [], cursor = 0, effects = [], deps = [], dirty = false;
  const calls = { pushes: [], edits: [], creates: [], alerts: [], ads: 0, backs: 0, deletes: [] };
  const finance = {
    investments, investmentSummary: { totalPnl: 250000, totalCapital: 1000000, totalTrades: 1, winCount: 1, lossCount: 0, netReturnPercentage: 25 },
    createInvestment: async value => { calls.creates.push(value); },
    editInvestment: async value => { calls.edits.push(value); },
    deleteInvestmentById: async id => { calls.deletes.push(id); },
  };
  const mocks = {
    react: { ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; dirty = true; }];
      },
      useEffect(fn, next) {
        const index = cursor++;
        if (!deps[index] || next.some((value, i) => value !== deps[index][i])) effects.push(fn);
        deps[index] = next;
      },
      useMemo: fn => fn(),
    },
    'react-native': { View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable',
      ScrollView: 'ScrollView', FlatList: 'FlatList', KeyboardAvoidingView: 'KeyboardAvoidingView',
      StyleSheet: { create: value => value }, Platform: { OS: 'android' }, StatusBar: { currentHeight: 24 },
      Alert: { alert: (...args) => calls.alerts.push(args) } },
    'expo-router': { useRouter: () => ({ push: route => calls.pushes.push(route), back: () => calls.backs++ }), useLocalSearchParams: () => params },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 24 }) },
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    '@/context/finance-context': { useFinance: () => finance },
    '@/i18n': { useI18n: () => ({ t: key => key, language: 'en', formatDateShort: date => date }) },
    '@/components/date-field': { DateField: 'DateField' },
    '@/components/number-input': { NumberInput: 'NumberInput' },
    'expo-sqlite': { useSQLiteContext: () => ({}) },
    '@/services/ad-service': { handleSavedWithAd: async (_db, _kind, callback) => { calls.ads++; callback(); } },
    '@/utils/use-save-action': { useSaveAction: () => ({ isSaving: false, runSave: fn => fn() }) },
  };
  return { calls, mocks, finance, render(Component, props = {}) {
    let tree;
    for (let i = 0; i < 10; i++) {
      cursor = 0; dirty = false; effects = [];
      tree = Component(props);
      effects.forEach(fn => fn());
      if (!dirty) return tree;
    }
    throw new Error('Render did not settle');
  } };
}

test('pressing an investment card opens the editor with its record id', () => {
  const h = harness();
  const Screen = load('src/app/(tabs)/investments.tsx', h.mocks).default;
  const list = nodes(h.render(Screen)).find(node => node.type === 'FlatList');
  const entry = list.props.renderItem({ item });
  const card = h.render(entry.type, entry.props);
  assert.equal(card.type, 'Pressable', 'Investment card must be actionable');
  card.props.onPress();
  assert.deepEqual(h.calls.pushes, [{ pathname: '/modal/add-investment', params: { id: item.id } }]);
});

function form(h) {
  const Modal = load('src/app/modal/add-investment.tsx', h.mocks).default;
  const render = () => nodes(h.render(Modal));
  const input = (label) => render().find(node => node.props?.accessibilityLabel === label);
  const save = () => render().find(node => node.props?.accessibilityState?.busy === false);
  return { render, input, save };
}

test('editor pre-fills every field and updates the selected record without creating a duplicate, then shows an ad', async () => {
  const h = harness({ id: item.id });
  const f = form(h);
  assert.equal(f.input('inv_modal_capital').props.value, '1000000');
  assert.equal(f.input('inv_modal_buy_price').props.value, '2000');
  assert.equal(f.input('inv_modal_sell_price').props.value, '2500');
  assert.ok(f.render().some(node => node.props?.value === item.asset_name));
  assert.ok(f.render().some(node => node.props?.value === item.trade_date));
  assert.ok(f.render().some(node => node.props?.value === item.notes));
  f.input('inv_modal_sell_price').props.onChangeText('1800,5');
  await f.save().props.onPress();
  assert.deepEqual(h.calls.edits, [{
    id: item.id, instrument_type: item.instrument_type, asset_name: item.asset_name,
    capital: item.capital, buy_price: item.buy_price, sell_price: 1800.5,
    trade_date: item.trade_date, notes: item.notes,
  }]);
  assert.equal(h.calls.creates.length, 0);
  assert.equal(h.calls.ads, 1);
  assert.equal(h.calls.backs, 1);
});

test('legacy edits retain total-price semantics and allow zero sale proceeds', async () => {
  const legacy = { ...item, capital: null };
  const h = harness({ id: item.id }, [legacy]);
  const f = form(h);
  assert.equal(f.input('inv_modal_capital'), undefined);
  assert.equal(f.input('inv_legacy_buy').props.value, '2000');
  f.input('inv_legacy_sell').props.onChangeText('0');
  await f.save().props.onPress();
  assert.equal(h.calls.edits[0].capital, null);
  assert.equal(h.calls.edits[0].sell_price, 0);
});

test('a missing edit target cannot be saved as a new investment', async () => {
  const h = harness({ id: 'deleted' });
  const f = form(h);
  assert.equal(f.save().props.disabled, true);
  assert.ok(f.render().some(node => node.props?.accessibilityRole === 'alert'));
  await f.save().props.onPress();
  assert.equal(h.calls.edits.length, 0);
  assert.equal(h.calls.creates.length, 0);
  assert.equal(h.calls.backs, 0);
});

test('new investment still uses creation and the existing ad flow', async () => {
  const h = harness();
  const f = form(h);
  f.render().find(node => node.type === 'TextInput' && node.props.autoCapitalize === 'characters').props.onChangeText(' bbca ');
  f.input('inv_modal_capital').props.onChangeText('1000000');
  f.input('inv_modal_buy_price').props.onChangeText('2000');
  f.input('inv_modal_sell_price').props.onChangeText('2500');
  await f.save().props.onPress();
  assert.equal(h.calls.edits.length, 0);
  assert.equal(h.calls.creates[0].asset_name, 'BBCA');
  assert.equal(h.calls.ads, 1);
  assert.equal(h.calls.backs, 1);
});

test('invalid prices and failed updates keep the editor open', async () => {
  const h = harness({ id: item.id });
  const f = form(h);
  f.input('inv_modal_buy_price').props.onChangeText('0');
  await f.save().props.onPress();
  assert.equal(h.calls.edits.length, 0);
  assert.equal(h.calls.backs, 0);
  assert.equal(h.calls.alerts.length, 1);
  f.input('inv_modal_buy_price').props.onChangeText('2000');
  h.finance.editInvestment = async () => { throw new Error('Write failed'); };
  const originalError = console.error;
  console.error = () => {};
  try { await f.save().props.onPress(); } finally { console.error = originalError; }
  assert.equal(h.calls.backs, 0);
  assert.equal(h.calls.alerts.length, 2);
});

test('delete stops the press from opening the editor and requires confirmation', () => {
  const h = harness();
  const { InvestmentItem } = load('src/components/investment-item.tsx', h.mocks);
  let stopped = false;
  const tree = h.render(InvestmentItem, { item, onEdit: () => h.calls.pushes.push('edit'), onDelete: id => h.calls.deletes.push(id) });
  const button = nodes(tree).find(node => node.props?.accessibilityLabel === 'a11y_delete');
  button.props.onPress({ stopPropagation: () => { stopped = true; } });
  assert.equal(stopped, true);
  assert.equal(h.calls.pushes.length, 0);
  assert.equal(h.calls.deletes.length, 0);
  h.calls.alerts[0][2].find(action => action.style === 'destructive').onPress();
  assert.deepEqual(h.calls.deletes, [item.id]);
});

test('database edits persist in place, preserve creation time, and refresh portfolio totals', async () => {
  const { DatabaseSync } = require('node:sqlite');
  const sqlite = new DatabaseSync(':memory:');
  const db = {
    execAsync: async sql => sqlite.exec(sql),
    runAsync: async (sql, params = []) => sqlite.prepare(sql).run(...params),
    getAllAsync: async (sql, params = []) => sqlite.prepare(sql).all(...params),
    getFirstAsync: async (sql, params = []) => sqlite.prepare(sql).get(...params),
  };
  try {
    const h = harness();
    const queries = load('src/db/index.ts', { 'expo-sqlite': {} });
    await queries.initDatabase(db);
    await queries.addInvestment(db, item);
    await queries.addInvestment(db, { ...item, id: 'other' });
    const contextMocks = {
      ...h.mocks,
      react: { ...h.mocks.react, useCallback: fn => fn, useRef: value => ({ current: value }), useEffect: () => {} },
      'expo-sqlite': { useSQLiteContext: () => db },
      'expo-haptics': { impactAsync: () => {}, ImpactFeedbackStyle: { Light: 'light' } },
      '@/db': queries,
      '@/utils/backup': {}, '@/utils/notifications': {},
    };
    const { FinanceProvider } = load('src/context/finance-context.tsx', contextMocks);
    let context = h.render(FinanceProvider).props.value;
    await context.refreshAll();
    context = h.render(FinanceProvider).props.value;
    await context.editInvestment({ ...item, asset_name: 'UPDATED', capital: 2000000, sell_price: 1000, created_at: 999 });
    const rows = await queries.getInvestments(db);
    const updated = rows.find(row => row.id === item.id);
    assert.equal(rows.length, 2);
    assert.equal(updated.created_at, item.created_at);
    assert.equal(updated.asset_name, 'UPDATED');
    assert.equal(updated.pnl, -1000000);
    assert.equal(updated.pnl_percentage, -50);
    assert.equal(rows.find(row => row.id === 'other').pnl, item.pnl);
    const summary = await queries.getInvestmentSummary(db);
    assert.equal(summary.totalCapital, 3000000);
    assert.equal(summary.totalPnl, -750000);
    assert.equal(summary.totalTrades, 2);
    context = h.render(FinanceProvider).props.value;
    assert.equal(context.investmentSummary.totalPnl, -750000);
    assert.equal(context.investments.find(row => row.id === item.id).sell_price, 1000);
    await assert.rejects(context.editInvestment({ ...item, id: 'missing' }), /not found/);
    await assert.rejects(queries.updateInvestment(db, { ...item, id: 'missing' }), /not found/);
    await assert.rejects(context.editInvestment({ ...item, buy_price: 0 }), RangeError);
    assert.equal((await queries.getInvestments(db)).find(row => row.id === item.id).pnl, -1000000);
    await queries.addInvestment(db, { ...item, id: 'legacy', capital: null });
    await context.refreshAll();
    context = h.render(FinanceProvider).props.value;
    await context.editInvestment({ ...item, id: 'legacy', capital: null, sell_price: 0 });
    const legacy = (await queries.getInvestments(db)).find(row => row.id === 'legacy');
    assert.equal(legacy.capital, null);
    assert.equal(legacy.pnl, -2000);
    assert.equal(legacy.pnl_percentage, -100);
  } finally { sqlite.close(); }
});
