import { UserButton } from "@clerk/clerk-react";
import { Bell, Command, Menu, Search } from "lucide-react";
import { ClientOnly } from "~/components/client-only";
import { useUIStore } from "~/stores/ui-store";
import { ThemeSwitcher } from "./theme-switcher";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";

export function Navbar() {
	const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);
	const toggleSidebar = useUIStore((state) => state.toggleSidebar);

	return (
		<header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={toggleSidebar}>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle sidebar</span>
				</Button>
				<nav className="hidden text-sm text-muted-foreground md:flex">
					<span>Dashboard</span>
				</nav>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					className="hidden h-9 items-center gap-2 text-muted-foreground md:flex"
					onClick={toggleCommandPalette}
				>
					<Search className="h-4 w-4" />
					<span className="text-sm">Search</span>
					<kbd className="ml-2 rounded border px-1.5 text-xs">
						<Command className="inline h-3 w-3" />K
					</kbd>
				</Button>
				<ThemeSwitcher className="hidden md:flex" />
				<Button variant="ghost" size="icon">
					<Bell className="h-5 w-5" />
					<span className="sr-only">Notifications</span>
				</Button>
				<ClientOnly fallback={<Avatar fallback="G" size="sm" />}>
					<UserButton afterSignOutUrl="/" />
				</ClientOnly>
			</div>
		</header>
	);
}
