/** Telemetry event. */
export interface TelemetryEvent {
	name: string;
	properties?: Record<string, unknown>;
	timestamp?: number;
}

/** Telemetry abstraction. Disabled by default. */
export interface TelemetryAdapter {
	name: string;
	init(): void | Promise<void>;
	track(event: TelemetryEvent): void | Promise<void>;
	identify(userId: string, traits?: Record<string, unknown>): void | Promise<void>;
	page(name: string, properties?: Record<string, unknown>): void | Promise<void>;
}

/** Registry for telemetry adapters. */
export interface TelemetryRegistry {
	register(adapter: TelemetryAdapter): void;
	track(event: TelemetryEvent): void;
	identify(userId: string, traits?: Record<string, unknown>): void;
	page(name: string, properties?: Record<string, unknown>): void;
}
