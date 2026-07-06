import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "~/lib/cn";

interface DialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string | undefined;
	description?: string | undefined;
	children?: React.ReactNode;
	footer?: React.ReactNode;
	className?: string | undefined;
}

export function Dialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	footer,
	className,
}: DialogProps) {
	useEffect(() => {
		if (!open) return;
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				e.preventDefault();
				onOpenChange(false);
			}
		}
		document.addEventListener("keydown", onKeyDown);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = prevOverflow;
		};
	}, [open, onOpenChange]);

	if (!open) return null;

	return createPortal(
		<dialog
			open
			aria-modal="true"
			aria-labelledby={title ? "dialog-title" : undefined}
			className="fixed inset-0 z-50 m-0 flex h-screen w-screen items-center justify-center bg-black/50 p-4"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onOpenChange(false);
			}}
		>
			<div className={cn("w-full max-w-md rounded-lg border bg-popover p-5 shadow-lg", className)}>
				{title && (
					<h2 id="dialog-title" className="text-base font-semibold text-foreground">
						{title}
					</h2>
				)}
				{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
				{children && <div className="mt-3">{children}</div>}
				{footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
			</div>
		</dialog>,
		document.body,
	);
}
