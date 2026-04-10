import { createAuth } from "./auth-core";
import { loadNodeConfig } from "./config";
import { createPool } from "./db";
import { createEmailSender } from "./email";

const config = loadNodeConfig();
const database = createPool(config);

export const auth = createAuth({
	config,
	database,
	sendEmail: createEmailSender(config),
});

export type { AuthSession } from "./auth-core";
