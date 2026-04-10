/**
 * Jest configuration for React Native/Expo frontend testing
 *
 * Configured for:
 * - React Native 0.83.4
 * - Expo SDK 55
 * - NativeWind v4
 * - TypeScript support
 */
module.exports = {
	// Use jest-expo preset for React Native/Expo compatibility
	preset: "jest-expo",

	// Test environment
	testEnvironment: "node",

	// Root directories for Jest to scan
	roots: ["<rootDir>/src"],

	// File patterns for test files
	testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],

	// Module file extensions
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

	// Setup files - runs before tests
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

	// Transform TypeScript/TSX files
	transform: {
		"^.+\\.tsx?$": "babel-jest",
	},

	// Transform ignore patterns - allow transformation of expo modules
	transformIgnorePatterns: [
		"node_modules/(?!(react-native|@react-native|@react-navigation|expo|expo-router|@expo|nativewind|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|phosphor-react-native)/)",
	],

	// Module name mapping for path aliases
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		// Mock static assets
		"\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
			"<rootDir>/src/__mocks__/fileMock.ts",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
	},

	// Coverage configuration
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/**/*.d.ts",
		"!src/**/__mocks__/**",
		"!src/**/__tests__/**",
	],

	coverageThreshold: {
		global: {
			branches: 50,
			functions: 50,
			lines: 50,
			statements: 50,
		},
	},

	// Coverage reporters
	coverageReporters: ["text", "text-summary", "lcov", "html"],

	// Reporters for test results
	reporters: ["default"],

	// Verbose output for better debugging
	verbose: true,

	// Clear mocks between tests
	clearMocks: true,

	// Restore mocks after tests
	restoreMocks: true,

	// Fail tests on console errors/warnings
	errorOnDeprecated: true,

	// Watch plugins for interactive mode
	watchPlugins: [
		"jest-watch-typeahead/filename",
		"jest-watch-typeahead/testname",
	],

	// Test timeout
	testTimeout: 10000,

	// Global setup/teardown
	globals: {
		"ts-jest": {
			tsconfig: {
				sxjsx: "react",
			},
		},
	},
};
