import { cn } from "~/lib/cn";
import { useUIStore } from "~/stores/ui-store";
import { ChatSidebar } from "./chat-sidebar";

interface AppShellProps {
	children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
	const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
			<div
				className={cn(
					"fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 md:static md:z-auto md:translate-x-0",
					mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
				)}
			>
				<ChatSidebar />
			</div>

			{mobileSidebarOpen && (
				<button
					type="button"
					className="fixed inset-0 z-40 cursor-default bg-black/40 md:hidden"
					tabIndex={-1}
					aria-hidden="true"
					onClick={() => setMobileSidebarOpen(false)}
				/>
			)}

			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
		</div>
	);
}
