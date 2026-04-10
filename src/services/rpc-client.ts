import { type ClientRequestOptions, hc } from "hono/client";
import type { AppType } from "../../server/app";
import { authClient } from "./auth-client";
import { readErrorMessage } from "./request";
import { buildServerUrl } from "./server-config";

export const rpcClient = hc<AppType>(buildServerUrl("/"), {
	headers: async (): Promise<Record<string, string>> => {
		await authClient.getSession();
		const token = authClient.getAccessToken();

		if (!token) {
			return {};
		}

		return {
			Authorization: `Bearer ${token}`,
		};
	},
	init: {
		credentials: "include",
	},
});

export function rpcOptions(
	fallbackError: string = "Request failed",
): ClientRequestOptions {
	return {
		fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
			const response = await fetch(input, init);

			if (!response.ok) {
				throw new Error(await readErrorMessage(response, fallbackError));
			}

			return response;
		},
	};
}

export async function readRpcJson<T>(
	response: Pick<Response, "json">,
): Promise<T> {
	return (await response.json()) as T;
}
