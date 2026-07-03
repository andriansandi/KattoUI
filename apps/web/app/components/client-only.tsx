import { useEffect, useState } from "react";

interface ClientOnlyProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

/** Renders children only after the component has mounted on the client. */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return mounted ? children : fallback;
}
