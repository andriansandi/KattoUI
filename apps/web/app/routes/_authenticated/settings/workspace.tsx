import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/_authenticated/settings/workspace")({
	component: WorkspaceSettingsPage,
});

function WorkspaceSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Workspace</CardTitle>
				<CardDescription>Manage workspace details and members.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<label htmlFor="workspace-name" className="mb-2 block text-sm font-medium">
						Workspace Name
					</label>
					<Input id="workspace-name" defaultValue="Personal" />
				</div>
				<div>
					<label htmlFor="default-model" className="mb-2 block text-sm font-medium">
						Default Model
					</label>
					<Input id="default-model" defaultValue="gpt-4o" />
				</div>
				<Button>Save Changes</Button>
			</CardContent>
		</Card>
	);
}
