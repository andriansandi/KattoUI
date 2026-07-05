import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/cn";
import { useUIStore } from "~/stores/ui-store";

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsLayout,
});

const settingsPages = [
	{ to: "/settings/appearance", label: "Appearance" },
	{ to: "/settings/providers", label: "Providers" },
	{ to: "/settings/cloudflare", label: "Cloudflare" },
	{ to: "/settings/workspace", label: "Workspace" },
	{ to: "/settings/api-keys", label: "API Keys" },
	{ to: "/settings/security", label: "Security" },
	{ to: "/settings/plugins", label: "Plugins" },
	{ to: "/settings/themes", label: "Themes" },
	{ to: "/settings/about", label: "About" },
];

function SettingsLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

	return (
		<div className="h-full overflow-y-auto p-6">
			<div className="mx-auto max-w-5xl space-y-6">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileSidebar}>
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle sidebar</span>
					</Button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
						<p className="text-muted-foreground">Manage your workspace, models, and preferences.</p>
					</div>
				</div>
				<div className="flex flex-col gap-6 lg:flex-row">
					<nav className="w-full shrink-0 lg:w-56">
						<div className="space-y-1">
							{settingsPages.map((page) => {
								const active = pathname === page.to || pathname.startsWith(`${page.to}/`);
								return (
									<Link
										key={page.to}
										to={page.to}
										className={cn(
											"block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
											active
												? "bg-primary/10 text-primary"
												: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
										)}
									>
										{page.label}
									</Link>
								);
							})}
						</div>
					</nav>
					<div className="min-w-0 flex-1">
						<Outlet />
					</div>
				</div>
			</div>
		</div>
	);
}
