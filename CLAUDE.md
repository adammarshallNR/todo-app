# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Dev server at http://localhost:3000
npm test         # Run tests in interactive watch mode
npm test -- --watchAll=false  # Run tests once (CI mode)
npm test -- --testPathPattern=App  # Run a single test file
npm run build    # Production build to /build
```

## Architecture

This is a Create React App (React 19) todo application. The entry point is `src/index.js` → `src/App.js` → `src/components/TodoList` (not yet created).

All application components live in `src/components/`. `App.js` is a thin shell that renders `<TodoList />` and applies global styles from `App.css`.

Tests use React Testing Library (`@testing-library/react`) with Jest. Test files are colocated with source files using the `.test.js` suffix.
