import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/about")({
	component: AboutSettingsPage,
});

function AboutSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>About KattoUI</CardTitle>
				<CardDescription>The Open Source AI Workspace built for Cloudflare.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 text-sm text-muted-foreground">
				<p>
					<strong className="text-foreground">Version:</strong> 0.1.0
				</p>
				<p>
					<strong className="text-foreground">License:</strong> MIT
				</p>
				<p>Built with React 19, TanStack Start, Tailwind CSS v4, and Cloudflare Workers.</p>
				<p>KattoUI is a cat-inspired brand with a professional, minimal interface.</p>
			</CardContent>
		</Card>
	);
}
