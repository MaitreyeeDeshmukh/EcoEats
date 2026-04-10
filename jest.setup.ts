/**
 * Jest setup file
 *
 * Configures:
 * - @testing-library/jest-dom matchers for DOM assertions
 * - @testing-library/jest-native matchers for React Native specific assertions
 * - Mocks for NativeWind and Expo modules
 */

import type { ComponentType, ReactNode, Ref } from "react";

// Import jest-dom matchers for DOM assertions
import "@testing-library/jest-dom";

// Import jest-native matchers for React Native specific assertions
import "@testing-library/jest-native/extend-expect";

// ============================================================================
// NativeWind Mocks
// ============================================================================

/**
 * Mock for NativeWind's styled function
 * Returns the component with CSS className support
 */
jest.mock("nativewind", () => {
	const React = require("react");

	return {
		styled: (
			Component: ComponentType<{ ref?: Ref<unknown>; children?: ReactNode }>,
		) => {
			return React.forwardRef(
				(
					props: {
						className?: string;
						style?: unknown;
						[key: string]: unknown;
					},
					ref: Ref<unknown>,
				) => {
					const { className, ...rest } = props;
					return React.createElement(Component, {
						...rest,
						ref,
						// Merge className with style for testing purposes
						style: className ? { className } : rest.style,
					});
				},
			);
		},
	};
});

// ============================================================================
// Expo Module Mocks
// ============================================================================

/**
 * Mock for expo-secure-store
 * Provides in-memory storage for auth tokens in tests
 */
jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn((key: string) => {
		return Promise.resolve(global.secureStoreMock?.[key] ?? null);
	}),
	setItemAsync: jest.fn((key: string, value: string) => {
		global.secureStoreMock = global.secureStoreMock || {};
		global.secureStoreMock[key] = value;
		return Promise.resolve();
	}),
	deleteItemAsync: jest.fn((key: string) => {
		if (global.secureStoreMock) {
			delete global.secureStoreMock[key];
		}
		return Promise.resolve();
	}),
}));

// Global mock storage for SecureStore
declare global {
	var secureStoreMock: Record<string, string> | undefined;
}

/**
 * Mock for expo-linking
 */
jest.mock("expo-linking", () => ({
	createURL: jest.fn((path: string) => `ecoeats://${path}`),
	openURL: jest.fn((_url: string) => Promise.resolve(true)),
	canOpenURL: jest.fn((_url: string) => Promise.resolve(true)),
	getInitialURL: jest.fn(() => Promise.resolve(null)),
	addEventListener: jest.fn(() => ({
		remove: jest.fn(),
	})),
	removeEventListener: jest.fn(),
	useURL: jest.fn(() => null),
}));

/**
 * Mock for expo-constants
 */
jest.mock("expo-constants", () => ({
	default: {
		expoConfig: {
			name: "EcoEats",
			slug: "ecoeats",
			version: "1.0.0",
		},
		manifest: {
			extra: {
				eas: {
					projectId: "test-project-id",
				},
			},
		},
	},
}));

/**
 * Mock for expo-status-bar
 */
jest.mock("expo-status-bar", () => ({
	StatusBar: jest.fn(() => null),
}));

/**
 * Mock for expo-router
 */
jest.mock("expo-router", () => ({
	useRouter: jest.fn(() => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
		canGoBack: jest.fn(() => true),
	})),
	useLocalSearchParams: jest.fn(() => ({})),
	header: jest.fn(() => null),
	Stack: {
		Screen: jest.fn(() => null),
	},
	Link: jest.fn(({ children }: { children: React.ReactNode }) => children),
	href: jest.fn((path: string) => path),
}));

// ============================================================================
// React Native Module Mocks
// ============================================================================

/**
 * Mock for react-native-reanimated
 */
jest.mock("react-native-reanimated", () => {
	const Reanimated = require("react-native-reanimated/mock");
	Reanimated.default.call = jest.fn();
	return Reanimated;
});

/**
 * Mock for react-native-gesture-handler
 */
jest.mock("react-native-gesture-handler", () => ({
	...jest.requireActual("react-native-gesture-handler/mock"),
	GestureHandlerRootView: jest.fn(
		({ children }: { children: React.ReactNode }) => children,
	),
}));

/**
 * Mock for react-native-safe-area-context
 */
jest.mock("react-native-safe-area-context", () => ({
	SafeAreaProvider: jest.fn(
		({ children }: { children: React.ReactNode }) => children,
	),
	SafeAreaView: jest.fn(
		({ children, ...props }: { children: React.ReactNode }) =>
			require("react").createElement("View", props, children),
	),
	useSafeAreaInsets: jest.fn(() => ({
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
	})),
}));

/**
 * Mock for react-native-svg
 */
jest.mock("react-native-svg", () => ({
	Svg: jest.fn(({ children }: { children: React.ReactNode }) =>
		require("react").createElement("View", null, children),
	),
	Circle: jest.fn(() => null),
	Rect: jest.fn(() => null),
	Path: jest.fn(() => null),
	Line: jest.fn(() => null),
	Polyline: jest.fn(() => null),
	Polygon: jest.fn(() => null),
	Text: jest.fn(() => null),
	TSpan: jest.fn(() => null),
	G: jest.fn(({ children }: { children: React.ReactNode }) => children),
	Defs: jest.fn(() => null),
	ClipPath: jest.fn(() => null),
	LinearGradient: jest.fn(() => null),
	RadialGradient: jest.fn(() => null),
	Stop: jest.fn(() => null),
	Use: jest.fn(() => null),
	Image: jest.fn(() => null),
	Symbol: jest.fn(() => null),
	Mask: jest.fn(() => null),
	Pattern: jest.fn(() => null),
}));

/**
 * Mock for phosphor-react-native icons
 */
jest.mock("phosphor-react-native", () => ({
	// Generate mock components for common icon names
	House: jest.fn(() => null),
	Plus: jest.fn(() => null),
	User: jest.fn(() => null),
	Gear: jest.fn(() => null),
	SignOut: jest.fn(() => null),
	MagnifyingGlass: jest.fn(() => null),
	Heart: jest.fn(() => null),
	MapPin: jest.fn(() => null),
	Clock: jest.fn(() => null),
	Calendar: jest.fn(() => null),
	Check: jest.fn(() => null),
	X: jest.fn(() => null),
	ArrowLeft: jest.fn(() => null),
	ArrowRight: jest.fn(() => null),
	// Generic icon factory for any other icons
	__esModule: true,
}));

/**
 * Mock for react-native-toast-message
 */
jest.mock("react-native-toast-message", () => ({
	default: {
		show: jest.fn(),
		hide: jest.fn(),
	},
}));

// ============================================================================
// Test Utilities & Global Setup
// ============================================================================

/**
 * Global test utilities
 */
global.beforeEach(() => {
	// Clear secure store mock before each test
	global.secureStoreMock = {};
});

global.afterEach(() => {
	// Clean up after each test
	jest.clearAllMocks();
});

/**
 * Suppress console warnings during tests (optional)
 * Uncomment if you want to reduce noise
 */
// const originalWarn = console.warn;
// console.warn = (...args: any[]) => {
// 	// Filter out specific warnings if needed
// 	originalWarn.apply(console, args);
// };
