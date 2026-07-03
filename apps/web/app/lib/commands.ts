import type { CommandItem } from "@katto/sdk";
import { Bot, Palette, Settings, Sparkles } from "lucide-react";

export const coreCommands: CommandItem[] = [
	{
		id: "chat:new",
		label: "New Chat",
		shortLabel: "New Chat",
		icon: "Bot",
		keywords: ["new", "chat", "conversation"],
		group: "Chat",
		execute: (ctx) => {
			window.location.href = "/chat";
			ctx.closePalette();
		},
	},
	{
		id: "settings:open",
		label: "Open Settings",
		shortLabel: "Settings",
		icon: "Settings",
		keywords: ["settings", "preferences", "config"],
		group: "Application",
		execute: (ctx) => {
			window.location.href = "/settings/appearance";
			ctx.closePalette();
		},
	},
	{
		id: "theme:switch",
		label: "Switch Theme",
		shortLabel: "Switch Theme",
		icon: "Palette",
		keywords: ["theme", "dark", "light", "appearance"],
		group: "Application",
		execute: (ctx) => {
			window.location.href = "/settings/appearance";
			ctx.closePalette();
		},
	},
	{
		id: "providers:open",
		label: "Switch Provider",
		shortLabel: "Switch Provider",
		icon: "Sparkles",
		keywords: ["provider", "model", "ai"],
		group: "Application",
		execute: (ctx) => {
			window.location.href = "/settings/providers";
			ctx.closePalette();
		},
	},
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	Bot,
	Settings,
	Palette,
	Sparkles,
};

export function getCommandIcon(name?: string) {
	return name ? iconMap[name] : undefined;
}
