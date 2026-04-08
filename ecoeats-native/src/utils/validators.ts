// src/utils/validators.ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) {
    return 'Name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
}

export function validateTitle(title: string): string | null {
  if (!title.trim()) {
    return 'Title is required';
  }
  if (title.trim().length < 3) {
    return 'Title must be at least 3 characters';
  }
  return null;
}

export function validateQuantity(quantity: number): string | null {
  if (quantity < 1) {
    return 'Quantity must be at least 1';
  }
  if (quantity > 100) {
    return 'Quantity cannot exceed 100';
  }
  return null;
}
