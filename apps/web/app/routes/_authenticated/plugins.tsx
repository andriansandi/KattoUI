import { createFileRoute } from "@tanstack/react-router";
import { Blocks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/plugins")({
	component: PluginsPage,
});

function PluginsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Plugins</h1>
				<p className="text-muted-foreground">Discover and manage plugins for KattoUI.</p>
			</div>
			<Card>
				<CardHeader>
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Blocks className="h-5 w-5" />
					</div>
					<CardTitle>Plugin Marketplace</CardTitle>
					<CardDescription>
						The marketplace is under construction. In the meantime, you can explore the plugin SDK
						in <code>packages/sdk</code>.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Plugins can register pages, commands, sidebar items, providers, themes, and settings.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
