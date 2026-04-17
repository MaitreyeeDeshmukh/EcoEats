import { validateEmail } from "./validators";

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
