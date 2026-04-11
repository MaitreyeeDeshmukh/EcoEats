// src/utils/validators.ts
import { MAX_QUANTITY, MIN_QUANTITY } from "@/constants/app";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
	const trimmed = email.trim();
	if (!trimmed) {
		return "Email is required";
	}
	if (!EMAIL_REGEX.test(trimmed)) {
		return "Invalid email format";
	}
	return null;
}

export function validateName(name: string): string | null {
	if (!name.trim()) {
		return "Name is required";
	}
	if (name.trim().length < 2) {
		return "Name must be at least 2 characters";
	}
	return null;
}

export function validateTitle(title: string): string | null {
	if (!title.trim()) {
		return "Title is required";
	}
	if (title.trim().length < 3) {
		return "Title must be at least 3 characters";
	}
	return null;
}

export function validateQuantity(quantity: number): string | null {
	if (!Number.isFinite(quantity)) {
		return "Quantity must be a valid number";
	}
	if (quantity < MIN_QUANTITY) {
		return `Quantity must be at least ${MIN_QUANTITY}`;
	}
	if (quantity > MAX_QUANTITY) {
		return `Quantity cannot exceed ${MAX_QUANTITY}`;
	}
	if (!Number.isInteger(quantity)) {
		return "Quantity must be a whole number";
	}
	return null;
}
