import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";
import { apiUrl } from "~/lib/api";
import { getGuestSessionId } from "~/lib/guest-session";

export class ApiError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(message: string, status: number, code?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		if (code !== undefined) {
			this.code = code;
		}
	}
}

/**
 * Returns a fetch helper that authenticates every request. When a Clerk
 * session is active, sends a `Bearer` token; otherwise falls back to the guest
 * session header so unauthenticated users can still use the app.
 */
export function useAuthFetch() {
	const { getToken } = useAuth();

	return useCallback(
		async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
			const token = await getToken();
			const headers = new Headers(init?.headers);
			headers.set("Content-Type", "application/json");
			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
			} else {
				headers.set("X-Guest-Session", getGuestSessionId());
			}

			const response = await fetch(apiUrl(path), { ...init, headers });

			if (response.status === 204) {
				return undefined as T;
			}

			const json: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				const message =
					json !== null &&
					typeof json === "object" &&
					"error" in json &&
					typeof (json as { error: unknown }).error === "string"
						? (json as { error: string }).error
						: `Request failed: ${response.status}`;
				const code =
					json !== null &&
					typeof json === "object" &&
					"code" in json &&
					typeof (json as { code: unknown }).code === "string"
						? (json as { code: string }).code
						: undefined;
				throw new ApiError(message, response.status, code);
			}

			return json as T;
		},
		[getToken],
	);
}
