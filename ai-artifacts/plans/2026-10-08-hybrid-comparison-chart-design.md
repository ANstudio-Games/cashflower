# Hybrid comparison chart

## Approved direction
User approved adding a multi-line chart to Analytics without replacing existing bar/donut charts.

- Year mode: one line per year; X axis January–December; monthly totals. Choose 1/5/10 years ending at the selected year.
- Month mode: one line per month in the selected year; X axis days 1–31; cumulative daily values. Stop at each month's real final date.
- Income, expense, and net selectors. Default year mode, five years, expenses.
- Tap points or larger axis buttons to inspect amounts. Toggle individual series through numbered/color-coded legends; later series also use dashed lines.
- Highest-income and highest-expense monthly summaries cover the entire selected period, independent of hidden lines or selected metric.
- Future dates omitted. Current periods marked incomplete. Zero indicates no recorded transaction, not proof of complete historical coverage.
- Transfers, invalid dates, non-positive/non-finite amounts excluded. No new dependencies or database changes.

## Direction contract
THESIS: Compare seasonal cash flow without replacing the established Analytics surface.
OWN-WORLD: Existing Cashflower white surfaces, teal controls, native system typography; series colors only identify time periods.
STORY: Pick year/month comparison, choose a metric, inspect a period, and identify recorded monthly peaks.
FIRST VIEWPORT: New section below the existing cash-flow chart; wrapped controls precede a horizontally scrollable plot, numbered legend, and monthly peak text.
FORM: Narrow local extension approved in chat; no concept seed or comp required. Code-led implementation using existing SVG dependency.
FINISH: Verification requires full tests, TypeScript and platform bundling; screenshot/runtime interaction remains unverified until a device is available.

## Verification
Tests cover five-year windows, net negatives, future cutoff, cumulative days, month lengths/leap years, invalid amounts, transfers, and empty periods. Run the complete repository test suite and export bundles. Do not claim native interaction was tested based on exports.
