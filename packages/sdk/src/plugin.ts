import type { CommandItem } from "./command.js";
import type { ProviderAdapter, ProviderMetadata } from "./provider.js";
import type { ThemeDefinition } from "./theme.js";

/** A route or page registered by a plugin. */
export interface PluginPage {
	path: string;
	component: unknown;
	title?: string;
	icon?: string;
}

/** A sidebar navigation entry registered by a plugin. */
export interface PluginSidebarItem {
	id: string;
	label: string;
	path?: string;
	icon?: string;
	parentId?: string;
}

/** A toolbar action registered by a plugin. */
export interface PluginToolbarAction {
	id: string;
	label: string;
	icon?: string;
	shortcut?: string;
	handler: () => void | Promise<void>;
}

/** A settings panel registered by a plugin. */
export interface PluginSettingsPanel {
	id: string;
	label: string;
	section:
		| "appearance"
		| "models"
		| "providers"
		| "workspace"
		| "security"
		| "plugins"
		| "advanced";
	component: unknown;
}

/** Hook lifecycle exposed by a plugin. */
export interface PluginHooks {
	onRegister?(): void | Promise<void>;
	onUnload?(): void | Promise<void>;
}

/** Manifest describing a plugin. */
export interface PluginManifest {
	id: string;
	name: string;
	version: string;
	description?: string;
	author?: string;
	homepage?: string;
	permissions?: PluginPermission[];
	pages?: PluginPage[];
	sidebarItems?: PluginSidebarItem[];
	commands?: CommandItem[];
	toolbarActions?: PluginToolbarAction[];
	settingsPanels?: PluginSettingsPanel[];
	providers?: ProviderMetadata[];
	themes?: ThemeDefinition[];
	hooks?: PluginHooks;
}

/** Plugin permission levels. */
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

/** Runtime plugin instance produced from a manifest. */
export interface Plugin {
	manifest: PluginManifest;
	activate(ctx: PluginContext): void | Promise<void>;
	deactivate?(): void | Promise<void>;
}

/** Context passed to a plugin during activation. */
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
