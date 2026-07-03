import { cn } from "~/lib/cn";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
	src?: string;
	alt?: string;
	fallback?: string;
	size?: "sm" | "md" | "lg";
}

export function Avatar({ className, src, alt = "", fallback, size = "md", ...props }: AvatarProps) {
	const sizeClasses = {
		sm: "h-8 w-8 text-xs",
		md: "h-10 w-10 text-sm",
		lg: "h-12 w-12 text-base",
	};

	const fallbackText =
		fallback
			?.split(" ")
			.map((word) => word[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() ?? "";

	return (
		<div
			className={cn(
				"relative inline-flex items-center justify-center overflow-hidden rounded-full bg-secondary font-medium text-secondary-foreground",
				sizeClasses[size],
				className,
			)}
			{...props}
		>
			{src ? (
				<img src={src} alt={alt} className="h-full w-full object-cover" />
			) : (
				<span>{fallbackText}</span>
			)}
		</div>
	);
}
