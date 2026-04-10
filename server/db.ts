import { Pool } from "pg";
import { serverConfig, validateServerConfig } from "./config";

validateServerConfig();

export const pool = new Pool({
	connectionString: serverConfig.databaseUrl,
	max: 10,
});
