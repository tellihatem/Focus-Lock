# Contributing to Focus-Lock

Thank you for your interest in contributing to Focus-Lock! This document provides guidelines and information about contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Earn_your_playtime.git`
3. Add upstream remote: `git remote add upstream https://github.com/tellihatem/Earn_your_playtime.git`

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker
- Check if the issue already exists
- Include steps to reproduce, expected vs actual behavior
- Include system information (OS, Node version)

### Suggesting Features

- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Be open to discussion

### Code Contributions

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write or update tests
4. Run `npm run test` to ensure tests pass
5. Commit using conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
6. Push and open a Pull Request

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Request review from maintainers
5. Address feedback promptly

## Style Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add comments for complex logic
- Use meaningful variable names

### Naming Conventions

- **Variables/Functions**: camelCase
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case

### Commit Messages

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Questions?

Feel free to open an issue for any questions about contributing!
