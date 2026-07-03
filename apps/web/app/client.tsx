import { ClerkProvider } from "@clerk/clerk-react";
import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ThemeProvider } from "~/components/theme-provider";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Root() {
	return (
		<StrictMode>
			<ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
				<ThemeProvider defaultTheme="katto">
					<StartClient />
				</ThemeProvider>
			</ClerkProvider>
		</StrictMode>
	);
}

hydrateRoot(document, <Root />);
