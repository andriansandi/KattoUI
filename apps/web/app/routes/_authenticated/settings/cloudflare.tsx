import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/_authenticated/settings/cloudflare")({
	component: CloudflareSettingsPage,
});

function CloudflareSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Cloudflare</CardTitle>
				<CardDescription>Manage Cloudflare services integration.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<label htmlFor="cf-account-id" className="mb-2 block text-sm font-medium">
						Account ID
					</label>
					<Input id="cf-account-id" placeholder="your-account-id" />
				</div>
				<div>
					<label htmlFor="cf-gateway" className="mb-2 block text-sm font-medium">
						AI Gateway Endpoint
					</label>
					<Input id="cf-gateway" placeholder="https://gateway.ai.cloudflare.com/v1/..." />
				</div>
				<div className="flex gap-2">
					<Button>Save</Button>
					<Button variant="outline">Test Connection</Button>
				</div>
			</CardContent>
		</Card>
	);
}
