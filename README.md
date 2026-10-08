# Cashflower

English · [Bahasa Indonesia](README.id.md) · [简体中文](README.zh-CN.md)

Cashflower is a personal finance app for Android, built with Expo and React Native. It keeps your financial records in a local SQLite database, with tools for tracking cash flow, debts, budgets, savings plans, and investment trades.

## What it does

- Record income and expenses with categories, dates, and notes.
- Search transactions and filter them by type, category, or wallet.
- Track cash, bank accounts, and e-wallets separately. Transfers move funds between wallets without counting as income or expenses.
- Set monthly spending limits, including limits for individual categories.
- Record debts and receivables, due dates, and repayments.
- Allocate funds to purchase plans and record a purchase when a plan is completed.
- Keep an investment journal with profit, loss, and win-rate summaries.
- View cash-flow charts and expense breakdowns.
- Export PDF or CSV reports, and back up or restore records using JSON files.
- Enable local reminders for daily entries and upcoming debt payments.

The interface supports Indonesian, English, and Chinese.

## Data and connectivity

Financial records are stored on the device. Keep a backup outside the app before changing phones or uninstalling it; a lost device cannot be recovered from this repository.

Core bookkeeping works offline. The app also includes Google Mobile Ads, so “offline” does not mean that every part of the app avoids network access. Sharing a report or backup through another service may also require an internet connection.

## Run locally

Install a current Node.js LTS release and npm. For a local Android build, you also need Android Studio, the Android SDK, and a configured JDK.

From the project directory:

```sh
npm install
npx expo run:android
```

Start an Android emulator first, or connect an Android phone with USB debugging enabled. The command builds and installs the native app, then starts the development server. These commands also work from PowerShell on Windows.

For subsequent sessions, start Metro with:

```sh
npx expo start
```

Open the installed development app on your device. If you change native dependencies or config plugins, run `npx expo run:android` again to rebuild it.

### Expo Go and web

Expo Go is not a replacement for the native build: this project includes `react-native-google-mobile-ads`, which is not bundled with Expo Go.

To try the web target:

```sh
npm run web
```

Treat it as a separate target, not an Android test. Native integrations such as ads, notifications, file sharing, and printing may behave differently or be unavailable in the browser.

## Checks

```sh
# TypeScript
npx tsc --noEmit

# Unit tests (requires Bun)
bun test tests

# Lint
npm run lint
```

Tests cover currency input, save guards, plan allocations, reminder policy, ad frequency, and selected UI checks. They do not replace testing the app on a device.

## Android builds

The build profiles are defined in `eas.json`. EAS Build requires an Expo account and may be subject to service limits or charges.

```sh
npx eas-cli login

# Installable APK for internal testing
npx eas-cli build --platform android --profile preview

# Android App Bundle for store distribution
npx eas-cli build --platform android --profile production
```

The `development` profile is also available for custom development-client builds. Check the application ID, signing credentials, and ad configuration before distributing a build.

## Code layout

```text
src/
  app/          Expo Router screens, tabs, and modal routes
  components/   Shared UI and charts
  config/       App configuration, including ads
  context/      Shared application state
  db/           SQLite schema and database operations
  i18n/         Translations and locale helpers
  services/     Application services
  theme/        Colors and shared visual styles
  types/        TypeScript models
  utils/        Formatting, reports, backups, and reminders
tests/          Unit tests
assets/         Icons and images
```

`app.json` holds the app version and Expo configuration. `package.json` lists dependencies and local commands. `DESIGN.md` documents the visual conventions.

## License

This repository is private and proprietary. `package.json` declares it `UNLICENSED`; no open-source license is granted. Permission from the owner is required to redistribute the source code or assets.
