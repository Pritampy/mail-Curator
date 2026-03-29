# Coding Conventions

**Analysis Date:** 2026-03-28

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `StatsDashboard.tsx`, `Navigation.tsx`, `CardStack.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Types: PascalCase (e.g., `types.ts`)

**Functions:**
- camelCase for utility functions (e.g., `cn()` in `src/lib/utils.ts`)
- Components are arrow functions assigned to PascalCase variables

**Variables:**
- camelCase for local variables and state
- Use descriptive names: `activeTab`, `currentIndex`, `lastAction`

**Types/Interfaces:**
- PascalCase (e.g., `Email`, `Stats`, `User`, `StatsDashboardProps`)

## Code Style

**Formatting:**
- No explicit prettier/eslint config found - relies on defaults
- TailwindCSS 4 for styling
- Custom font families: `font-headline`, `font-label` (defined in CSS)

**Linting:**
- Tool: TypeScript compiler (`tsc --noEmit`)
- Script: `"lint": "tsc --noEmit"` in `package.json`

## Import Organization

**Order:**
1. React imports: `import React from 'react';`
2. External libraries: `import { BarChart, ... } from 'recharts';`, `import { motion, ... } from 'motion/react';`
3. Internal types: `import { Email, Stats, User } from '../types';`
4. Internal utilities: `import { cn } from '../lib/utils';`

**Path Aliases:**
- Configured in `tsconfig.json`:
  ```json
  "paths": {
    "@/*": ["./*"]
  }
  ```
- Currently using relative paths in practice (`../types`, `../lib/utils`)

## TypeScript Usage

**Explicit Typing:**
- Props interfaces defined separately above components
- Example from `src/components/StatsDashboard.tsx`:
  ```typescript
  interface StatsDashboardProps {
    stats: Stats;
    onStartSession: () => void;
  }

  export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, onStartSession }) => {
  ```

**Type Imports:**
- Use `import { type ClassValue } from "clsx"` for type-only imports

**Generic Types:**
- Minimal usage - simple prop typing preferred

## Component Patterns

**Structure:**
- Props interface above component
- Arrow function with `React.FC<PropsType>` return type
- Destructured props
- Single return statement with JSX

**Example:**
```typescript
interface CardStackProps {
  emails: Email[];
  onAction: (emailId: string, action: 'delete' | 'skip', emailData: Email) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export const CardStack: React.FC<CardStackProps> = ({ emails, onAction, onUndo, canUndo }) => {
  // component body
};
```

**Nested Components:**
- Define smaller components in same file after main component
- Example: `EmailCard` defined after `CardStack` in `src/components/CardStack.tsx`

## Styling Conventions

**TailwindCSS 4:**
- Use utility classes for all styling
- Custom design tokens: `bg-background`, `text-primary`, `font-headline`, `font-label`
- Motion animations: `animate-in fade-in slide-in-from-bottom-4`

**Conditional Classes:**
- Use `cn()` utility from `src/lib/utils.ts`
- Pattern: `cn("base classes", condition && "conditional classes")`

**Example:**
```typescript
className={cn(
  "absolute inset-0 glass-card vibrant-glow p-8 rounded-3xl flex flex-col justify-between cursor-grab active:cursor-grabbing",
  !isTop && "pointer-events-none"
)}
```

## Function Design

**Size:** Components are moderately sized (100-200 lines), single-purpose

**Parameters:**
- Destructured in component signature
- Callback props typed explicitly

**Return Values:**
- JSX elements
- Some components return null or alternate content based on state

## Error Handling

**Patterns:**
- Try-catch for async operations
- Console.error for logging failures
- Example from `src/App.tsx`:
  ```typescript
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };
  ```

**State-Based UI:**
- Loading states with boolean flags
- Conditional rendering for error/auth states

## State Management

**React Hooks:**
- `useState` for local component state
- `useEffect` for side effects (data fetching)
- `useCallback` for memoized callbacks (not heavily used)

**Pattern:**
```typescript
const [activeTab, setActiveTab] = useState<'inbox' | 'stats'>('inbox');
const [user, setUser] = useState<User | null>(null);
```

## Comments

**When to Comment:**
- Minimal inline comments
- Occasional explanatory comments for complex logic
- Example: `// Optimistic UI` comment in `src/App.tsx`

**JSDoc/TSDoc:**
- Not extensively used

---

*Convention analysis: 2026-03-28*
