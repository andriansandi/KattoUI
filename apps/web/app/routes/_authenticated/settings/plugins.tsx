import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/plugins")({
	component: PluginsSettingsPage,
});

const plugins = [
	{
		id: "hello-world",
		name: "Hello World",
		version: "0.1.0",
		status: "active",
	},
];

function PluginsSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Plugins</CardTitle>
				<CardDescription>Manage installed plugins and permissions.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{plugins.map((plugin) => (
						<div
							key={plugin.id}
							className="flex items-center justify-between rounded-lg border p-4"
						>
							<div>
								<p className="font-medium">{plugin.name}</p>
								<p className="text-sm text-muted-foreground">v{plugin.version}</p>
							</div>
							<div className="flex items-center gap-3">
								<Badge variant={plugin.status === "active" ? "default" : "outline"}>
									{plugin.status}
								</Badge>
								<Button size="sm" variant="outline">
									Configure
								</Button>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
