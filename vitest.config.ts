import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for backend testing
 * Covers the server/ directory with PostgreSQL database support and coverage reporting
 */
export default defineConfig({
	test: {
		// Test file patterns - backend only, explicitly exclude frontend tests
		include: ["server/**/*.test.ts"],
		exclude: [
			"node_modules/**",
			"dist/**",
			".idea/**",
			"src/**/*.test.ts",
			"src/**/*.test.tsx",
		],

		// TypeScript and ESM support
		globals: true,

		// Test environment configuration
		// Tests run sequentially to avoid database conflicts
		pool: "forks",
		fileParallelism: false,

		// Test timeouts
		testTimeout: 30000,
		hookTimeout: 30000,

		// Coverage configuration
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			reportsDirectory: "./coverage",
			include: ["server/**/*.ts"],
			exclude: [
				"server/**/*.test.ts",
				"server/index.ts",
				"server/sql/**",
				"node_modules/**",
			],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 60,
				statements: 70,
			},
		},

		// Test output
		reporters: ["verbose"],
		outputFile: {
			json: "./test-results.json",
		},

		// Setup files - runs before all tests
		globalSetup: "./server/test/global-setup.ts",
		setupFiles: ["./server/test/setup.ts"],

		env: {
			NODE_ENV: "test",
		},
	},

	// Resolve paths like the main application
	resolve: {
		alias: {
			"@/*": "./src/*",
		},
	},

	// TypeScript configuration
	esbuild: {
		target: "es2022",
	},
});
