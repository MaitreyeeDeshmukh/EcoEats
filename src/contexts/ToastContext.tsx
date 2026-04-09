// src/contexts/ToastContext.tsx
import { createContext, type ReactNode, useCallback, useContext } from "react";
import Toast from "react-native-toast-message";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
	message: string;
	description?: string;
	type?: ToastType;
	duration?: number;
}

interface ToastContextValue {
	show: (options: ToastOptions) => void;
	success: (message: string, description?: string) => void;
	error: (message: string, description?: string) => void;
	info: (message: string, description?: string) => void;
	hide: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
	const show = useCallback((options: ToastOptions) => {
		Toast.show({
			type: options.type || "info",
			text1: options.message,
			text2: options.description,
			visibilityTime: options.duration || 3000,
			position: "top",
		});
	}, []);

	const success = useCallback(
		(message: string, description?: string) => {
			show({ type: "success", message, description });
		},
		[show],
	);

	const error = useCallback(
		(message: string, description?: string) => {
			show({ type: "error", message, description });
		},
		[show],
	);

	const info = useCallback(
		(message: string, description?: string) => {
			show({ type: "info", message, description });
		},
		[show],
	);

	const hide = useCallback(() => {
		Toast.hide();
	}, []);

	return (
		<ToastContext.Provider value={{ show, success, error, info, hide }}>
			{children}
		</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return ctx;
}
