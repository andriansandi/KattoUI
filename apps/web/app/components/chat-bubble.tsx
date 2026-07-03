import { cn } from "~/lib/cn";

interface ChatBubbleProps {
	role: "user" | "assistant" | "system";
	content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
	const isUser = role === "user";
	return (
		<div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
					isUser
						? "rounded-br-md bg-primary text-primary-foreground"
						: "rounded-bl-md bg-muted text-foreground",
				)}
			>
				{content}
			</div>
		</div>
	);
}
