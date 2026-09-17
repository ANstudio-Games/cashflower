export const colors = {
  background: '#F8FAFC', // Slate 50 - clean modern light backdrop
  surface: '#FFFFFF',    // Crisp white card surface
  surfaceHover: '#F1F5F9',
  border: '#E2E8F0',     // Subtle border for clean lines
  borderLight: '#F8FAFC',
  
  text: '#0F172A',       // Slate 900 - high contrast deep text
  textSecondary: '#475569', // Slate 600 - clear readability
  textMuted: '#94A3B8',  // Slate 400 - secondary cues
  
  primary: '#0D9488',    // Emerald / Teal 600 - financial stability
  primaryLight: '#CCFBF1',
  primarySoft: '#F0FDFA',
  primaryDark: '#0F766E',

  // Income / Profit
  income: '#10B981',     // Emerald 500
  incomeSoft: '#ECFDF5',
  incomeDark: '#047857',

  // Expense / Loss
  expense: '#EF4444',    // Red 500
  expenseSoft: '#FEF2F2',
  expenseDark: '#B91C1C',

  // Warning
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',

  // Hutang (Payable - You owe)
  debt: '#F59E0B',       // Amber 500
  debtSoft: '#FFFBEB',
  debtDark: '#B45309',

  // Piutang (Receivable - Money owed to you)
  receivable: '#6366F1', // Indigo 500
  receivableSoft: '#EEF2FF',
  receivableDark: '#4338CA',

  // Investment / Trading
  investment: '#3B82F6', // Blue 500
  investmentSoft: '#EFF6FF',
  investmentDark: '#1D4ED8',

  shadow: 'rgba(15, 23, 42, 0.06)',
};

export const shadowStyles = {
  sm: {
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  md: {
    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
  },
  lg: {
    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
  },
};
