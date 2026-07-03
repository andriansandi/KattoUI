/** Structured log context. */
export type LogContext = Record<string, unknown>;

/** Log severity level. */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/** Logger abstraction. Application code must use this, never console.log. */
export interface Logger {
	debug(message: string, ctx?: LogContext): void;
	info(message: string, ctx?: LogContext): void;
	warn(message: string, ctx?: LogContext): void;
	error(message: string, ctx?: LogContext): void;
	fatal(message: string, ctx?: LogContext): void;
	child(ctx: LogContext): Logger;
}

/** Factory for creating a logger instance. */
export interface LoggerFactory {
	create(source: string): Logger;
}
