# Cashflower

[English](README.md) · [Bahasa Indonesia](README.id.md) · 简体中文

Cashflower 是一款使用 Expo 和 React Native 开发的 Android 个人记账应用。财务记录保存在本地 SQLite 数据库中，可用于管理收支、债务、预算、储蓄计划和投资交易记录。

## 功能

- 记录收入和支出，并添加分类、日期及备注。
- 搜索交易，按交易类型、分类或钱包筛选。
- 分别管理现金、银行账户和电子钱包余额。钱包间转账不计入收入或支出。
- 设置每月支出上限及分类预算。
- 记录应付款、应收款、到期日期和还款。
- 为购买计划分配资金，并在完成购买时记录支出。
- 记录投资交易，查看盈亏和胜率汇总。
- 查看现金流图表和支出分类明细。
- 导出 PDF 或 CSV 报表，通过 JSON 文件备份和恢复记录。
- 开启每日记账提醒和债务到期提醒。

应用界面支持印度尼西亚语、英语和中文。

## 数据与网络连接

财务记录保存在设备上。更换手机或卸载应用前，请将备份文件保存到应用之外。设备丢失后，无法通过此代码仓库恢复数据。

核心记账功能可离线使用。不过，应用集成了 Google Mobile Ads，因此并非所有功能都不访问网络。通过其他服务分享报表或备份文件时，也可能需要联网。

## 本地运行

安装当前的 Node.js LTS 版本和 npm。构建本地 Android 应用还需要 Android Studio、Android SDK 以及已配置好的 JDK。

在项目目录中运行：

```sh
npm install
npx expo run:android
```

请先启动 Android 模拟器，或连接已开启 USB 调试的 Android 手机。此命令会构建并安装原生应用，然后启动开发服务器。这些命令也可在 Windows PowerShell 中使用。

后续开发时，可使用以下命令启动 Metro：

```sh
npx expo start
```

在设备上打开已安装的开发应用。如果修改了原生依赖或配置插件，请再次运行 `npx expo run:android` 重新构建。

### Expo Go 与网页版本

Expo Go 不能替代本项目的原生构建。本项目使用的 `react-native-google-mobile-ads` 并未包含在 Expo Go 中。

如需尝试网页版本：

```sh
npm run web
```

网页版本不能替代 Android 设备测试。广告、通知、文件分享和打印等原生集成在浏览器中可能表现不同，或无法使用。

## 代码检查

```sh
# TypeScript 类型检查
npx tsc --noEmit

# 单元测试（需要 Bun）
bun test tests

# Lint 检查
npm run lint
```

测试涵盖金额输入、保存保护、计划资金分配、提醒规则、广告频率及部分界面检查。这些测试不能替代实际设备测试。

## Android 构建

构建配置位于 `eas.json`。EAS Build 需要 Expo 账户，并可能受到使用额度限制或产生服务费用。

```sh
npx eas-cli login

# 用于内部测试的 APK
npx eas-cli build --platform android --profile preview

# 用于应用商店分发的 Android App Bundle
npx eas-cli build --platform android --profile production
```

此外，`development` 配置可用于构建自定义开发客户端。分发前，请检查应用 ID、签名凭据和广告配置。

## 代码结构

```text
src/
  app/          Expo Router 页面、标签页和模态路由
  components/   共用界面组件和图表
  config/       应用配置，包括广告配置
  context/      共用应用状态
  db/           SQLite 数据库结构和操作
  i18n/         翻译和语言工具
  services/     应用服务
  theme/        颜色和共用视觉样式
  types/        TypeScript 数据模型
  utils/        格式化、报表、备份和提醒工具
tests/          单元测试
assets/         图标和图片
```

`app.json` 包含应用版本和 Expo 配置。`package.json` 列出依赖和本地命令。`DESIGN.md` 记录应用的视觉规范。

## 许可

此仓库为私有专有项目。`package.json` 声明为 `UNLICENSED`，不授予开源许可。重新分发源代码或资源文件须获得所有者许可。
