# KattoUI Plugin System

KattoUI is designed to be extended without forking the codebase. The plugin system lets third-party code register pages, commands, sidebar items, providers, themes, settings panels, toolbar actions, and lifecycle hooks. The host application remains in control of permissions and activation.

---

## Responsibilities

The plugin system lives in `packages/sdk/src/plugin.ts`. It defines:

- **Manifest** — what the plugin says it is.
- **Permissions** — what privileges the plugin requests.
- **Context** — what capabilities the host exposes at runtime.
- **Lifecycle** — activation and deactivation hooks.

The host (`apps/web`) implements the context and enforces permissions. Plugins never modify the host directly; they register capabilities through the context.

---

## Registration surface

A plugin manifest can declare the following surfaces:

### Pages and sidebar items

```ts
pages: [
  { path: "/plugins/my-plugin", component: MyPluginPage, title: "My Plugin", icon: "sparkles" }
],
sidebarItems: [
  { id: "my-plugin", label: "My Plugin", path: "/plugins/my-plugin", icon: "sparkles" }
]
```

### Commands

Plugins add searchable actions to the command palette:

```ts
commands: [
  {
    id: "my-plugin:open",
    label: "Open My Plugin",
    shortcut: "ctrl+shift+m",
    execute(ctx) { /* ... */ }
  }
]
```

### Toolbar actions

Toolbar buttons can be registered with handlers:

```ts
toolbarActions: [
  { id: "my-plugin:action", label: "Run Analysis", icon: "zap", handler: async () => { /* ... */ } }
]
```

### Settings panels

Plugins can contribute panels inside Settings:

```ts
settingsPanels: [
  { id: "my-plugin", label: "My Plugin", section: "plugins", component: MyPluginSettings }
]
```

### Providers and themes

Plugins can register `ProviderAdapter` and `ThemeDefinition` objects at runtime:

```ts
providers: [myProviderMetadata],
themes: [myThemeDefinition],
```

### Lifecycle hooks

```ts
hooks: {
  onRegister() { /* runs once when manifest is first accepted */ },
  onUnload() { /* runs when plugin is disabled */ }
}
```

---

## Plugin context

During activation, a plugin receives a `PluginContext`:

```ts
export interface PluginContext {
  registerProvider(adapter: ProviderAdapter): void;
  registerCommand(command: CommandItem): void;
  registerSidebarItem(item: PluginSidebarItem): void;
  registerSettingsPanel(panel: PluginSettingsPanel): void;
  registerTheme(theme: ThemeDefinition): void;
  getFlag(key: string): boolean | string | undefined;
  readStorage<T>(key: string): Promise<T | undefined>;
  writeStorage<T>(key: string, value: T): Promise<void>;
}
```

The host may throw if the plugin lacks permission for a given registration.

---

## Permissions

Every plugin declares what it needs:

```ts
export type PluginPermission =
  | "providers:register"
  | "themes:register"
  | "commands:register"
  | "sidebar:register"
  | "settings:register"
  | "storage:read"
  | "storage:write"
  | "network:fetch"
  | "mcp:server";
```

The host does not silently grant permissions. A user-facing installation prompt summarizes the request. The host must reject or sandbox calls that exceed granted permissions.

---

## Example manifest

```ts
import type { PluginManifest } from "@katto/sdk";
import { MyPluginPage } from "./page";
import { myProvider } from "./provider";
import { amberTheme } from "./theme";

export const manifest: PluginManifest = {
  id: "acme.analyzer",
  name: "Acme Code Analyzer",
  version: "1.2.0",
  description: "Analyzes chat code blocks and suggests refactorings.",
  author: "Acme Corp",
  homepage: "https://acme.example/katto-plugin",
  permissions: [
    "commands:register",
    "sidebar:register",
    "settings:register",
    "storage:read",
    "storage:write",
  ],
  pages: [
    { path: "/plugins/acme-analyzer", component: MyPluginPage, title: "Analyzer", icon: "scan" },
  ],
  sidebarItems: [
    { id: "acme-analyzer", label: "Analyzer", path: "/plugins/acme-analyzer", icon: "scan" },
  ],
  commands: [
    {
      id: "acme-analyzer:scan",
      label: "Scan Current Conversation",
      shortcut: "ctrl+shift+a",
      execute(ctx) {
        // scanning logic
      },
    },
  ],
  settingsPanels: [
    { id: "acme-analyzer", label: "Acme Analyzer", section: "plugins", component: MyPluginPage },
  ],
  hooks: {
    onRegister() {
      console.log("Acme Analyzer registered");
    },
    onUnload() {
      console.log("Acme Analyzer unloaded");
    },
  },
};
```

---

## Lifecycle

1. **Discovery** — the host finds plugin manifests (built-in, from marketplace, or user-uploaded).
2. **Validation** — the host validates the manifest schema with Zod.
3. **Permission prompt** — the host presents requested permissions.
4. **Activation** — the host calls `plugin.activate(ctx)`, which registers capabilities through the context.
5. **Runtime** — registered capabilities behave like first-class features.
6. **Deactivation** — when disabled, the host calls `plugin.deactivate()` and unregisters capabilities.

---

## Security and sandboxing

Plugins are powerful, so the host must treat them as untrusted code.

- **Permission enforcement.** Every context method checks the manifest permissions before acting.
- **Manifest validation.** Schemas must be strict; unknown fields are rejected or ignored.
- **Network isolation.** If plugins fetch remote resources, URLs should be allow-listed or require explicit user consent.
- **Storage namespacing.** Plugin storage is keyed per plugin to prevent cross-plugin data leaks.
- **Code execution.** Remote plugin code should be loaded inside a sandboxed iframe or Web Worker where feasible.
- **Audit trail.** Activation, permission grants, and network calls should be logged through the structured `Logger` abstraction.

The exact sandboxing strategy will be finalized before the plugin marketplace ships in Phase 7.

---

## Future surface

Planned additions include:

- MCP server contribution
- Agent definitions
- Custom message renderers
- File-type handlers
