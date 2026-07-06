import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const webNodeModules = fileURLToPath(new URL("./apps/web/node_modules/", import.meta.url));

export default defineConfig({
	plugins: [react()],
	esbuild: {
		jsx: "preserve",
	},
	resolve: {
		alias: {
			"~/": fileURLToPath(new URL("./apps/web/app/", import.meta.url)),
			react: `${webNodeModules}react`,
			"react-dom": `${webNodeModules}react-dom`,
		},
		dedupe: ["react", "react-dom"],
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./apps/web/app/lib/test-setup.ts"],
		include: ["apps/**/*.{test,spec}.{ts,tsx}"],
		passWithNoTests: true,
	},
});
