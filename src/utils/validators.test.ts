import { validateEmail, validateQuantity } from "./validators";

describe("validateEmail", () => {
	it("returns null for valid email", () => {
		expect(validateEmail("test@example.com")).toBeNull();
	});

	it("returns null for valid email with subdomain", () => {
		expect(validateEmail("user.name@domain.co.uk")).toBeNull();
	});

	it("returns null for valid email with plus sign", () => {
		expect(validateEmail("user+tag@example.com")).toBeNull();
	});

	it("returns null for valid email with numbers", () => {
		expect(validateEmail("user123@test-domain.org")).toBeNull();
	});

	it("returns error for empty string", () => {
		expect(validateEmail("")).toBe("Email is required");
	});

	it("returns error for whitespace-only string", () => {
		expect(validateEmail("   ")).toBe("Email is required");
	});

	it("returns error for invalid format (no @)", () => {
		expect(validateEmail("invalid")).toBe("Invalid email format");
	});

	it("returns error for invalid format (no domain)", () => {
		expect(validateEmail("user@")).toBe("Invalid email format");
	});

	it("returns error for invalid format (no local part)", () => {
		expect(validateEmail("@domain.com")).toBe("Invalid email format");
	});

	it("returns error for invalid format (spaces)", () => {
		expect(validateEmail("user @domain.com")).toBe("Invalid email format");
	});

	it("returns error for invalid format (multiple @)", () => {
		expect(validateEmail("user@@domain.com")).toBe("Invalid email format");
	});

	it("trims input before validation", () => {
		expect(validateEmail("  test@example.com  ")).toBeNull();
	});

	it("trims and returns error for empty after trim", () => {
		expect(validateEmail("   ")).toBe("Email is required");
	});

	it("trims and validates correctly with leading/trailing spaces", () => {
		expect(validateEmail("  user@domain.com  ")).toBeNull();
	});
});

describe("validateQuantity", () => {
	it("returns null for valid quantity (1)", () => {
		expect(validateQuantity(1)).toBeNull();
	});

	it("returns null for valid quantity (50)", () => {
		expect(validateQuantity(50)).toBeNull();
	});

	it("returns null for valid quantity (100 - boundary)", () => {
		expect(validateQuantity(100)).toBeNull();
	});

	it("returns null for valid quantity (middle range)", () => {
		expect(validateQuantity(42)).toBeNull();
	});

	it("returns error for NaN", () => {
		expect(validateQuantity(NaN)).toBe("Quantity must be a valid number");
	});

	it("returns error for Infinity", () => {
		expect(validateQuantity(Infinity)).toBe("Quantity must be a valid number");
	});

	it("returns error for -Infinity", () => {
		expect(validateQuantity(-Infinity)).toBe("Quantity must be a valid number");
	});

	it("returns error for zero (below minimum boundary)", () => {
		expect(validateQuantity(0)).toBe("Quantity must be at least 1");
	});

	it("returns error for negative number", () => {
		expect(validateQuantity(-5)).toBe("Quantity must be at least 1");
	});

	it("returns error for 101 (above maximum boundary)", () => {
		expect(validateQuantity(101)).toBe("Quantity cannot exceed 100");
	});

	it("returns error for large number above maximum", () => {
		expect(validateQuantity(1000)).toBe("Quantity cannot exceed 100");
	});

	it("returns error for decimal number", () => {
		expect(validateQuantity(1.5)).toBe("Quantity must be a whole number");
	});

	it("returns error for decimal close to valid number", () => {
		expect(validateQuantity(99.9)).toBe("Quantity must be a whole number");
	});

	it("returns error for negative decimal", () => {
		expect(validateQuantity(-1.5)).toBe("Quantity must be at least 1");
	});

	it("boundary value: 1 returns null", () => {
		expect(validateQuantity(1)).toBeNull();
	});

	it("boundary value: 100 returns null", () => {
		expect(validateQuantity(100)).toBeNull();
	});

	it("boundary value: 0 returns below minimum error", () => {
		expect(validateQuantity(0)).toBe("Quantity must be at least 1");
	});

	it("boundary value: 101 returns above maximum error", () => {
		expect(validateQuantity(101)).toBe("Quantity cannot exceed 100");
	});
});
