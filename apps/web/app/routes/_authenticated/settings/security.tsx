import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/security")({
	component: SecuritySettingsPage,
});

function SecuritySettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Security</CardTitle>
				<CardDescription>Configure authentication and access policies.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between rounded-lg border p-4">
					<div>
						<p className="font-medium">Require sign-in for chat</p>
						<p className="text-sm text-muted-foreground">
							All chat routes require an active Clerk session.
						</p>
					</div>
					<Button variant="outline" disabled>
						Enabled
					</Button>
				</div>
				<div className="flex items-center justify-between rounded-lg border p-4">
					<div>
						<p className="font-medium">Plugin sandboxing</p>
						<p className="text-sm text-muted-foreground">
							Third-party plugins run in a restricted context.
						</p>
					</div>
					<Button variant="outline" disabled>
						Coming Soon
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
