import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "~/components/dashboard-shell";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
});

const guestMode = import.meta.env.VITE_GUEST_MODE === "true";

function AuthenticatedLayout() {
	if (guestMode) {
		return (
			<DashboardShell>
				<Outlet />
			</DashboardShell>
		);
	}

	return <ClerkProtectedLayout />;
}

function ClerkProtectedLayout() {
	const { isLoaded, isSignedIn } = useAuth();

	if (!isLoaded) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
		);
	}

	if (!isSignedIn) {
		return <Navigate to="/sign-in" search={{ redirect: location.pathname }} />;
	}

	return (
		<DashboardShell>
			<Outlet />
		</DashboardShell>
	);
}
