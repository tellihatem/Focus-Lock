<div align="center">

# 🎮 Focus-Lock: Earn Your Playtime

**A gamified productivity app that helps you earn your gaming time by completing tasks first.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/code%20of-conduct-ff69b4.svg)](CODE_OF_CONDUCT.md)

*"You don't block fun. You earn it."*

[Features](#features) • [Installation](#installation) • [Contributing](#contributing) • [License](#license)

</div>

---

## 🎯 What is Focus-Lock?

Focus-Lock is a Windows desktop application that enforces productivity by restricting access to games and selected applications until you complete predefined tasks. It gamifies your productivity with XP, levels, and achievements.

## Project Structure

```
src/
├── main/                    # Electron main process / backend
│   ├── services/           # Business logic services
│   │   └── task-service.ts # Task management business logic
│   ├── database/           # Database operations
│   │   ├── database.ts     # SQLite database manager
│   │   └── schema.ts       # Database schema definitions
│   └── utils/              # Utility functions
├── renderer/               # Frontend UI (React)
│   ├── components/         # React components
│   │   ├── TaskList.tsx    # Task list display
│   │   └── TaskForm.tsx    # Task creation/editing form
│   ├── hooks/              # Custom React hooks
│   │   └── useTasks.ts     # Task state management
│   ├── stores/             # State management (Zustand)
│   └── styles/             # Global styles
├── shared/                 # Shared types and constants
│   └── types.ts            # TypeScript type definitions
└── tests/                  # Unit tests
    └── task-service.test.ts # Task service tests
```

## Tech Stack

- **Framework:** Electron (desktop) + React (UI)
- **Language:** TypeScript (strict mode)
- **Database:** SQLite3
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **State Management:** Zustand
- **Testing:** Jest + Testing Library

## Installation

```bash
npm install
```

## Development

```bash
# Start development servers (main + renderer)
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## Phase 1: Core MVP - Task Management Module

### Completed ✅

- **Data Model:** Task interface with status, difficulty, timestamps
- **Database Schema:** SQLite schema with proper indexing
- **CRUD Operations:** Create, read, update, delete tasks
- **Business Logic:** TaskService with validation and error handling
- **UI Components:** TaskList and TaskForm components
- **Custom Hooks:** useTasks hook for state management
- **Unit Tests:** Comprehensive test suite for TaskService
- **Styling:** TailwindCSS configuration with design tokens

### Implementation Details

#### Task Data Model
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  difficulty: TaskDifficulty;
  createdAt: number;
  completedAt: number | null;
  dueDate?: number;
}
```

#### Database Features
- Atomic transactions for data consistency
- Indexed queries for performance
- WAL mode for concurrent access
- Automatic schema versioning

#### Service Layer
- Input validation (title, description, dates)
- Error handling with descriptive messages
- Business logic separation from database
- Helper methods (completion percentage, all completed check)

#### UI Components
- **TaskList:** Displays tasks with status indicators, edit/delete buttons
- **TaskForm:** Create/edit tasks with validation feedback
- Accessibility features (keyboard navigation, ARIA labels)
- Responsive design with TailwindCSS

#### Testing
- Unit tests for all service methods
- Mock database for isolation
- Edge case coverage (empty inputs, past dates, etc.)
- 80%+ code coverage target

## Security & Code Quality

- ✅ TypeScript strict mode enabled
- ✅ Input validation on all user inputs
- ✅ Error handling with try-catch blocks
- ✅ Descriptive comments on all functions
- ✅ No hardcoded sensitive values
- ✅ Secure defaults (WAL mode, foreign keys)

## Next Steps

1. **Phase 1.2:** Sticky Notes System
2. **Phase 1.3:** Focus Mode Core
3. **Phase 1.4:** Application Restriction Engine
4. **Phase 1.5:** Unlock Logic

## Development Rules

See `.windsurf/rules/rules.md` for comprehensive development guidelines including:
- Security requirements
- Code style standards
- UI/UX rules
- Backend architecture principles
- Testing requirements
- Anti-cheat measures

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a PR.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🔒 Security

For security concerns, please see our [Security Policy](SECURITY.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💖 Acknowledgments

- All our amazing [contributors](https://github.com/tellihatem/Earn_your_playtime/graphs/contributors)
- The open-source community for inspiration and tools

---

<div align="center">

**Made with ❤️ by the Focus-Lock Community**

⭐ Star us on GitHub — it motivates us a lot!

</div>
