import { createFileRoute } from "@tanstack/react-router";
import { SquareTerminal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/prompts")({
	component: PromptsPage,
});

function PromptsPage() {
	return (
		<div className="h-full overflow-y-auto p-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Prompt Library</h1>
					<p className="text-muted-foreground">Save and reuse your favorite prompts.</p>
				</div>
				<Card>
					<CardHeader>
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<SquareTerminal className="h-5 w-5" />
						</div>
						<CardTitle>Coming Soon</CardTitle>
						<CardDescription>
							Prompt versioning, categorization, and sharing will be available in a future release.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button>Create Prompt</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
