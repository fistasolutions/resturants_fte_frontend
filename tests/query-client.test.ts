import { dehydrate } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  LIVE_QUERY_OPTIONS,
  QUERY_GC_TIME_MS,
  QUERY_STALE_TIME_MS,
  getQueryClient,
  makeQueryClient,
} from "@/lib/query-client";

describe("makeQueryClient (SPEC-230)", () => {
  it("applies the cache policy the spec fixes", () => {
    const queries = makeQueryClient().getDefaultOptions().queries;
    expect(queries?.staleTime).toBe(QUERY_STALE_TIME_MS);
    expect(queries?.gcTime).toBe(QUERY_GC_TIME_MS);
    expect(queries?.retry).toBe(1);
    expect(queries?.refetchOnWindowFocus).toBe(false);
    expect(QUERY_STALE_TIME_MS).toBe(60_000);
    expect(QUERY_GC_TIME_MS).toBe(30 * 60_000);
  });

  it("dehydrates a PENDING prefetch together with its promise — the streaming mechanism", async () => {
    const client = makeQueryClient();
    let resolve!: (value: string) => void;
    const inFlight = new Promise<string>((r) => {
      resolve = r;
    });
    void client.prefetchQuery({ queryKey: ["brief", "data", null], queryFn: () => inFlight });

    const state = dehydrate(client);
    expect(state.queries).toHaveLength(1);
    const [query] = state.queries;
    expect(query.queryKey).toEqual(["brief", "data", null]);
    expect(query.state.status).toBe("pending");
    expect(query.promise).toBeInstanceOf(Promise);

    resolve("landed");
    await expect(query.promise).resolves.toBe("landed");
  });

  it("still dehydrates settled queries (the default behaviour is kept, not replaced)", async () => {
    const client = makeQueryClient();
    await client.prefetchQuery({ queryKey: ["store", "current-user"], queryFn: async () => ({ name: "M" }) });
    const [query] = dehydrate(client).queries;
    expect(query.state.status).toBe("success");
    expect(query.state.data).toEqual({ name: "M" });
    expect(query.promise).toBeUndefined();
  });

  it("does not dehydrate a failed query by default (no server error text reaches the browser)", async () => {
    const client = makeQueryClient();
    await client.prefetchQuery({
      queryKey: ["brief", "attention"],
      queryFn: async () => {
        throw new Error("postgres: relation does not exist");
      },
      retry: 0,
    });
    expect(dehydrate(client).queries).toHaveLength(0);
  });

  it("hands the server a fresh client per call (never shared between requests)", () => {
    // Vitest runs in node, where TanStack's `isServer` is true.
    expect(getQueryClient()).not.toBe(getQueryClient());
  });

  it("LIVE_QUERY_OPTIONS carries SPEC-021's auto-refresh contract", () => {
    expect(LIVE_QUERY_OPTIONS).toEqual({
      staleTime: 30_000,
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    });
  });
});
