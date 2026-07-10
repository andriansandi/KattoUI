import type { ShortcutBinding } from "@katto/sdk";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface KeyboardRegistryContextValue {
	register: (binding: ShortcutBinding) => () => void;
	unregister: (id: string) => void;
}

const KeyboardRegistryContext = createContext<KeyboardRegistryContextValue | null>(null);

function matchesModifier(event: KeyboardEvent, modifier: ShortcutBinding["modifier"]): boolean {
	const mods = modifier ?? [];
	const wantMeta = mods.includes("meta");
	const wantCtrl = mods.includes("ctrl");
	const wantShift = mods.includes("shift");
	const wantAlt = mods.includes("alt");

	// On Mac, "meta" is Cmd; on others, "ctrl" is the primary modifier.
	// Treat metaKey and ctrlKey interchangeably when either is expected.
	const hasCmd = event.metaKey || event.ctrlKey;
	const wantCmd = wantMeta || wantCtrl;

	if (wantCmd !== hasCmd) return false;
	if (wantShift !== event.shiftKey) return false;
	if (wantAlt !== event.altKey) return false;
	return true;
}

export function KeyboardRegistryProvider({ children }: { children: ReactNode }) {
	const bindingsRef = useRef<Map<string, ShortcutBinding>>(new Map());

	const register = useCallback((binding: ShortcutBinding) => {
		bindingsRef.current.set(binding.id, binding);
		return () => {
			bindingsRef.current.delete(binding.id);
		};
	}, []);

	const unregister = useCallback((id: string) => {
		bindingsRef.current.delete(id);
	}, []);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const bindings = Array.from(bindingsRef.current.values());
			for (const binding of bindings) {
				if (event.key.toLowerCase() !== binding.key.toLowerCase()) continue;
				if (!matchesModifier(event, binding.modifier)) continue;
				event.preventDefault();
				void binding.handler(event);
				return;
			}
		}
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, []);

	return (
		<KeyboardRegistryContext.Provider value={{ register, unregister }}>
			{children}
		</KeyboardRegistryContext.Provider>
	);
}

export function useKeyboardRegistry(): KeyboardRegistryContextValue {
	const ctx = useContext(KeyboardRegistryContext);
	if (!ctx) throw new Error("useKeyboardRegistry must be used within KeyboardRegistryProvider");
	return ctx;
}

/** Convenience hook: register a single shortcut for the component's lifetime. */
export function useShortcut(binding: ShortcutBinding) {
	const { register } = useKeyboardRegistry();
	const handlerRef = useRef(binding.handler);
	handlerRef.current = binding.handler;
	const { id, key, modifier, when, label } = binding;

	useEffect(() => {
		const rebind: ShortcutBinding = {
			id,
			key,
			label,
			handler: (event: KeyboardEvent) => void handlerRef.current(event),
		};
		if (modifier) rebind.modifier = modifier;
		if (when) rebind.when = when;
		return register(rebind);
	}, [register, id, key, modifier, when, label]);
}
