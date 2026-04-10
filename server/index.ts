import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { getNodeRuntime } from "./runtime";

const runtime = getNodeRuntime();
const app = createApp(runtime);

serve(
	{
		fetch: app.fetch,
		port: runtime.config.port,
	},
	(info) => {
		console.log(`EcoEats API listening on http://localhost:${info.port}`);
	},
);
