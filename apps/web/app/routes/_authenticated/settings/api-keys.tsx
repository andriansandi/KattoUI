import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/_authenticated/settings/api-keys")({
	component: ApiKeysSettingsPage,
});

function ApiKeysSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>API Keys</CardTitle>
				<CardDescription>
					Provider API keys are stored securely and never exposed to the browser.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<label htmlFor="openai-key" className="mb-2 block text-sm font-medium">
						OpenAI API Key
					</label>
					<Input id="openai-key" type="password" placeholder="sk-..." />
				</div>
				<div>
					<label htmlFor="anthropic-key" className="mb-2 block text-sm font-medium">
						Anthropic API Key
					</label>
					<Input id="anthropic-key" type="password" placeholder="sk-ant-..." />
				</div>
				<Button>Save Keys</Button>
			</CardContent>
		</Card>
	);
}
