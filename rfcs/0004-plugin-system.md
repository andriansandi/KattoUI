# RFC 0004: KattoUI Plugin System

| Field | Value |
|-------|-------|
| Status | Draft |
| Authors | KattoUI Core Team |
| Created | 2026-07-02 |
| Updated | 2026-07-02 |
| Related | RFC 0001, RFC 0003, RFC 0002 |

## Summary

This RFC defines the KattoUI plugin system. Plugins are installable extensions that contribute pages, commands, sidebar items, providers, themes, settings panels, and MCP servers through a declarative manifest. Plugins run with explicit permissions and go through a clear lifecycle: discovery, validation, installation, activation, runtime, and uninstallation. The system is designed to remain secure and stable without sandboxing every plugin in a separate process on day one.

## Motivation

No single application can anticipate every integration users will want. Plugins allow third-party developers to extend KattoUI without forking the codebase. A well-defined plugin SDK also keeps the core small: built-in features are themselves authored as internal plugins.

## Terminology

| Term | Definition |
|------|------------|
| **Plugin** | A package or module that extends KattoUI via the plugin SDK. |
| **Manifest** | The static declaration of a plugin's metadata and capabilities. |
| **Capability** | A category of contribution: page, command, sidebar item, provider, theme, setting, MCP server. |
| **Permission** | An explicit declaration of what a plugin is allowed to access. |
| **Plugin SDK** | The TypeScript API exported by `packages/sdk` for plugin authors. |
| **Registry** | A runtime collection of installed and active plugins. |
| **MCP Server** | A Model Context Protocol server exposing tools/resources/prompts that agents can invoke. |

## Proposal

### 1. Plugin Manifest

Every plugin exports a manifest conforming to the SDK contract:

```ts
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  // URL to plugin homepage or source.
  homepage?: string;
  // Required permissions.
  permissions: PluginPermission[];
  // Capabilities contributed by the plugin.
  capabilities: {
    pages?: PageContribution[];
    commands?: CommandContribution[];
    sidebarItems?: SidebarItemContribution[];
    providers?: ProviderAdapter[];
    themes?: Theme[];
    settings?: SettingContribution[];
    mcpServers?: McpServerContribution[];
  };
  // Optional lifecycle hooks.
  activate?: (ctx: PluginContext) => void | Promise<void>;
  deactivate?: (ctx: PluginContext) => void | Promise<void>;
}
```

### 2. Capabilities

#### 2.1 Pages

Plugins register routes that TanStack Router mounts under a plugin namespace:

```ts
interface PageContribution {
  id: string;
  title: string;
  path: string; // mounted at /plugins/:pluginId/:path
  component: ComponentType;
  icon?: string;
}
```

#### 2.2 Commands

Commands appear in the command palette:

```ts
interface CommandContribution {
  id: string;
  title: string;
  shortcut?: string;
  keywords?: string[];
  perform: () => void | Promise<void>;
}
```

#### 2.3 Sidebar Items

Sidebar items link to plugin pages or external URLs:

```ts
interface SidebarItemContribution {
  id: string;
  title: string;
  to?: string;
  href?: string;
  icon?: string;
  section?: "chat" | "library" | "settings" | string;
}
```

#### 2.4 Providers and Themes

Provider adapters and themes are registered directly from the manifest. They follow the contracts defined in RFC 0003 and RFC 0002.

#### 2.5 Settings Panels

Plugins can add panels to the settings page:

```ts
interface SettingContribution {
  id: string;
  title: string;
  component: ComponentType;
}
```

#### 2.6 MCP Servers

Plugins may declare MCP servers that the chat core can invoke as tools:

```ts
interface McpServerContribution {
  id: string;
  name: string;
  transport: "stdio" | "sse";
  // For stdio: command + args. For sse: URL.
  connection: StdioConnection | SseConnection;
}
```

### 3. Permissions

Permissions are declarative and reviewed before activation:

```ts
type PluginPermission =
  | "provider:register"
  | "theme:register"
  | "command:register"
  | "sidebar:register"
  | "settings:register"
  | "storage:read"
  | "storage:write"
  | "network:fetch"
  | "mcp:connect"
  | "ui:notification";
```

Core refuses to load a capability if the plugin has not declared the matching permission. The settings UI lists requested permissions before installation.

### 4. Plugin Lifecycle

```
Discovery
   │
   ▼
Validation (manifest schema, permissions, capability contracts, signature if provided)
   │
   ▼
Installation (copy to storage / register in KV)
   │
   ▼
Activation (run `activate` hook, register capabilities)
   │
   ▼
Runtime (commands, pages, providers available)
   │
   ▼
Deactivation (run `deactivate` hook, unregister capabilities)
   │
   ▼
Uninstallation (remove from storage, clean persisted data)
```

### 5. Packaging and Distribution

- Plugins are npm packages or plain JavaScript/TypeScript modules.
- Recommended package name convention: `katto-plugin-*`.
- Plugins export a default `createPlugin()` function returning `PluginManifest`.
- Core loads built-in plugins at build time and user-installed plugins at runtime from a configured directory or URL.

### 6. Security and Sandboxing

Phase 1 (initial):

- Manifest validation with Zod.
- Explicit permission model.
- Code review for built-in plugins; warnings for third-party plugins.
- No `eval`, dynamic `import()` from remote URLs, or inline scripts.

Phase 2 (future):

- Optional sandboxed execution via Cloudflare Workers Sandbox SDK or a separate isolated Worker.
- Code signing for verified plugins.
- Allowlist for network targets.

### 7. Plugin Context

The `PluginContext` passed to hooks contains safe accessors only:

```ts
interface PluginContext {
  logger: Logger;
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  fetch: typeof fetch;
  registerCommand: (command: CommandContribution) => void;
  // ... scoped registries
}
```

Plugins never receive direct access to the global `env`, D1, or other bindings unless a specific permission and binding grant is declared.

## Drawbacks

1. A declarative permission model cannot fully prevent malicious code from abusing allowed capabilities.
2. Runtime plugin loading complicates bundling and server-side rendering.
3. MCP server lifecycle (especially stdio processes) is hard to manage inside a Worker and may require external hosting.

## Alternatives

| Alternative | Why not chosen |
|-------------|----------------|
| Hard-code all integrations | Defeats self-hostability and long-term extensibility. |
| Micro-frontend architecture | Adds complexity without improving security in Phase 1; TanStack Router apps integrate more naturally with component-based plugins. |
| Full process isolation from day one | Cloudflare Workers constraints make traditional process isolation expensive; the phased security model is pragmatic. |

## Adoption

1. Define `PluginManifest`, permissions, capabilities, and lifecycle in `packages/sdk`.
2. Implement the `PluginRegistry` and context factories in `apps/web` and `apps/api`.
3. Convert existing core features (chat, settings, model selector) into internal plugins as proofs of concept.
4. Document a hello-world plugin in the repository.
5. Add plugin management UI: install, enable/disable, uninstall, permission review.
