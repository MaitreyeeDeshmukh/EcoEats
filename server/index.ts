import { serve } from "@hono/node-server";
import { app } from "./app";
import { serverConfig, validateServerConfig } from "./config";

validateServerConfig();

serve(
	{
		fetch: app.fetch,
		port: serverConfig.port,
	},
	(info) => {
		console.log(`EcoEats API listening on http://localhost:${info.port}`);
	},
);
