import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/cn";
import { useUIStore } from "~/stores/ui-store";

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsLayout,
});

const settingsPages = [
	{ to: "/settings/providers", label: "Providers" },
	{ to: "/settings/about", label: "About" },
];

function SettingsLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

	return (
		<div className="flex h-full flex-col">
			<div className="flex h-14 flex-shrink-0 items-center gap-2 border-b px-4 md:hidden">
				<Button variant="ghost" size="icon" onClick={toggleMobileSidebar}>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle sidebar</span>
				</Button>
				<h1 className="text-sm font-semibold">Settings</h1>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
				<div className="space-y-4 md:space-y-6">
					<div className="hidden md:block">
						<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
						<p className="text-muted-foreground">Manage your providers and preferences.</p>
					</div>
					<div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
						<nav className="shrink-0 lg:w-56">
							<div className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
								{settingsPages.map((page) => {
									const active = pathname === page.to || pathname.startsWith(`${page.to}/`);
									return (
										<Link
											key={page.to}
											to={page.to}
											className={cn(
												"whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors lg:py-2",
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
		</div>
	);
}
