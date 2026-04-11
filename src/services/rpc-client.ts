import { type ClientRequestOptions, hc } from "hono/client";
import { AuthError, NetworkError } from "@/utils/errors";
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
			let response: Response;
			try {
				response = await fetch(input, init);
			} catch (_error) {
				throw new NetworkError(
					"Unable to connect to the server. Please check your internet connection and try again.",
				);
			}

			if (!response.ok) {
				const message = await readErrorMessage(response, fallbackError);

				// Map HTTP status codes to appropriate error types
				if (response.status === 401 || response.status === 403) {
					throw new AuthError(
						message || "Authentication failed. Please sign in again.",
					);
				}

				throw new NetworkError(message);
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
