# Contributing to lovdaCN

Thank you for your interest in contributing to lovdaCN! We welcome contributions from everyone.

This document outlines the guidelines and workflow for contributing to lovdaCN.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Style Guide & Best Practices](#style-guide--best-practices)
- [License](#license)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create a GitHub issue and include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected vs. actual behavior.
- Screenshots or recordings if applicable.
- Environment details (OS, Node version, bundler, package manager).

### Suggesting Enhancements

We are always looking for ways to improve! To suggest a feature or improvement:
- Open a GitHub issue outlining your idea.
- Explain the problem it solves and why it would be beneficial to other users.
- Provide mockups, API designs, or usage examples if possible.

### Pull Requests

1. **Fork the repository** and create your branch from `main`.
2. **Implement your changes**:
   - Write clean, well-documented code.
   - Follow the existing design patterns.
   - Run linting and type checks locally before submitting.
3. **Commit your changes**:
   - Use clear and descriptive commit messages (e.g. `feat(registry): add input component` or `fix(cli): resolve build syntax error`).
4. **Submit a pull request**:
   - Describe what the PR does, which issue it closes, and how you verified the changes.

---

## Development Setup

### Prerequisites

This repository is managed as a **pnpm monorepo** and uses **Node.js >= 18**.

- Make sure you have [Node.js](https://nodejs.org/) installed.
- Install [pnpm](https://pnpm.io/) globally (version 9 is recommended):
  ```sh
  npm install -g pnpm
  ```

### Installation

Clone the repository and install the workspace dependencies:

```sh
git clone https://github.com/lovdacn-ui/ui.git
cd ui
pnpm install
```

### Running Locally

To start the development server for all apps in the workspace using Turborepo:

```sh
pnpm dev
```

To run tasks on a specific project (e.g., the `v2` Next.js documentation app):

```sh
# Start the v2 dev server
pnpm --filter v2 dev

# Run linting on v2
pnpm --filter v2 lint

# Run TypeScript type check on v2
pnpm --filter v2 exec tsc --noEmit
```

---

## Style Guide & Best Practices

- **TypeScript**: Use strict TypeScript typing where possible. Avoid the `any` type.
- **Linting & Formatting**: We use ESLint and Prettier. Keep your formatting consistent by running:
  ```sh
  pnpm format
  ```
- **Component Design**: Make components highly customizable, accessible, and performant.

## License

By contributing to lovdaCN, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
