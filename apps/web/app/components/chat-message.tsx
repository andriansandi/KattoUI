import { Brain, Check, ChevronRight, Pencil, RefreshCw, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { CopyButton } from "~/components/copy-button";
import { Markdown } from "~/components/markdown";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/cn";

export interface MessageItemProps {
	role: "user" | "assistant" | "system";
	content: string;
	reasoning?: string | undefined;
	streaming?: boolean;
	streamingReasoning?: string | undefined;
	tokensPrompt?: number | undefined;
	tokensCompletion?: number | undefined;
	tokensTotal?: number | undefined;
	onEdit?: ((content: string) => void) | undefined;
	onRegenerate?: (() => void) | undefined;
	canRegenerate?: boolean;
}

export function MessageItem({
	role,
	content,
	reasoning,
	streaming = false,
	streamingReasoning,
	tokensPrompt,
	tokensCompletion,
	tokensTotal,
	onEdit,
	onRegenerate,
	canRegenerate = false,
}: MessageItemProps) {
	const reduceMotion = useReducedMotion();
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(content);
	const [reasoningExpanded, setReasoningExpanded] = useState(false);

	const reasoningText = streaming ? (streamingReasoning ?? "") : (reasoning ?? "");

	useEffect(() => {
		if (streaming && streamingReasoning) {
			setReasoningExpanded(true);
		}
	}, [streaming, streamingReasoning]);

	if (role === "system") {
		return (
			<div className="flex justify-center">
				<p className="max-w-[85%] text-center text-xs italic text-muted-foreground">{content}</p>
			</div>
		);
	}

	const isUser = role === "user";
	const hasUsage = tokensTotal !== undefined && !streaming;

	function handleSaveEdit() {
		const trimmed = editValue.trim();
		if (trimmed && trimmed !== content) {
			onEdit?.(trimmed);
		}
		setIsEditing(false);
	}

	function handleCancelEdit() {
		setEditValue(content);
		setIsEditing(false);
	}

	return (
		<motion.div
			initial={reduceMotion ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22, ease: "easeOut" }}
			className={cn("group flex flex-col", isUser ? "items-end" : "items-start")}
		>
			<div
				className={cn(
					"max-w-[768px] rounded-2xl px-4 py-3 text-sm leading-relaxed",
					isUser
						? "rounded-br-md bg-primary text-primary-foreground"
						: "rounded-bl-md bg-muted/40 text-foreground",
				)}
			>
				{isEditing ? (
					<div className="flex flex-col gap-2">
						<Textarea
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							className="min-h-[80px] resize-none border-0 bg-background/50 text-foreground"
							autoFocus
						/>
						<div className="flex justify-end gap-1">
							<Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}>
								<X className="h-3.5 w-3.5" />
								<span className="sr-only">Cancel edit</span>
							</Button>
							<Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveEdit}>
								<Check className="h-3.5 w-3.5" />
								<span className="sr-only">Save edit</span>
							</Button>
						</div>
					</div>
				) : (
					<>
						{!isUser && reasoningText && (
							<div className="mb-2">
								<button
									type="button"
									onClick={() => setReasoningExpanded((v) => !v)}
									className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
								>
									<Brain className="h-3.5 w-3.5" />
									<span>Reasoning</span>
									<ChevronRight
										className={cn("h-3 w-3 transition-transform", reasoningExpanded && "rotate-90")}
									/>
								</button>
								<AnimatePresence initial={false}>
									{reasoningExpanded && (
										<motion.div
											initial={reduceMotion ? false : { height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={
												reduceMotion
													? { height: 0, opacity: 0, transition: { duration: 0 } }
													: { height: 0, opacity: 0 }
											}
											transition={{ duration: 0.2, ease: "easeOut" }}
											className="overflow-hidden"
										>
											<div className="mt-1.5 max-h-[300px] overflow-y-auto rounded-lg border border-border/50 bg-background/50 p-2.5 text-xs leading-relaxed text-muted-foreground">
												<Markdown content={reasoningText} streaming={streaming} />
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}
						{isUser ? (
							content
						) : streaming && !content && !reasoningText ? (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Sparkles className="h-4 w-4 animate-pulse text-primary" />
								<span>Thinking...</span>
							</div>
						) : (
							<Markdown content={content} streaming={streaming} />
						)}
						{streaming && content && (
							<span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-primary align-middle" />
						)}
						{!isUser && !streaming && (
							<div className="mt-2 flex items-center gap-3 border-t border-border/50 pt-1.5 opacity-0 transition-opacity group-hover:opacity-100">
								<CopyButton getText={() => content} />
								{hasUsage && (
									<span className="text-xs text-muted-foreground">
										{tokensPrompt !== undefined && `↑ ${tokensPrompt}`}
										{tokensPrompt !== undefined && tokensCompletion !== undefined && " "}
										{tokensCompletion !== undefined && `↓ ${tokensCompletion}`}
									</span>
								)}
								{canRegenerate && onRegenerate && (
									<button
										type="button"
										onClick={onRegenerate}
										className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
										aria-label="Regenerate response"
									>
										<RefreshCw className="h-3 w-3" />
										<span>Retry</span>
									</button>
								)}
							</div>
						)}
					</>
				)}
			</div>
			{isUser && !streaming && onEdit && !isEditing && (
				<Button
					variant="ghost"
					size="icon"
					className="mt-0.5 h-6 w-6 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
					onClick={() => {
						setEditValue(content);
						setIsEditing(true);
					}}
				>
					<Pencil className="h-3 w-3" />
					<span className="sr-only">Edit message</span>
				</Button>
			)}
		</motion.div>
	);
}
