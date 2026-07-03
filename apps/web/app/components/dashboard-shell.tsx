import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

interface DashboardShellProps {
	children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
	return (
		<div className="flex h-screen w-full bg-background text-foreground">
			<Sidebar />
			<div className="flex flex-1 flex-col md:pl-60">
				<Navbar />
				<main className="flex-1 overflow-auto p-6">{children}</main>
			</div>
		</div>
	);
}
