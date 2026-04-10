import type { Pool } from "pg";
import { type AppAuth, createAuth } from "./auth-core";
import { loadNodeConfig, type RuntimeConfig } from "./config";
import { createPool } from "./db";
import { createEmailSender } from "./email";

export interface AppRuntime {
	config: RuntimeConfig;
	db: Pool;
	auth: AppAuth;
}

export function createRuntime(config: RuntimeConfig): AppRuntime {
	const db = createPool(config);

	return {
		config,
		db,
		auth: createAuth({
			config,
			database: db,
			sendEmail: createEmailSender(config),
		}),
	};
}

let nodeRuntime: AppRuntime | null = null;

export function getNodeRuntime(): AppRuntime {
	if (!nodeRuntime) {
		nodeRuntime = createRuntime(loadNodeConfig());
	}

	return nodeRuntime;
}
