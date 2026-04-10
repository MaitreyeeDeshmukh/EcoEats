const DEFAULT_ALLOWED_ORIGINS = [
	"http://localhost:8081",
	"http://localhost:3000",
	"http://localhost:3001",
	"ecoeats://",
];

function readRequiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function readAllowedOrigins(): string[] {
	const raw = process.env.CORS_ORIGINS || process.env.TRUSTED_ORIGINS;
	if (!raw) {
		return DEFAULT_ALLOWED_ORIGINS;
	}

	return raw
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

export const serverConfig = {
	port: Number(process.env.PORT || 3001),
	apiUrl: process.env.API_URL || "http://localhost:3001",
	databaseUrl: process.env.DATABASE_URL || "",
	authSecret: process.env.AUTH_SECRET || "",
	resendApiKey: process.env.RESEND_API_KEY || "",
	fromEmail: process.env.AUTH_FROM_EMAIL || "EcoEats <noreply@ecoeats.app>",
	allowedOrigins: readAllowedOrigins(),
};

export function validateServerConfig(): void {
	if (!serverConfig.databaseUrl) {
		readRequiredEnv("DATABASE_URL");
	}
	if (!serverConfig.authSecret) {
		readRequiredEnv("AUTH_SECRET");
	}
}
