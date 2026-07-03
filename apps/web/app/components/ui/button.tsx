import * as React from "react";
import { cn } from "~/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
	size?: "default" | "sm" | "lg" | "icon";
	asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, variant = "default", size = "default", asChild = false, children, ...props },
		ref,
	) => {
		const classes = cn(
			"inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
			{
				"bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
				"bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
				"border border-input bg-background hover:bg-accent hover:text-accent-foreground":
					variant === "outline",
				"hover:bg-accent hover:text-accent-foreground": variant === "ghost",
				"bg-destructive text-destructive-foreground hover:bg-destructive/90":
					variant === "destructive",
			},
			{
				"h-9 px-4 py-2 text-sm": size === "default",
				"h-8 rounded-md px-3 text-xs": size === "sm",
				"h-10 rounded-md px-6": size === "lg",
				"h-9 w-9": size === "icon",
			},
			className,
		);

		if (asChild && React.isValidElement(children)) {
			// We expect a single element child that can accept a className and ref.
			const child = children as React.ReactElement<{
				className?: string;
				ref?: React.Ref<unknown>;
			}>;
			return React.cloneElement(child, {
				className: cn(child.props.className, classes),
				ref,
				...props,
			});
		}

		return (
			<button type="button" className={classes} ref={ref} {...props}>
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";
