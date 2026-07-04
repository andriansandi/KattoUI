import { Menu, MoreHorizontal } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface ChatHeaderProps {
	title: string;
	model?: string | undefined;
	onToggleMobileSidebar: () => void;
}

export function ChatHeader({ title, model, onToggleMobileSidebar }: ChatHeaderProps) {
	return (
		<div className="flex h-14 flex-shrink-0 items-center gap-2 border-b px-4">
			<Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileSidebar}>
				<Menu className="h-5 w-5" />
				<span className="sr-only">Toggle sidebar</span>
			</Button>
			<h1 className="flex-1 truncate text-sm font-semibold">{title}</h1>
			<Badge
				variant="secondary"
				className="hidden font-normal text-muted-foreground sm:inline-flex"
			>
				{model ?? "No model"}
			</Badge>
			<Button variant="ghost" size="icon" aria-label="More">
				<MoreHorizontal className="h-4 w-4" />
			</Button>
		</div>
	);
}
