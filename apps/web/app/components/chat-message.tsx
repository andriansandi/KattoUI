import { motion, useReducedMotion } from "motion/react";
import { cn } from "~/lib/cn";

interface MessageItemProps {
	role: "user" | "assistant" | "system";
	content: string;
}

export function MessageItem({ role, content }: MessageItemProps) {
	const reduceMotion = useReducedMotion();

	if (role === "system") {
		return (
			<div className="flex justify-center">
				<p className="max-w-[85%] text-center text-xs italic text-muted-foreground">{content}</p>
			</div>
		);
	}

	const isUser = role === "user";

	return (
		<motion.div
			initial={reduceMotion ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22, ease: "easeOut" }}
			className={cn("flex", isUser ? "justify-end" : "justify-start")}
		>
			<div
				className={cn(
					"max-w-[768px] rounded-2xl px-4 py-3 text-sm leading-relaxed",
					isUser
						? "rounded-br-md bg-primary text-primary-foreground"
						: "rounded-bl-md bg-muted/40 text-foreground",
				)}
			>
				{content}
			</div>
		</motion.div>
	);
}
