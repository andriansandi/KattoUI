import { themes } from "@katto/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { ThemeSwitcher } from "~/components/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/themes")({
	component: ThemesSettingsPage,
});

function ThemesSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Themes</CardTitle>
				<CardDescription>
					Choose from built-in themes. External themes can be installed as plugins.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-4 sm:grid-cols-3">
					{themes.map((theme) => (
						<div key={theme.id} className="rounded-lg border p-4">
							<p className="font-medium">{theme.name}</p>
							<p className="text-sm text-muted-foreground">{theme.description}</p>
						</div>
					))}
				</div>
				<div>
					<p className="mb-2 block text-sm font-medium">Active Theme</p>
					<ThemeSwitcher />
				</div>
			</CardContent>
		</Card>
	);
}
