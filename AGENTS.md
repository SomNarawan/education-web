# Project Instructions

## Project overview

This repository is a frontend for an education/student information system.

- Runtime: React 19 with TypeScript
- Build tool: Vite 8
- UI library: Ant Design 6 and `@ant-design/icons`
- Routing: React Router 7
- HTTP client: the shared Axios instance in `src/config/axios.ts`
- Date handling: Day.js
- Package manager: npm (`package-lock.json` is committed)
- Backend URL: `VITE_API_URL`, currently expected to point to an API whose
  responses usually have the shape `{ success, message, data }`

`@tanstack/react-query`, React Hook Form, Zod, and their resolver are installed,
but the current application does not use them. Do not introduce a second data or
form pattern solely because these packages are available. Adopt one only when a
task specifically benefits from it and keep the change internally consistent.

## Commands

Run commands from the repository root.

```sh
npm run dev
npm run lint
npm run build
npm run preview
```

Before handing off a code change, run `npm run lint` and `npm run build`.
There is currently no automated test framework. For behavior that cannot be
covered by the existing checks, describe the manual verification performed.

## Source structure

- `src/pages/`: route-level screens and their orchestration
- `src/components/`: reusable or feature-level UI components
- `src/components/custom/`: generic application UI primitives
- `src/layouts/`: shared page shells rendered around nested routes
- `src/context/`: application-wide React context, currently authentication
- `src/services/`: API calls and request parameter construction
- `src/config/axios.ts`: the only configured Axios client
- `src/types/`: shared request and response types
- `src/assets/`: imported static assets
- `src/styles.css`: active global application styles imported by `main.tsx`

Keep network calls out of presentational components when practical. Add API
operations to a domain service and reusable data contracts to `src/types/`.
Keep route declarations centralized in `src/App.tsx`.

## TypeScript and React conventions

- Use function components and hooks.
- Use PascalCase for component files and exported components, camelCase for
  functions and variables, and descriptive domain names for types.
- Prefer explicit interfaces/types for component props, API payloads, and
  non-trivial local data structures.
- Use `import type` for type-only imports.
- Do not use `any` to bypass the compiler. Narrow `unknown` values or model the
  contract properly.
- Preserve strict compiler expectations: unused locals/parameters and switch
  fallthroughs are build errors.
- Keep derived values out of state; calculate them directly or with `useMemo`
  when the calculation or referential stability warrants it.
- Wrap async callbacks in `useCallback` only when they are dependencies or are
  passed where stable identity matters. Keep hook dependency arrays complete.
- Use early returns for loading, invalid-route, and authorization states.
- Follow the formatting of the file being edited. The established code uses
  single quotes, no semicolons, and trailing commas in multiline constructs.
- Avoid broad refactors while implementing a focused feature or fix.

## UI and forms

- Prefer Ant Design components and existing application components over custom
  replacements.
- Existing forms use Ant Design `Form`, `Form.Item` rules, and
  `form.validateFields()`.
- Use `message.success`, `message.warning`, and `message.error` for short user
  feedback. Log the underlying error for diagnostics without exposing tokens or
  sensitive student data.
- User-facing copy is primarily Thai. Preserve Thai text as UTF-8 and match the
  language of the surrounding screen.
- Use Day.js objects for Ant Design date controls, and convert them to the API's
  primitive representation at the form/service boundary.
- Reuse layout classes in `src/styles.css`; use responsive Ant Design grid props
  or the existing `768px` breakpoint for new responsive behavior.
- Keep accessibility basics intact: meaningful labels, image alt text, keyboard
  behavior, and visible loading/disabled states.

## API conventions

- Always call the API through the default export from `src/config/axios.ts`.
  Do not create ad hoc Axios instances or repeat the base URL.
- The interceptor reads `auth_token` from local storage and adds the Bearer
  header. Never manually append this token in individual services.
- Put endpoint-specific functions in `src/services/*Service.ts`.
- Type responses with `ApiResponse<T>` when the endpoint follows the standard
  envelope, and return `response.data.data` from the service so UI code receives
  domain data.
- Keep backend field names in their API form. Current payloads use snake_case,
  while authentication state maps selected fields to camelCase for frontend use.
- Build optional query parameters deliberately. Trim text input and omit empty
  values rather than sending ambiguous query strings.
- Handle loading with `try/catch/finally` so loading state is reset on both
  success and failure.
- Fetch independent lookup collections concurrently with `Promise.all`.

## Authentication, authorization, and routes

Authentication state lives in `AuthContext` and is persisted with these local
storage keys:

- `auth_token`
- `auth_user`
- `current_role`

The callback route receives a token from `/auth/callback?token=...`, then `/me`
hydrates the user and roles. Supported application roles are currently `admin`
and `teacher`.

Student routes use these URL groups:

- `advisor`: teacher only
- `department`: teacher and admin
- `faculty`: teacher and admin

Route access is enforced by `StudentRouteGuard` and `ProtectedRoute`; menu
visibility is only a presentation concern and is not sufficient authorization.
When adding a protected page, update the route guard/role mapping and menu
visibility together. Preserve the current detail-route shape and navigation
state used to restore the selected menu item.

Never weaken frontend guards, trust arbitrary route parameters, log auth tokens,
or place secrets in `VITE_*` variables. Vite environment variables are exposed
to the browser.

## Change discipline

- Inspect `git status` before editing and preserve unrelated user changes.
- Do not edit generated output (`dist/`) or dependencies (`node_modules/`).
- Do not commit `.env` secrets. If new configuration is needed, document the
  variable and provide a safe example value.
- Keep dependencies unchanged unless the task requires one. If dependencies
  change, update both `package.json` and `package-lock.json`.
- Maintain API compatibility unless the task explicitly includes a coordinated
  backend change.
- Do not claim a change is complete when lint or build fails; report whether the
  failure is introduced by the change or was already present.
