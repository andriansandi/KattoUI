import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tanstackStart({
			srcDirectory: "app",
		}),
		react(),
		tailwindcss(),
	],
	server: {
		port: 5177,
		strictPort: true,
	},
	resolve: {
		alias: {
			"~/": new URL("./app/", import.meta.url).pathname,
		},
	},
});
