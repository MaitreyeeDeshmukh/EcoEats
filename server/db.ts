import { Pool } from "pg";
import type { RuntimeConfig } from "./config";

export function createPool(
	config: Pick<RuntimeConfig, "databaseConnectionString">,
): Pool {
	return new Pool({
		connectionString: config.databaseConnectionString,
		max: 5,
	});
}
