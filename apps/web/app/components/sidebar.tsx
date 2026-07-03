import { Link, useRouterState } from "@tanstack/react-router";
import { Blocks, MessageSquare, Settings, SquareTerminal } from "lucide-react";
import { KattoLogo } from "~/components/logo";
import { cn } from "~/lib/cn";

const navItems = [
	{ to: "/chat", icon: MessageSquare, label: "Chat" },
	{ to: "/prompts", icon: SquareTerminal, label: "Prompts" },
	{ to: "/plugins", icon: Blocks, label: "Plugins" },
	{ to: "/settings/appearance", icon: Settings, label: "Settings" },
];

export function Sidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<aside className="fixed inset-y-0 left-0 z-30 w-60 border-r bg-card">
			<div className="flex h-full flex-col">
				<div className="flex h-14 items-center border-b px-4">
					<Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
						<KattoLogo className="h-5 w-5 text-primary" />
						<span>KattoUI</span>
					</Link>
				</div>
				<nav className="flex-1 space-y-1 p-3">
					{navItems.map((item) => {
						const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
						const Icon = item.icon;
						return (
							<Link
								key={item.to}
								to={item.to}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
									active
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								{item.label}
							</Link>
						);
					})}
				</nav>
				<div className="border-t p-3">
					<div className="rounded-lg bg-muted px-3 py-2">
						<p className="text-xs font-medium text-muted-foreground">Workspace</p>
						<p className="text-sm font-semibold">Personal</p>
					</div>
				</div>
			</div>
		</aside>
	);
}
