import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/providers")({
	component: ProvidersSettingsPage,
});

const providers = [
	{ id: "openai", name: "OpenAI", status: "connected" },
	{ id: "anthropic", name: "Anthropic", status: "disconnected" },
	{ id: "cloudflare", name: "Cloudflare AI", status: "disconnected" },
];

function ProvidersSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Providers</CardTitle>
				<CardDescription>Connect AI providers to start chatting.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{providers.map((provider) => (
						<div
							key={provider.id}
							className="flex items-center justify-between rounded-lg border p-4"
						>
							<div>
								<p className="font-medium">{provider.name}</p>
								<p className="text-sm text-muted-foreground">ID: {provider.id}</p>
							</div>
							<div className="flex items-center gap-3">
								<Badge variant={provider.status === "connected" ? "default" : "outline"}>
									{provider.status}
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
