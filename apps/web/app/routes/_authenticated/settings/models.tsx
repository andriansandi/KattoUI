import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/models")({
	component: ModelsSettingsPage,
});

const models = [
	{
		id: "gpt-4o",
		name: "GPT-4o",
		provider: "OpenAI",
		capabilities: ["chat", "vision", "tools"],
	},
	{
		id: "claude-3-5",
		name: "Claude 3.5 Sonnet",
		provider: "Anthropic",
		capabilities: ["chat", "vision", "tools"],
	},
	{
		id: "llama-3-1",
		name: "Llama 3.1",
		provider: "Meta",
		capabilities: ["chat"],
	},
];

function ModelsSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Models</CardTitle>
				<CardDescription>Manage available models across providers.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{models.map((model) => (
						<div key={model.id} className="flex items-center justify-between rounded-lg border p-4">
							<div>
								<p className="font-medium">{model.name}</p>
								<p className="text-sm text-muted-foreground">{model.provider}</p>
							</div>
							<div className="flex gap-2">
								{model.capabilities.map((cap) => (
									<Badge key={cap} variant="secondary">
										{cap}
									</Badge>
								))}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
