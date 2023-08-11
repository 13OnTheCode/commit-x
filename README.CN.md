# Commit-X

[![NPM version](https://img.shields.io/npm/v/commit-x?color=f14e32&amp;label=)](https://www.npmjs.com/package/commit-x)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?color=f14e32&amp;label=)](LICENSE.md)

[English](README.md) | 简体中文

一个命令行工具，允许你通过交互式方式生成符合 [Conventional Commits](https://www.conventionalcommits.org) 规范的 Git 提交消息，并自动进行提交

![commit-x](https://github.com/13OnTheCode/commit-x/assets/137921275/e71c8c2d-32ed-41a5-bb41-0f3b5260269f)

## Features

- 友好的交互式界面
- 无需前置配置，无需适配器，没有额外的步骤
- 自动校验提交消息是否符合规范，并给出错误提示和建议

## Install

### Global

为了全局访问和便于使用，建议在系统上全局安装 commit-x:

```bash
npm install commit-x -g
```

### Project-Specific

如果你更喜欢项目中的安装:

```bash
npm install commit-x --save-dev
```

## Usage

在终端中执行以下命令:

```bash
commit-x
```

按照提示逐步填写提交消息的内容，并确认后，它将被自动提交到你的 Git 仓库

## License

[MIT](LICENSE.md) License &copy; 2023-PRESENT [13OnTheCode](https://github.com/13OnTheCode)
