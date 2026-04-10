import { createApp } from "../server/app";
import { createRuntimeConfig } from "../server/config";
import { createRuntime } from "../server/runtime";

let cachedApp: ReturnType<typeof createApp> | null = null;

function getWorkerApp(env: Env) {
	if (!cachedApp) {
		const config = createRuntimeConfig({
			apiUrl: env.API_URL,
			databaseConnectionString: env.HYPERDRIVE.connectionString,
			authSecret: env.AUTH_SECRET,
			resendApiKey: env.RESEND_API_KEY,
			fromEmail: env.AUTH_FROM_EMAIL,
			allowedOrigins: env.CORS_ORIGINS,
		});
		cachedApp = createApp(createRuntime(config));
	}

	return cachedApp;
}

export default {
	fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> | Response {
		return getWorkerApp(env).fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
