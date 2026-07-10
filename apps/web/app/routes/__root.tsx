import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import "@katto/design-system/styles/themes.css";
import "~/styles/animations.css";
import "~/styles/markdown.css";
import { CommandPalette } from "~/components/command-palette";
import { KeyboardRegistryProvider } from "~/lib/keyboard-registry";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "KattoUI — The purr-fect interface for every LLM. 🐈" },
			{
				name: "description",
				content:
					"KattoUI is a Cloudflare-first, self-hostable AI chat interface built for professionals.",
			},
		],
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			<KeyboardRegistryProvider>
				<Outlet />
				<CommandPalette />
			</KeyboardRegistryProvider>
		</RootDocument>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="overflow-hidden">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
