# Telehealth Booking & Consultation — Frontend (Micro-Frontend)

## Project Overview

React 19 micro-frontend built with TypeScript, Webpack Module Federation, MUI v7, Redux Toolkit, and TanStack Query. Runs exclusively inside a host application via `cs-ext-utils` — never standalone in production.

The extension provides a **provider directory** (with specialty/language filters), a **booking flow** (time-slot selection modal), and a **consultation room** (video session controls, notes, post-visit summary). The Python FastAPI backend lives in `../py/`.

## Tech Stack

| Tool | Purpose |
| --- | --- |
| **React 19** | UI library |
| **TypeScript** | Strict typing |
| **Webpack 5** | Bundler + Module Federation |
| **MUI v7** | Component library (theme provided by host) |
| **Redux Toolkit** | State slices injected into host store |
| **TanStack Query v5** | Server-state management |
| **react-i18next** | Translations registered with host |
| **Formik + Yup** | Form state and validation |
| **cs-ext-utils** | Host bridge — axios, store, theme, toast, i18n |
| **Biome** | Unified linter + formatter (replaces ESLint + Prettier) |
| **Tailwind CSS v4** | Utility classes via PostCSS (supplement to MUI `sx`) |

## Project Structure

```
web/
├── src/
│   ├── api/
│   │   ├── calls/          # Raw API call functions (use extensionManager.getExtAxios())
│   │   └── transforms/     # Data transformers / mappers
│   ├── assets/             # Static files (images, fonts)
│   ├── components/
│   │   ├── ui/             # Shared atomic components (LoadingSpinner, EmptyState, ErrorBoundary…)
│   │   └── [Feature]/      # Feature-level components (PascalCase folder)
│   ├── containers/         # Smart components — orchestrate state, API, and feature components
│   ├── contexts/           # React contexts scoped to a feature
│   ├── hooks/              # Custom hooks
│   ├── locales/            # i18n JSON translation files
│   ├── slice/              # Redux Toolkit slices (injected into host store)
│   ├── types/              # TypeScript types and interfaces
│   └── utils/              # Pure utility/helper functions
├── .agents/
│   ├── rules/              # Always-on agent rules
│   └── skills/             # On-demand skill guides
├── webpack/                # webpack.common / webpack.dev / webpack.prod
├── env/                    # .env.development / .env.production
├── biome.json              # Linter + formatter config
└── tsconfig.json
```

## Architecture Rules

### Micro-Frontend Constraints (CRITICAL)

This application is **never** the root application. It is mounted by a host.

| Concern | Rule |
| --- | --- |
| **HTTP / Axios** | NEVER use `fetch` or instantiate a new Axios client. Use `extensionManager.getExtAxios()`. |
| **Redux** | NEVER render a `<Provider store={...}>`. Inject slices via `extensionManager.injectReducers()`. |
| **Theming** | NEVER call `createTheme()`. Wrap with `<ThemeProvider theme={extensionManager.getTheme()}>`. |
| **Toasts** | NEVER use `react-toastify`, `notistack`, or any local toast library. Use `extensionManager.toast()`. |
| **Routing** | NEVER use `<BrowserRouter>` or `<Routes>`. The host controls URLs; components are mounted directly. |

See `.agents/rules/micro-frontend-integration.md` for full details.

### Component vs Container

- **`src/components/ui/`** — stateless, reusable primitives (no API calls, no store access). Named exports.
- **`src/components/[Feature]/`** — feature components; may read context or accept props from a container.
- **`src/containers/`** — smart components; wire API, store, contexts, and feature components together. These are the components the host mounts.

Every container follows a three-layer pattern:

```tsx
// 1. Module-level — register translations once at import time
const ns = extensionManager.getNsForTranslation('myFeature');
extensionManager.registerTranslation(ns, translations);

// 2. Inner component — owns hooks, local state, and business logic
const MyFeatureInner: React.FC<InnerProps> = ({ id }) => {
  const { data, isLoading } = useMyData(id);
  if (isLoading) return <LoadingSpinner fullHeight label="Loading..." />;
  if (!data) return null;
  return <MyFeatureComponent ns={ns} data={data} />;
};

// 3. Container — wraps Inner with <App> (ThemeProvider + QueryClientProvider + ErrorBoundary)
const MyFeatureContainer: React.FC<ContainerProps> = ({ id }) => (
  <App>
    <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
      <MyFeatureInner id={id} />
    </Suspense>
  </App>
);

export default MyFeatureContainer;
```

Key rules:
- Translation registration is **always at module scope** (outside any component), so it runs once when the module is first imported.
- `<App>` is the only provider wrapper needed — never nest `ThemeProvider` or `QueryClientProvider` inside a container.
- `ErrorBoundary` lives inside `<App>` — do not add a second one around the inner component.

### Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Files & folders (non-component) | `camelCase` | `userProfile.ts`, `extension.ts` |
| React component folders | `PascalCase` | `ClinicalList/`, `PatientManagement/` |
| React component files | `PascalCase` | `index.tsx`, `PatientTable.tsx` |
| Exported functions | `camelCase` | `formatDate`, `getExtAxios` |
| Types / interfaces | `PascalCase` | `Patient`, `SortOrder` |
| Module-level constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |

### Import Order

Maintain three groups separated by blank lines:

```typescript
// 1. Third-party
import { useState } from 'react';
import { Box, Typography } from '@mui/material';

// 2. cs-ext-utils / monorepo-internal
import { extensionManager } from '@/utils/extension';

// 3. Local paths (alias-based)
import { formatDate } from '@/utils/helpers';
import type { Patient } from '@/types';
```

Use `type` imports for runtime-erased types. Use path aliases (`@/`) — never bare `../`.

Do **not** import `/index` explicitly; import the directory path.

## MUI & Styling

- **All styling via `sx` prop or `styled()`** — no `.css`, `.scss`, or `.module.css` files.
- Use `Stack`, `Box`, `Grid` for layout; `Typography` for all text (no raw `<p>`, `<h1>`).
- Theme tokens only: `primary.main`, `background.paper`, `text.secondary`, etc. No hardcoded hex values.
- Border radii and hover effects come from the host theme — do not override via `sx`.
- Icons from `@mui/icons-material`.

See `.agents/skills/mui-usage/SKILL.md` for patterns.

## State Management (Redux)

Slices live in `src/slice/`. Inject into host store at startup; do not wrap in a `<Provider>`.

```typescript
extensionManager.injectReducers({ mySlice: mySliceReducer }, [], ['mySlice']);
```

Use `useSelector` / `useDispatch` as normal — they connect to the host store automatically.

See `.agents/skills/inject-reducers/SKILL.md`.

## API Calls

All calls go through the shared Axios instance:

```typescript
const axios = extensionManager.getExtAxios();
const { data } = await axios.get('/api/v1/patients');
```

See `.agents/skills/use-shared-axios/SKILL.md`.

## Translations (i18n)

All user-facing text must be translated. No hardcoded strings in JSX.

```typescript
const ns = extensionManager.getNsForTranslation('myFeature');
extensionManager.registerTranslation(ns, translations);
```

See `.agents/skills/add-translations/SKILL.md`.

## Biome (Linting & Formatting)

Biome replaces ESLint and Prettier. Config lives in `biome.json`.

| Command | Description |
| --- | --- |
| `npm run check` | Lint + format check (CI gate) |
| `npm run check:fix` | Apply all safe auto-fixes |
| `npm run type-check` | TypeScript type check without emit |

Rules enforced: no `console.log`, no unused variables, consistent imports, single quotes, 2-space indent, 100-char line width, no trailing commas.

## TypeScript Standards

- Strict mode enabled — no implicit `any`. Prefer `unknown` over `any`.
- `const` by default; `let` only when reassignment is needed.
- Explicit return types on all exported functions.
- Prefix unused identifiers with `_`.
- `async/await` exclusively — no `.then()/.catch()` chains.

## Development Commands

| Command | Description |
| --- | --- |
| `npm start` | Dev server (Webpack + HMR) |
| `npm run build` | Production bundle |
| `npm run build:dev` | Dev bundle (no minification) |
| `npm run check` | Biome lint + format check |
| `npm run check:fix` | Biome lint + format with auto-fix |
| `npm run type-check` | TypeScript check without emit |

## Git & Commit Standards

Commit messages follow **Conventional Commits**:

```
<type>(<scope>): <short summary>
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`.

Pre-commit hook (via Lefthook) runs Biome check + TypeScript check automatically.

## Available Skills

| Skill | When to use |
| --- | --- |
| `.agents/skills/inject-reducers/` | Adding Redux state slices |
| `.agents/skills/use-shared-axios/` | Making API calls |
| `.agents/skills/add-translations/` | Adding i18n translations |
| `.agents/skills/mui-usage/` | Building or styling MUI components |
