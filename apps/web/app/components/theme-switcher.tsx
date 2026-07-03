import { themes } from "@katto/design-system";
import { Moon, Palette } from "lucide-react";
import { cn } from "~/lib/cn";
import { useThemeStore } from "~/stores/theme-store";

const icons: Record<string, React.ReactNode> = {
	katto: <Palette className="h-4 w-4" />,
	midnight: <Moon className="h-4 w-4" />,
};

export function ThemeSwitcher({ className }: { className?: string }) {
	const theme = useThemeStore((state) => state.theme);
	const setTheme = useThemeStore((state) => state.setTheme);

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{themes.map((t) => (
				<button
					key={t.id}
					type="button"
					onClick={() => setTheme(t.id)}
					aria-pressed={theme === t.id}
					className={cn(
						"flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
						theme === t.id
							? "bg-primary text-primary-foreground"
							: "bg-secondary text-secondary-foreground hover:bg-muted",
					)}
				>
					{icons[t.id] ?? <Palette className="h-4 w-4" />}
					{t.name}
				</button>
			))}
		</div>
	);
}
