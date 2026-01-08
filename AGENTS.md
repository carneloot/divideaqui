# AGENTS.md - DivideAqui Development Guide

Comprehensive guide for agentic coding in the DivideAqui repository.

## Quick Commands

| Purpose | Command |
|---------|---------|
| **Dev Server** | `npm run dev` or `bun dev` |
| **Build** | `npm run build` or `bun build` |
| **Type Check** | `tsc -b` |
| **Lint** | `npm run lint:biome` or `bun lint:biome` |
| **Fix Lint** | `npm run lint:biome:fix` or `bun lint:biome:fix` |
| **Format** | `npm run format` or `bun format` |
| **Check All** | `npm run check` or `bun check` (lint + format) |
| **Fix All** | `npm run check:fix` or `bun check:fix` |
| **Type + Build** | `npm run build` (runs `tsc -b && vite build`) |

## Project Overview

- **Type**: React 19 + TypeScript single-page application (SPA)
- **Build Tool**: Vite
- **Package Manager**: bun (or npm, yarn, pnpm)
- **UI Framework**: React with shadcn/ui components
- **Styling**: Tailwind CSS v4 with class-variance-authority (CVA)
- **State Management**: Effect library with effect-atom for atoms
- **i18n**: i18next (English & Portuguese)
- **Icons**: Lucide React
- **Special Features**: PIX payment integration, drag-and-drop (@dnd-kit), data compression (pako)

## Code Style Guidelines

### Imports & Organization

- **Auto-organized**: Use `biome format` which auto-organizes imports via `organizeImports` action
- **Path aliases**: Use `@/*` alias for imports (configured in tsconfig.json)
- **Pattern**: External libs first, then absolute paths with `@/`, then relative imports
- **Example**:
  ```typescript
  import { Schema } from 'effect'
  import { useAtom } from '@effect-atom/atom-react'
  import { Button } from '@/components/ui/button'
  import { someUtil } from '@/lib/utils'
  import { localHelper } from './helpers'
  ```

### Formatting Rules (Biome enforced)

- **Indent**: Tabs (not spaces)
- **Quotes**: Single quotes (not double) - `'string'` not `"string"`
- **Semicolons**: Not needed (asNeeded) - omit semicolons
- **Trailing commas**: ES5 style (only where valid)
- **Arrow function parens**: Always required - `(x) => x` not `x => x`
- **Line width**: Follow Biome defaults (~80-100 chars, adjust as needed)

### TypeScript Rules

- **Strict mode**: ✅ Enabled globally
- **Unused code**: ✅ `noUnusedLocals` & `noUnusedParameters` enforced
- **Exhaustive checks**: ⚠️ `noFallthroughCasesInSwitch`, `useExhaustiveDependencies` (warn)
- **Side effects**: ✅ `noUncheckedSideEffectImports` enforced
- **Module resolution**: bundler mode with ES2022 target
- **Fallback**: Use `// biome-ignore lint/...` for unavoidable suppressions (rare)
- **NO `as any`, `@ts-ignore`, `@ts-expect-error`**: Never suppress type errors

### Naming Conventions

| Entity | Style | Example |
|--------|-------|---------|
| **Constants** | camelCase or UPPER_SNAKE_CASE | `maxRetries`, `API_KEY` |
| **Variables** | camelCase | `userData`, `isLoading` |
| **Functions** | camelCase | `calculateTotal`, `formatCurrency` |
| **Types/Schemas** | PascalCase + Schema suffix | `PersonSchema`, `ItemSchema` |
| **Components** | PascalCase | `Button`, `GroupManager` |
| **Files (components)** | PascalCase | `GroupManager.tsx` |
| **Files (utils/hooks)** | camelCase | `utils.ts`, `useIsMobile.ts` |
| **Atoms** | camelCase + Atom suffix | `selectedGroupAtom`, `groupsAtom` |
| **Booleans** | is/has prefix | `isLoading`, `hasError` |

### React Components

- **Functional components**: Use function declarations, not `const Component = () => {}`
- **React 19**: Supports JSX transform; no explicit React import needed for TSX files
- **Effect atoms**: Use `@effect-atom/atom-react` hooks: `useAtom`, `useAtomValue`, `useAtomSet`
- **Controlled inputs**: Validate with Maskito where needed (phone, currency, etc.)
- **Error boundaries**: Implement as needed for error recovery

### State Management (Effect + Atoms)

- **Atoms**: Use `Atom.make()` for simple state, `Atom.fnSync()` for side-effects
- **Derived atoms**: Use `Atom.make((get) => ...)` pattern
- **Persistence**: Use `Atom.kvs()` for localStorage-backed atoms
- **Validation**: All atoms should use `Effect/Schema` for validation
- **Runtime**: Injected via `runtimeAtom` from `./store/runtime`
- **Example**:
  ```typescript
  export const groupsAtom = Atom.kvs({
    runtime: runtimeAtom,
    key: 'expense-groups',
    schema: Schema.Array(ExpenseGroupSchema),
    defaultValue: () => [],
  })
  ```

### Type Safety with Effect/Schema

- **Define schemas**: Use `Schema.Class<T>()` or `Schema.Literal()` for all data types
- **Export both**: Schema AND derived type (see `src/types.ts`)
- **Validation**: Schemas automatically validate JSON serialization/deserialization
- **Pattern**:
  ```typescript
  export class PersonSchema extends Schema.Class<PersonSchema>('PersonSchema')({
    id: Schema.String,
    name: Schema.String,
  }) {}
  export type Person = Schema.Schema.Type<typeof PersonSchema>
  ```

### Error Handling

- **No empty catch blocks**: Always handle or log errors
- **Type errors**: Never suppress with `@ts-ignore`; fix root cause
- **Fallbacks**: Provide sensible defaults for nullable values
- **User feedback**: Use `sonner` for toast notifications on errors
- **Example**:
  ```typescript
  try {
    const result = JSON.parse(data)
  } catch (error) {
    console.error('Parse failed:', error)
    return null
  }
  ```

### UI Components

- **shadcn/ui**: Use pre-built components from `@/components/ui/`
- **Tailwind CSS**: Use utility classes; no custom CSS (prefer CVA for variants)
- **Class-variance-authority**: Use CVA for component variants (see `button.tsx`)
- **Responsive**: Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, etc.)
- **Dark mode**: System theme support via context (see `ThemeSync` component)
- **Accessibility**: Follow Radix UI patterns (a11y rules enabled in Biome)

### Testing Strategy

- **No test files currently**: Add `.test.ts(x)` files alongside source if needed
- **Type checking**: `tsc -b` validates types across entire app
- **Build verification**: `npm run build` catches runtime issues
- **Manual QA**: Test major flows before committing

## Linter Configuration (Biome)

### Enabled Rules

| Category | Level | Notes |
|----------|-------|-------|
| **a11y/recommended** | error | Accessibility required |
| **correctness/recommended** | error | correctness/useExhaustiveDependencies = warn |
| **complexity/recommended** | error | Max complexity enforced |
| **style/recommended** | error | Code style (quotes, semicolons, etc.) |
| **suspicious/recommended** | error | Bug detection |
| **nursery/useSortedClasses** | warn | Tailwind class order |

### Common Lint Errors & Fixes

| Error | Fix |
|-------|-----|
| Unused variable | Remove or rename to `_unused` if intentional |
| Missing dependency in useEffect | Add to dependency array or `// biome-ignore` |
| Type error | Fix typing, don't suppress |
| Unsorted Tailwind classes | Run `biome lint --write .` |
| Single vs double quotes | Run `biome format --write .` |

## Project Structure

```
src/
  components/       # React components (UI & feature)
    ui/            # shadcn/ui base components
  hooks/           # Custom React hooks
  store/           # Effect atoms & state
  lib/             # Utilities & helpers
  types.ts         # Shared type definitions
  main.tsx         # Entry point
  index.css        # Global styles
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `effect` | Functional programming & type safety |
| `@effect-atom/atom-react` | State management atoms |
| `react`, `react-dom` | UI framework |
| `tailwindcss` | Styling |
| `@radix-ui/*` | Accessible components |
| `i18next` | Internationalization |
| `@dnd-kit` | Drag & drop |
| `@maskito/*` | Input masking |
| `sonner` | Toast notifications |
| `lucide-react` | Icons |

## Git & Commits

- **Conventional commits**: Use `feat:`, `fix:`, `refactor:`, `docs:`, `test:` prefixes
- **No AI slop**: Commit messages should clearly explain the "why"
- **Atomic commits**: One logical change per commit
- **No large rewrites**: Refactor in small steps

## Pre-commit Checks (Recommended)

Before pushing:
1. `npm run check:fix` - Fix all lint and format issues
2. `npm run build` - Verify type safety and build
3. Run the dev server briefly to spot obvious bugs
4. Check console for warnings/errors

## Common Patterns in This Codebase

- **Atom-based state**: All shared state goes in `src/store/`
- **Component composition**: Smaller, focused components over large monoliths
- **Type-first**: Define types/schemas before implementation
- **Utility functions**: Extract common logic to `@/lib/`
- **i18n keys**: Namespace by feature (e.g., `groups.title`, `items.add`)

---

**For agent coding**: Follow strict types, honor linter rules, and match existing patterns. No AI slop allowed.
