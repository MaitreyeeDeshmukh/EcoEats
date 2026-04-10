// src/components/ui/ErrorBoundary.tsx

import { Component, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button } from "./Button";

interface ErrorBoundaryProps {
	/** Child components to render within the error boundary */
	children: ReactNode;
	/** Optional custom fallback component to render when an error occurs */
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	/** Whether an error has been caught */
	hasError: boolean;
	/** The error that was caught, if any */
	error: Error | null;
}

/**
 * A reusable React error boundary component that catches JavaScript errors in its children.
 *
 * Features:
 * - Renders a user-friendly fallback UI when errors occur
 * - Provides a "Try Again" button to reset the error state
 * - Logs errors to console.error for debugging
 * - Compatible with React Native and Expo
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	/**
	 * Update state when an error is caught
	 * This is a static method required by React's error boundary API
	 */
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	/**
	 * Log error details when caught
	 * This lifecycle method is called when an error is caught
	 */
	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		// Log error to console for debugging
		console.error("ErrorBoundary caught an error:", error);
		console.error("Component stack:", errorInfo.componentStack);
	}

	/**
	 * Reset the error state to attempt re-rendering children
	 * This can be called when the user clicks "Try Again"
	 */
	resetError = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		const { hasError, error } = this.state;
		const { children, fallback } = this.props;

		// If there's no error, render children normally
		if (!hasError) {
			return children;
		}

		// If a custom fallback is provided, use it
		if (fallback) {
			return fallback;
		}

		// Render default fallback UI
		return (
			<ScrollView
				className="flex-1 bg-cream"
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 24,
				}}
				testID="error-boundary-fallback"
			>
				<View className="items-center max-w-md w-full">
					{/* Error Icon Placeholder */}
					<View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
						<Text className="text-2xl">⚠️</Text>
					</View>

					{/* Title */}
					<Text
						className="text-xl font-heading font-bold text-forest-900 text-center mb-2"
						accessibilityRole="header"
					>
						Something went wrong
					</Text>

					{/* Error Message */}
					<Text
						className="text-base font-body text-forest-600 text-center mb-6"
						accessibilityRole="text"
					>
						We're sorry, but an unexpected error occurred. Please try again.
					</Text>

					{/* Error Details (in development mode) */}
					{__DEV__ && error && (
						<View
							className="w-full bg-forest-50 rounded-lg p-4 mb-6"
							accessibilityRole="text"
						>
							<Text
								className="text-sm font-mono text-forest-700"
								numberOfLines={5}
							>
								{error.message}
							</Text>
						</View>
					)}

					{/* Try Again Button */}
					<Button
						onPress={this.resetError}
						variant="primary"
						size="md"
						accessibilityLabel="Try Again"
						accessibilityHint="Press to reload the content and try again"
						testID="error-boundary-reset-button"
					>
						Try Again
					</Button>
				</View>
			</ScrollView>
		);
	}
}
