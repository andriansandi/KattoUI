import { Send } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/cn";

interface ChatComposerProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled?: boolean;
	className?: string;
}

const MAX_HEIGHT = 240;

export function ChatComposer({
	value,
	onChange,
	onSend,
	disabled = false,
	className,
}: ChatComposerProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		if (value !== "") {
			el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
		}
	}, [value]);

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function handleSend() {
		if (disabled || !value.trim()) return;
		onSend();
	}

	const canSend = !disabled && value.trim().length > 0;

	return (
		<div
			className={cn(
				"relative rounded-2xl border bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
				className,
			)}
		>
			<Textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Message KattoUI..."
				rows={1}
				className="max-h-[240px] min-h-[56px] resize-none border-0 bg-transparent px-4 py-3 pr-12 shadow-none focus-visible:ring-0"
			/>
			<Button
				type="button"
				variant="default"
				size="icon"
				className="absolute bottom-2 right-2 h-8 w-8 rounded-lg"
				onClick={handleSend}
				disabled={!canSend}
				aria-label="Send message"
			>
				<Send className="h-4 w-4" />
			</Button>
		</div>
	);
}
