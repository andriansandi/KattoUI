import type { ProviderStatus } from "@katto/sdk";

export function statusLabel(status: ProviderStatus | undefined): string {
	switch (status) {
		case "healthy":
			return "Connected";
		case "degraded":
			return "Degraded";
		case "unhealthy":
			return "Error";
		default:
			return "Not tested";
	}
}

export function statusDotClass(status: ProviderStatus | undefined): string {
	switch (status) {
		case "healthy":
			return "bg-emerald-500";
		case "degraded":
			return "bg-amber-500";
		case "unhealthy":
			return "bg-red-500";
		default:
			return "bg-muted-foreground/40";
	}
}

export function formatRelativeTime(ts: number): string {
	const diff = Date.now() - ts;
	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
