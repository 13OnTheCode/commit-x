# Commit-X

[![NPM version](https://img.shields.io/npm/v/commit-x?color=f14e32&amp;label=)](https://www.npmjs.com/package/commit-x)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?color=f14e32&amp;label=)](LICENSE.md)

English | [简体中文](README.CN.md)

a command-line tool that allows you to interactively generate Git commit messages that comply with the [Conventional Commits](https://www.conventionalcommits.org) specification and automatically commit them.

## Features

- User-friendly interactive interface
- No upfront configuration, no adapters required, no extra steps
- Automatic validation of commit messages to ensure compliance with the specification, with error messages and suggestions

## Install

### Global

For global access and ease of use, it's recommended to install commit-x globally on your system:

```bash
npm install commit-x -g
```

### Project-Specific

If you prefer project-specific installations:

```bash
npm install commit-x --save-dev
```

## Usage

Run the following command in your terminal:

```bash
commit-x
```

Follow the prompts to fill in the commit message details, and it will be automatically committed to your Git repository

## License

[MIT](LICENSE.md) License &copy; 2023-PRESENT [13OnTheCode](https://github.com/13OnTheCode)
