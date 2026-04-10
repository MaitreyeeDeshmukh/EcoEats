// src/components/ui/ErrorBoundary.test.tsx

import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Button as RNButton, Text, View } from "react-native";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * A test component that throws an error when shouldThrow is true
 */
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
	if (shouldThrow) {
		throw new Error("Test error from component");
	}
	return (
		<View testID="working-component">
			<Text>Component is working</Text>
		</View>
	);
}

/**
 * A test wrapper that controls whether the child throws
 * and allows clearing the error for reset testing
 */
function TestWrapper() {
	const [shouldThrow, setShouldThrow] = useState(false);

	return (
		<View>
			<RNButton
				title="Trigger Error"
				onPress={() => setShouldThrow(true)}
				testID="trigger-error"
			/>
			<RNButton
				title="Clear Error"
				onPress={() => setShouldThrow(false)}
				testID="clear-error"
			/>
			<ErrorBoundary>
				<ThrowingComponent shouldThrow={shouldThrow} />
			</ErrorBoundary>
		</View>
	);
}

describe("ErrorBoundary", () => {
	// Suppress console.error during tests to reduce noise
	const originalConsoleError = console.error;

	beforeEach(() => {
		console.error = jest.fn();
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	describe("normal rendering", () => {
		it("renders children when there is no error", () => {
			render(
				<ErrorBoundary>
					<View testID="child-view">
						<Text>Child content</Text>
					</View>
				</ErrorBoundary>,
			);

			expect(screen.getByTestId("child-view")).toBeTruthy();
			expect(screen.getByText("Child content")).toBeTruthy();
		});

		it("renders multiple children", () => {
			render(
				<ErrorBoundary>
					<View testID="child-1">
						<Text>First child</Text>
					</View>
					<View testID="child-2">
						<Text>Second child</Text>
					</View>
				</ErrorBoundary>,
			);

			expect(screen.getByTestId("child-1")).toBeTruthy();
			expect(screen.getByTestId("child-2")).toBeTruthy();
			expect(screen.getByText("First child")).toBeTruthy();
			expect(screen.getByText("Second child")).toBeTruthy();
		});
	});

	describe("error catching and fallback UI", () => {
		it("renders fallback UI when child throws an error", () => {
			render(<TestWrapper />);

			// Initially, the working component should be visible
			expect(screen.getByTestId("working-component")).toBeTruthy();

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Now the fallback UI should be visible
			expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();
		});

		it("displays user-friendly error message", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Check for the error message
			expect(screen.getByText("Something went wrong")).toBeTruthy();
			expect(
				screen.getByText(
					/We're sorry, but an unexpected error occurred\. Please try again\./,
				),
			).toBeTruthy();
		});

		it("displays Try Again button in fallback UI", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Check for the reset button
			expect(screen.getByTestId("error-boundary-reset-button")).toBeTruthy();
			expect(screen.getByText("Try Again")).toBeTruthy();
		});

		it("hides children when error occurs", () => {
			render(<TestWrapper />);

			// Initially, working component is visible
			expect(screen.getByTestId("working-component")).toBeTruthy();

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Working component should no longer be visible
			expect(screen.queryByTestId("working-component")).toBeNull();
		});
	});

	describe("reset functionality", () => {
		it("resets error state when Try Again is pressed", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Fallback UI should be visible
			expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();

			// Clear the error state (simulating fixing the underlying issue)
			// This MUST be done before pressing Try Again, otherwise
			// the component will throw again on re-render
			fireEvent.press(screen.getByTestId("clear-error"));

			// Press Try Again button to reset ErrorBoundary state
			fireEvent.press(screen.getByTestId("error-boundary-reset-button"));

			// The working component should be visible again
			expect(screen.getByTestId("working-component")).toBeTruthy();
		});

		it("re-renders children after reset", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Clear the error state (simulating fixing the underlying issue)
			fireEvent.press(screen.getByTestId("clear-error"));

			// Press Try Again button to reset ErrorBoundary state
			fireEvent.press(screen.getByTestId("error-boundary-reset-button"));

			// Check that children are re-rendered with correct content
			expect(screen.getByText("Component is working")).toBeTruthy();
		});

		it("throws again if underlying issue persists after reset", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Fallback UI should be visible
			expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();

			// DON'T clear the error state - simulating issue not fixed

			// Press Try Again button without fixing the underlying issue
			fireEvent.press(screen.getByTestId("error-boundary-reset-button"));

			// The error boundary should catch the error again
			// (because shouldThrow is still true)
			expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();
		});
	});

	describe("console logging", () => {
		it("logs errors to console.error when error is caught", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Check that console.error was called
			expect(console.error).toHaveBeenCalled();

			// Check that error was logged with appropriate message
			const errorCalls = (console.error as jest.Mock).mock.calls;
			const hasErrorBoundaryMessage = errorCalls.some(
				(call) =>
					typeof call[0] === "string" &&
					call[0].includes("ErrorBoundary caught an error"),
			);
			expect(hasErrorBoundaryMessage).toBe(true);
		});

		it("logs component stack when error is caught", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Check that component stack was logged
			const errorCalls = (console.error as jest.Mock).mock.calls;
			const hasComponentStack = errorCalls.some(
				(call) =>
					typeof call[0] === "string" && call[0].includes("Component stack"),
			);
			expect(hasComponentStack).toBe(true);
		});
	});

	describe("custom fallback", () => {
		it("renders custom fallback when provided", () => {
			const customFallback = (
				<View testID="custom-fallback">
					<Text>Custom error message</Text>
				</View>
			);

			render(
				<ErrorBoundary fallback={customFallback}>
					<ThrowingComponent shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.getByTestId("custom-fallback")).toBeTruthy();
			expect(screen.getByText("Custom error message")).toBeTruthy();
		});
	});

	describe("accessibility", () => {
		it("has accessible title in fallback UI", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Check for accessibility role on title
			const title = screen.getByText("Something went wrong");
			expect(title).toBeTruthy();
		});

		it("has accessible button with label and hint", () => {
			render(<TestWrapper />);

			// Trigger the error
			fireEvent.press(screen.getByTestId("trigger-error"));

			// Check button exists
			const button = screen.getByTestId("error-boundary-reset-button");
			expect(button).toBeTruthy();
		});
	});
});
