import { createFileRoute } from "@tanstack/react-router";
import { ThemeSwitcher } from "~/components/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/appearance")({
	component: AppearanceSettingsPage,
});

function AppearanceSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Appearance</CardTitle>
				<CardDescription>Customize the look and feel of KattoUI.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div>
					<p className="mb-2 block text-sm font-medium">Theme</p>
					<ThemeSwitcher />
				</div>
			</CardContent>
		</Card>
	);
}
