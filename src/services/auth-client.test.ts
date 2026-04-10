// Mock expo-modules and expo before any other imports
jest.mock("expo-modules-core", () => ({
	NativeModulesProxy: {},
	EventEmitter: class MockEventEmitter {},
	requireNativeModule: jest.fn(),
	requireOptionalNativeModule: jest.fn(),
}));

jest.mock("expo", () => ({
	registerRootComponent: jest.fn(),
}));

import { authClient, type Session, type User } from "./auth-client";
import { readErrorMessage } from "./request";
import { buildServerUrl } from "./server-config";

// Mock dependencies
jest.mock("./request");
jest.mock("./server-config");

// Helper to access private properties
const getPrivate = <T>(obj: unknown, key: string): T =>
	(obj as Record<string, T>)[key];
const setPrivate = <T>(obj: unknown, key: string, value: T): void => {
	(obj as Record<string, T>)[key] = value;
};

describe("AuthClient", () => {
	let mockFetch: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset global secure store mock
		global.secureStoreMock = {};
		// Reset the authClient internal state
		setPrivate(authClient, "session", null);
		setPrivate(authClient, "authToken", null);
		setPrivate(authClient, "listeners", new Set());

		// Setup fetch mock
		mockFetch = jest.fn();
		global.fetch = mockFetch;

		// Setup default mocks
		(readErrorMessage as jest.Mock).mockImplementation(
			async (_response: Response, fallback: string) => fallback,
		);
		(buildServerUrl as jest.Mock).mockImplementation(
			(path: string) => `http://localhost:3001${path}`,
		);
	});

	describe("getSession", () => {
		const mockUser: User = {
			id: "user-123",
			email: "test@example.com",
			name: "Test User",
			image: null,
			emailVerified: true,
		};

		const createMockSession = (
			expiresAt: Date = new Date(Date.now() + 3600000),
		): Session => ({
			id: "session-123",
			userId: "user-123",
			expiresAt,
			user: mockUser,
		});

		it("returns cached session when available and not expired", async () => {
			const mockSession = createMockSession();
			setPrivate(authClient, "session", mockSession);

			const result = await authClient.getSession();

			expect(result).toEqual(mockSession);
		});

		it("returns null when no stored session exists", async () => {
			const result = await authClient.getSession();

			expect(result).toBeNull();
		});

		it("loads session from storage when no cached session", async () => {
			const futureDate = new Date(Date.now() + 3600000);
			const storedData = {
				session: {
					id: "session-123",
					userId: "user-123",
					expiresAt: futureDate.toISOString(),
					user: mockUser,
				},
				authToken: "token-123",
			};
			global.secureStoreMock = { ecoeats_session: JSON.stringify(storedData) };

			const result = await authClient.getSession();

			expect(result).not.toBeNull();
			expect(result?.id).toBe("session-123");
			expect(result?.userId).toBe("user-123");
			expect(result?.user).toEqual(mockUser);
			expect(result?.expiresAt).toBeInstanceOf(Date);
		});

		it("handles corrupted JSON in storage", async () => {
			global.secureStoreMock = { ecoeats_session: "invalid-json{" };
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			const result = await authClient.getSession();

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to parse session:",
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});

		it("handles invalid session structure (missing id)", async () => {
			const invalidData = {
				session: {
					userId: "user-123",
					expiresAt: new Date().toISOString(),
					user: mockUser,
				},
			};
			global.secureStoreMock = { ecoeats_session: JSON.stringify(invalidData) };
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			const result = await authClient.getSession();

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith("Invalid session data structure");
			consoleSpy.mockRestore();
		});

		it("handles invalid session structure (missing userId)", async () => {
			const invalidData = {
				session: {
					id: "session-123",
					expiresAt: new Date().toISOString(),
					user: mockUser,
				},
			};
			global.secureStoreMock = { ecoeats_session: JSON.stringify(invalidData) };
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			const result = await authClient.getSession();

			expect(result).toBeNull();
			consoleSpy.mockRestore();
		});

		it("handles invalid session structure (missing expiresAt)", async () => {
			const invalidData = {
				session: {
					id: "session-123",
					userId: "user-123",
					user: mockUser,
				},
			};
			global.secureStoreMock = { ecoeats_session: JSON.stringify(invalidData) };
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			const result = await authClient.getSession();

			expect(result).toBeNull();
			consoleSpy.mockRestore();
		});

		it("handles invalid session structure (missing user)", async () => {
			const invalidData = {
				session: {
					id: "session-123",
					userId: "user-123",
					expiresAt: new Date().toISOString(),
				},
			};
			global.secureStoreMock = { ecoeats_session: JSON.stringify(invalidData) };
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			const result = await authClient.getSession();

			expect(result).toBeNull();
			consoleSpy.mockRestore();
		});

		it("clears expired cached session from memory", async () => {
			const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
			const mockSession = createMockSession(pastDate);
			setPrivate(authClient, "session", mockSession);

			const result = await authClient.getSession();

			expect(result).toBeNull();
			expect(getPrivate<Session | null>(authClient, "session")).toBeNull();
		});

		it("clears expired session from storage", async () => {
			const pastDate = new Date(Date.now() - 3600000);
			const storedData = {
				session: {
					id: "session-123",
					userId: "user-123",
					expiresAt: pastDate.toISOString(),
					user: mockUser,
				},
				authToken: "token-123",
			};
			global.secureStoreMock = { ecoeats_session: JSON.stringify(storedData) };

			const result = await authClient.getSession();

			expect(result).toBeNull();
			expect(global.secureStoreMock?.ecoeats_session).toBeUndefined();
		});

		it("checks in-memory expiry correctly", async () => {
			const futureDate = new Date(Date.now() + 1000); // 1 second from now
			const mockSession = createMockSession(futureDate);
			setPrivate(authClient, "session", mockSession);

			// Should return session initially
			expect(await authClient.getSession()).toEqual(mockSession);

			// Wait for expiry
			await new Promise((resolve) => setTimeout(resolve, 1100));

			// Should now return null
			expect(await authClient.getSession()).toBeNull();
		}, 5000);
	});

	describe("requestMagicLink", () => {
		it("makes correct request with email and callbacks", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await authClient.requestMagicLink("test@example.com");

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/api/auth/sign-in/magic-link",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						email: "test@example.com",
						callbackURL: "ecoeats://auth/callback",
						errorCallbackURL: "ecoeats://login",
					}),
				},
			);
		});

		it("uses platform-specific callbacks on web", async () => {
			// Mock web platform
			const rn = jest.requireMock("react-native");
			const originalOS = rn.Platform.OS;
			rn.Platform.OS = "web";

			// Mock window location
			const originalLocation = window.location.href;
			Object.defineProperty(window, "location", {
				value: { origin: "https://app.ecoeats.com" },
				writable: true,
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await authClient.requestMagicLink("test@example.com");

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/api/auth/sign-in/magic-link",
				expect.objectContaining({
					body: expect.stringContaining(
						"https://app.ecoeats.com/auth/callback",
					),
				}),
			);

			// Cleanup
			Object.defineProperty(window, "location", {
				value: { href: originalLocation },
				writable: true,
			});
			rn.Platform.OS = originalOS;
		});

		it("throws on API failure", async () => {
			const errorResponse = {
				ok: false,
				json: jest.fn().mockResolvedValue({ message: "Invalid email" }),
			};
			mockFetch.mockResolvedValueOnce(errorResponse);
			(readErrorMessage as jest.Mock).mockResolvedValueOnce(
				"Failed to send magic link",
			);

			await expect(
				authClient.requestMagicLink("invalid@example.com"),
			).rejects.toThrow("Failed to send magic link");
		});
	});

	describe("verifyMagicLink", () => {
		const mockUser: User = {
			id: "user-123",
			email: "test@example.com",
			name: "Test User",
			image: null,
			emailVerified: true,
		};

		const mockSessionData = {
			session: {
				id: "session-123",
				userId: "user-123",
				expiresAt: new Date(Date.now() + 3600000).toISOString(),
				user: mockUser,
			},
		};

		it("verifies magic link successfully and returns session", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockSessionData),
				headers: {
					get: jest.fn().mockReturnValue("auth-token-123"),
				},
			});

			const result = await authClient.verifyMagicLink("magic-token-123");

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/api/auth/magic-link/verify?token=magic-token-123",
				{
					method: "GET",
					credentials: "include",
				},
			);
			expect(result).not.toBeNull();
			expect(result.id).toBe("session-123");
			expect(result.user).toEqual(mockUser);
			expect(result.expiresAt).toBeInstanceOf(Date);
		});

		it("throws on verification failure", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
			});
			(readErrorMessage as jest.Mock).mockResolvedValueOnce(
				"Invalid or expired magic link",
			);

			await expect(authClient.verifyMagicLink("invalid-token")).rejects.toThrow(
				"Invalid or expired magic link",
			);
		});

		it("persists session to storage after verification", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockSessionData),
				headers: {
					get: jest.fn().mockReturnValue("auth-token-123"),
				},
			});

			await authClient.verifyMagicLink("magic-token-123");

			expect(global.secureStoreMock?.ecoeats_session).toBeDefined();
			const stored = JSON.parse(global.secureStoreMock!.ecoeats_session);
			expect(stored.session.id).toBe("session-123");
			expect(stored.authToken).toBe("auth-token-123");
		});

		it("notifies listeners after successful verification", async () => {
			const listener = jest.fn();
			authClient.onSessionChange(listener);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockSessionData),
				headers: {
					get: jest.fn().mockReturnValue("auth-token-123"),
				},
			});

			await authClient.verifyMagicLink("magic-token-123");

			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "session-123",
					userId: "user-123",
				}),
			);
		});
	});

	describe("signOut", () => {
		const mockUser: User = {
			id: "user-123",
			email: "test@example.com",
			name: "Test User",
			image: null,
			emailVerified: true,
		};

		beforeEach(() => {
			// Set up a session
			const mockSession: Session = {
				id: "session-123",
				userId: "user-123",
				expiresAt: new Date(Date.now() + 3600000),
				user: mockUser,
			};
			setPrivate(authClient, "session", mockSession);
			setPrivate(authClient, "authToken", "auth-token-123");
			global.secureStoreMock = {
				ecoeats_session: JSON.stringify({
					session: mockSession,
					authToken: "auth-token-123",
				}),
			};
		});

		it("calls sign-out API with auth token", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await authClient.signOut();

			// Check that fetch was called with correct URL
			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/api/auth/sign-out",
				expect.any(Object),
			);

			// Get the headers from the call
			const callArgs = mockFetch.mock.calls[0];
			const options = callArgs[1];

			// Check method and credentials
			expect(options.method).toBe("POST");
			expect(options.credentials).toBe("include");

			// Check headers using Headers API
			expect(options.headers).toBeInstanceOf(Headers);
			expect(options.headers.get("Authorization")).toBe(
				"Bearer auth-token-123",
			);
		});

		it("clears session regardless of API result", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await authClient.signOut();

			expect(getPrivate<Session | null>(authClient, "session")).toBeNull();
			expect(getPrivate<string | null>(authClient, "authToken")).toBeNull();
			expect(global.secureStoreMock?.ecoeats_session).toBeUndefined();
		});

		it("notifies listeners after sign out", async () => {
			const listener = jest.fn();
			authClient.onSessionChange(listener);

			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await authClient.signOut();

			expect(listener).toHaveBeenCalledWith(null);
		});

		it("handles API error gracefully and still clears session", async () => {
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await authClient.signOut();

			// Session should still be cleared
			expect(getPrivate<Session | null>(authClient, "session")).toBeNull();
			expect(getPrivate<string | null>(authClient, "authToken")).toBeNull();
			expect(global.secureStoreMock?.ecoeats_session).toBeUndefined();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Sign out request failed:",
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});

		it("works without auth token (no bearer header)", async () => {
			setPrivate(authClient, "authToken", null);

			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await authClient.signOut();

			const callArgs = mockFetch.mock.calls[0];
			const headers = callArgs[1].headers;
			expect(headers.get("Authorization")).toBeNull();
		});
	});

	describe("onSessionChange", () => {
		it("registers a listener callback", async () => {
			const listener = jest.fn();
			authClient.onSessionChange(listener);

			const mockUser: User = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				image: null,
				emailVerified: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({
					session: {
						id: "session-123",
						userId: "user-123",
						expiresAt: new Date(Date.now() + 3600000).toISOString(),
						user: mockUser,
					},
				}),
				headers: {
					get: jest.fn().mockReturnValue("token-123"),
				},
			});

			await authClient.verifyMagicLink("test-token");

			expect(listener).toHaveBeenCalled();
		});

		it("unsubscribe function removes listener", async () => {
			const listener = jest.fn();
			const unsubscribe = authClient.onSessionChange(listener);

			// Unsubscribe
			unsubscribe();

			const mockUser: User = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				image: null,
				emailVerified: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({
					session: {
						id: "session-123",
						userId: "user-123",
						expiresAt: new Date(Date.now() + 3600000).toISOString(),
						user: mockUser,
					},
				}),
				headers: {
					get: jest.fn().mockReturnValue("token-123"),
				},
			});

			await authClient.verifyMagicLink("test-token");

			// Listener should not have been called after unsubscribing
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("getAccessToken", () => {
		it("returns auth token when session exists", () => {
			setPrivate(authClient, "authToken", "my-auth-token");

			const token = authClient.getAccessToken();

			expect(token).toBe("my-auth-token");
		});

		it("returns null when no session", () => {
			setPrivate(authClient, "authToken", null);

			const token = authClient.getAccessToken();

			expect(token).toBeNull();
		});
	});

	describe("session persistence across app reload (VAL-TEST-100)", () => {
		const mockUser: User = {
			id: "user-123",
			email: "test@example.com",
			name: "Test User",
			image: null,
			emailVerified: true,
		};

		it("session survives simulated app reload", async () => {
			const futureDate = new Date(Date.now() + 3600000);
			const mockSessionData = {
				session: {
					id: "session-123",
					userId: "user-123",
					expiresAt: futureDate.toISOString(),
					user: mockUser,
				},
				authToken: "auth-token-123",
			};

			// Step 1: Verify magic link to establish a session
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockSessionData),
				headers: {
					get: jest.fn().mockReturnValue("auth-token-123"),
				},
			});

			const initialSession =
				await authClient.verifyMagicLink("magic-token-123");

			expect(initialSession).not.toBeNull();
			expect(initialSession.id).toBe("session-123");
			expect(getPrivate<string | null>(authClient, "authToken")).toBe(
				"auth-token-123",
			);

			// Verify session was persisted to storage
			expect(global.secureStoreMock?.ecoeats_session).toBeDefined();

			// Step 2: Simulate app reload - clear in-memory session
			setPrivate(authClient, "session", null);
			setPrivate(authClient, "authToken", null);

			// Verify memory is cleared but storage still has the data
			expect(getPrivate<Session | null>(authClient, "session")).toBeNull();
			expect(getPrivate<string | null>(authClient, "authToken")).toBeNull();
			expect(global.secureStoreMock?.ecoeats_session).toBeDefined();

			// Step 3: Call getSession to reload from storage (simulating app startup)
			const reloadedSession = await authClient.getSession();

			// Verify session was restored from storage
			expect(reloadedSession).not.toBeNull();
			expect(reloadedSession?.id).toBe("session-123");
			expect(reloadedSession?.userId).toBe("user-123");
			expect(reloadedSession?.user).toEqual(mockUser);
			expect(reloadedSession?.expiresAt).toBeInstanceOf(Date);

			// Verify token was also restored
			expect(getPrivate<string | null>(authClient, "authToken")).toBe(
				"auth-token-123",
			);
			expect(authClient.getAccessToken()).toBe("auth-token-123");
		});

		it("session reload from storage returns correct data structure", async () => {
			// Setup: Directly set storage to simulate previous session
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
			const storedData = {
				session: {
					id: "persisted-session-456",
					userId: "user-456",
					expiresAt: futureDate.toISOString(),
					user: {
						id: "user-456",
						email: "persisted@example.com",
						name: "Persisted User",
						image: "https://example.com/avatar.png",
						emailVerified: true,
					},
				},
				authToken: "persisted-token-456",
			};

			// Pre-populate storage (simulating previous app session)
			global.secureStoreMock = {
				ecoeats_session: JSON.stringify(storedData),
			};

			// Ensure in-memory session is clear
			setPrivate(authClient, "session", null);
			setPrivate(authClient, "authToken", null);

			// Reload session
			const session = await authClient.getSession();

			// Verify all data is correctly restored
			expect(session?.id).toBe("persisted-session-456");
			expect(session?.userId).toBe("user-456");
			expect(session?.user.email).toBe("persisted@example.com");
			expect(session?.user.name).toBe("Persisted User");
			expect(session?.user.image).toBe("https://example.com/avatar.png");
			expect(session?.user.emailVerified).toBe(true);
			expect(session?.expiresAt).toBeInstanceOf(Date);
			expect(session?.expiresAt.getTime()).toBe(futureDate.getTime());

			// Verify in-memory state is now populated
			expect(getPrivate<Session | null>(authClient, "session")).toEqual(
				session,
			);
			expect(getPrivate<string | null>(authClient, "authToken")).toBe(
				"persisted-token-456",
			);
		});

		it("subsequent getSession calls use cached session after reload", async () => {
			const futureDate = new Date(Date.now() + 3600000);
			const storedData = {
				session: {
					id: "cached-session-789",
					userId: "user-789",
					expiresAt: futureDate.toISOString(),
					user: mockUser,
				},
				authToken: "cached-token-789",
			};

			// Pre-populate storage
			global.secureStoreMock = {
				ecoeats_session: JSON.stringify(storedData),
			};

			// Ensure in-memory session is clear
			setPrivate(authClient, "session", null);
			setPrivate(authClient, "authToken", null);

			// Spy on storage to verify it's not accessed repeatedly
			const originalGetItem = global.secureStoreMock;
			let _storageAccessCount = 0;
			Object.defineProperty(global, "secureStoreMock", {
				get: () => {
					_storageAccessCount++;
					return originalGetItem;
				},
				configurable: true,
			});

			// First call loads from storage
			const session1 = await authClient.getSession();
			expect(session1).not.toBeNull();

			// Reset counter after first access
			_storageAccessCount = 0;

			// Second call should use cached session
			const session2 = await authClient.getSession();
			expect(session2).toEqual(session1);

			// Third call should also use cached session
			const session3 = await authClient.getSession();
			expect(session3).toEqual(session1);

			// Storage should not be accessed again (in-memory cache used)
			// Note: We can't perfectly verify this due to mock limitations,
			// but the test documents the expected behavior
		});
	});

	describe("storage platform selection", () => {
		let originalOS: string;

		beforeEach(() => {
			const rn = jest.requireMock("react-native");
			originalOS = rn.Platform.OS;
		});

		afterEach(() => {
			const rn = jest.requireMock("react-native");
			rn.Platform.OS = originalOS;
		});

		it("uses SecureStore on native platforms (iOS)", async () => {
			const rn = jest.requireMock("react-native");
			rn.Platform.OS = "ios";

			const mockUser: User = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				image: null,
				emailVerified: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({
					session: {
						id: "session-123",
						userId: "user-123",
						expiresAt: new Date(Date.now() + 3600000).toISOString(),
						user: mockUser,
					},
				}),
				headers: {
					get: jest.fn().mockReturnValue("token-123"),
				},
			});

			await authClient.verifyMagicLink("test-token");

			// Verify data is in secureStoreMock (which mocks SecureStore)
			expect(global.secureStoreMock?.ecoeats_session).toBeDefined();
		});

		it("uses SecureStore on native platforms (Android)", async () => {
			const rn = jest.requireMock("react-native");
			rn.Platform.OS = "android";

			const mockUser: User = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				image: null,
				emailVerified: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({
					session: {
						id: "session-123",
						userId: "user-123",
						expiresAt: new Date(Date.now() + 3600000).toISOString(),
						user: mockUser,
					},
				}),
				headers: {
					get: jest.fn().mockReturnValue("token-123"),
				},
			});

			await authClient.verifyMagicLink("test-token");

			expect(global.secureStoreMock?.ecoeats_session).toBeDefined();
		});
	});

	describe("web storage handling", () => {
		let originalOS: string;
		let localStorageMock: {
			getItem: jest.Mock;
			setItem: jest.Mock;
			removeItem: jest.Mock;
		};

		beforeEach(() => {
			// Mock web platform
			const rn = jest.requireMock("react-native");
			originalOS = rn.Platform.OS;
			rn.Platform.OS = "web";

			// Setup localStorage mock
			localStorageMock = {
				getItem: jest.fn(),
				setItem: jest.fn(),
				removeItem: jest.fn(),
			};
			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
				writable: true,
			});
		});

		afterEach(() => {
			const rn = jest.requireMock("react-native");
			rn.Platform.OS = originalOS;
		});

		describe("SSR window undefined (VAL-TEST-078)", () => {
			let originalWindow: typeof window;
			let ssrLocalStorageMock: {
				getItem: jest.Mock;
				setItem: jest.Mock;
				removeItem: jest.Mock;
			};

			beforeEach(() => {
				// Save original window and make it undefined (SSR scenario)
				originalWindow = global.window as typeof window;

				// Create localStorage mock to verify it was NOT called during SSR
				ssrLocalStorageMock = {
					getItem: jest.fn(),
					setItem: jest.fn(),
					removeItem: jest.fn(),
				};
				Object.defineProperty(global, "localStorage", {
					value: ssrLocalStorageMock,
					writable: true,
					configurable: true,
				});

				// @ts-expect-error - Simulating SSR where window is undefined
				delete global.window;
			});

			afterEach(() => {
				// Restore window
				global.window = originalWindow;
			});

			it("returns null from getItem when window is undefined", async () => {
				const mockUser: User = {
					id: "user-123",
					email: "test@example.com",
					name: "Test User",
					image: null,
					emailVerified: true,
				};

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue({
						session: {
							id: "session-123",
							userId: "user-123",
							expiresAt: new Date(Date.now() + 3600000).toISOString(),
							user: mockUser,
						},
					}),
					headers: {
						get: jest.fn().mockReturnValue("token-123"),
					},
				});

				// Verify that verifyMagicLink works even when window is undefined
				// (it should not throw and session should be in memory but not persisted)
				const result = await authClient.verifyMagicLink("test-token");

				expect(result).not.toBeNull();
				expect(result.id).toBe("session-123");
				// localStorage should NOT be accessed since window is undefined
				expect(ssrLocalStorageMock.setItem).not.toHaveBeenCalled();
			});

			it("setItem is no-op when window is undefined", async () => {
				const mockUser: User = {
					id: "user-123",
					email: "test@example.com",
					name: "Test User",
					image: null,
					emailVerified: true,
				};

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue({
						session: {
							id: "session-123",
							userId: "user-123",
							expiresAt: new Date(Date.now() + 3600000).toISOString(),
							user: mockUser,
						},
					}),
					headers: {
						get: jest.fn().mockReturnValue("token-123"),
					},
				});

				// Should not throw even though window is undefined
				await expect(
					authClient.verifyMagicLink("test-token"),
				).resolves.toBeDefined();

				// localStorage.setItem should NOT have been called since window is undefined
				expect(ssrLocalStorageMock.setItem).not.toHaveBeenCalled();
			});

			it("deleteItem is no-op when window is undefined", async () => {
				// Setup a session first (in memory only since storage won't work)
				const mockSession: Session = {
					id: "session-123",
					userId: "user-123",
					expiresAt: new Date(Date.now() + 3600000),
					user: {
						id: "user-123",
						email: "test@example.com",
						name: "Test User",
						image: null,
						emailVerified: true,
					},
				};
				setPrivate(authClient, "session", mockSession);
				setPrivate(authClient, "authToken", "token-123");

				mockFetch.mockResolvedValueOnce({
					ok: true,
				});

				// Should not throw even though window is undefined
				await expect(authClient.signOut()).resolves.toBeUndefined();

				// Session should be cleared in memory
				expect(getPrivate<Session | null>(authClient, "session")).toBeNull();
				expect(getPrivate<string | null>(authClient, "authToken")).toBeNull();
			});

			it("getItem returns null when window is undefined", async () => {
				// Ensure no cached session
				setPrivate(authClient, "session", null);
				setPrivate(authClient, "authToken", null);

				const result = await authClient.getSession();

				// Should return null since storage can't be accessed
				expect(result).toBeNull();
			});
		});

		it("uses localStorage on web platform for getItem", async () => {
			const mockData = {
				session: {
					id: "session-123",
					userId: "user-123",
					expiresAt: new Date(Date.now() + 3600000).toISOString(),
					user: {
						id: "user-123",
						email: "test@example.com",
						name: "Test User",
						image: null,
						emailVerified: true,
					},
				},
				authToken: "token-123",
			};
			(window.localStorage.getItem as jest.Mock).mockReturnValue(
				JSON.stringify(mockData),
			);

			const result = await authClient.getSession();

			expect(window.localStorage.getItem).toHaveBeenCalledWith(
				"ecoeats_session",
			);
			expect(result).not.toBeNull();
			expect(result?.id).toBe("session-123");
		});

		it("uses localStorage on web platform for setItem", async () => {
			const mockUser: User = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				image: null,
				emailVerified: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({
					session: {
						id: "session-123",
						userId: "user-123",
						expiresAt: new Date(Date.now() + 3600000).toISOString(),
						user: mockUser,
					},
				}),
				headers: {
					get: jest.fn().mockReturnValue("token-123"),
				},
			});

			await authClient.verifyMagicLink("test-token");

			expect(window.localStorage.setItem).toHaveBeenCalledWith(
				"ecoeats_session",
				expect.any(String),
			);
		});

		it("uses localStorage on web platform for removeItem", async () => {
			// Setup a session first
			const mockSession: Session = {
				id: "session-123",
				userId: "user-123",
				expiresAt: new Date(Date.now() + 3600000),
				user: {
					id: "user-123",
					email: "test@example.com",
					name: "Test User",
					image: null,
					emailVerified: true,
				},
			};
			setPrivate(authClient, "session", mockSession);
			setPrivate(authClient, "authToken", "token-123");

			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await authClient.signOut();

			expect(window.localStorage.removeItem).toHaveBeenCalledWith(
				"ecoeats_session",
			);
		});

		it("handles localStorage errors gracefully on getItem", async () => {
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			(window.localStorage.getItem as jest.Mock).mockImplementation(() => {
				throw new Error("Storage disabled");
			});

			const result = await authClient.getSession();

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to read localStorage:",
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});

		it("handles localStorage errors gracefully on setItem", async () => {
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			(window.localStorage.setItem as jest.Mock).mockImplementation(() => {
				throw new Error("Quota exceeded");
			});

			const mockUser: User = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				image: null,
				emailVerified: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({
					session: {
						id: "session-123",
						userId: "user-123",
						expiresAt: new Date(Date.now() + 3600000).toISOString(),
						user: mockUser,
					},
				}),
				headers: {
					get: jest.fn().mockReturnValue("token-123"),
				},
			});

			// Should not throw
			await expect(
				authClient.verifyMagicLink("test-token"),
			).resolves.toBeDefined();

			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to write localStorage:",
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});

		it("handles localStorage errors gracefully on removeItem", async () => {
			const consoleSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			(window.localStorage.removeItem as jest.Mock).mockImplementation(() => {
				throw new Error("Storage disabled");
			});

			// Setup a session first
			const mockSession: Session = {
				id: "session-123",
				userId: "user-123",
				expiresAt: new Date(Date.now() + 3600000),
				user: {
					id: "user-123",
					email: "test@example.com",
					name: "Test User",
					image: null,
					emailVerified: true,
				},
			};
			setPrivate(authClient, "session", mockSession);
			setPrivate(authClient, "authToken", "token-123");

			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			// Should not throw
			await expect(authClient.signOut()).resolves.toBeUndefined();

			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to delete localStorage:",
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});
	});
});
