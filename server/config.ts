import { DEFAULT_PORT } from "./constants";

const DEFAULT_ALLOWED_ORIGINS = [
	"http://localhost:8081",
	"http://localhost:3000",
	"http://localhost:3001",
	"ecoeats://",
];

export interface RuntimeConfig {
	port: number;
	apiUrl: string;
	databaseConnectionString: string;
	authSecret: string;
	resendApiKey: string;
	fromEmail: string;
	allowedOrigins: string[];
}

interface RuntimeConfigInput {
	port?: number | string;
	apiUrl?: string;
	databaseConnectionString?: string;
	authSecret?: string;
	resendApiKey?: string;
	fromEmail?: string;
	allowedOrigins?: string[] | string;
}

function normalizePort(value?: number | string): number {
	const port = Number(value ?? DEFAULT_PORT);

	if (!Number.isFinite(port) || port <= 0) {
		return DEFAULT_PORT;
	}

	return port;
}

function normalizeAllowedOrigins(value?: string[] | string): string[] {
	if (Array.isArray(value)) {
		return value.length > 0 ? value : DEFAULT_ALLOWED_ORIGINS;
	}

	if (!value) {
		return DEFAULT_ALLOWED_ORIGINS;
	}

	const origins = value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
}

export function createRuntimeConfig(input: RuntimeConfigInput): RuntimeConfig {
	const config: RuntimeConfig = {
		port: normalizePort(input.port),
		apiUrl: input.apiUrl || "http://localhost:3001",
		databaseConnectionString: input.databaseConnectionString || "",
		authSecret: input.authSecret || "",
		resendApiKey: input.resendApiKey || "",
		fromEmail: input.fromEmail || "EcoEats <noreply@ecoeats.app>",
		allowedOrigins: normalizeAllowedOrigins(input.allowedOrigins),
	};

	validateRuntimeConfig(config);

	return config;
}

export function loadNodeConfig(
	env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
	return createRuntimeConfig({
		port: env.PORT,
		apiUrl: env.API_URL,
		databaseConnectionString: env.DATABASE_URL,
		authSecret: env.AUTH_SECRET,
		resendApiKey: env.RESEND_API_KEY,
		fromEmail: env.AUTH_FROM_EMAIL,
		allowedOrigins: env.CORS_ORIGINS || env.TRUSTED_ORIGINS,
	});
}

function validateRuntimeConfig(
	config: Pick<RuntimeConfig, "databaseConnectionString" | "authSecret">,
): void {
	if (!config.databaseConnectionString) {
		throw new Error("Missing required database connection string");
	}

	if (!config.authSecret) {
		throw new Error("Missing required AUTH_SECRET");
	}
}
