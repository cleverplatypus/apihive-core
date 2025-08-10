import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HTTPRequestFactory } from "../src/HTTPRequestFactory.ts";

// Helper to mock fetch with a given body and content-type
function mockFetch(body: string | Uint8Array, contentType?: string, init: Partial<ResponseInit> = {}) {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = contentType;
  const response = new Response(body as any, {
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    headers,
  });
  return vi.spyOn(global, "fetch").mockResolvedValue(response as any);
}

describe("MIME type handling", () => {
  let factory: HTTPRequestFactory;

  beforeEach(() => {
    factory = new HTTPRequestFactory().withLogLevel("none");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses application/json as JSON", async () => {
    const fetchSpy = mockFetch('{"a":1}', "application/json");
    const res = await factory.createGETRequest("https://example.com/json").execute();
    expect(res).toEqual({ a: 1 });
    fetchSpy.mockRestore();
  });

  it("parses application/problem+json as JSON (structured suffix)", async () => {
    const fetchSpy = mockFetch('{"err":"boom"}', "application/problem+json");
    const res = await factory.createGETRequest("https://example.com/problem-json").execute();
    expect(res).toEqual({ err: "boom" });
    fetchSpy.mockRestore();
  });

  it("parses text/plain as text", async () => {
    const fetchSpy = mockFetch("hello world", "text/plain");
    const res = await factory.createGETRequest("https://example.com/text").execute();
    expect(res).toBe("hello world");
    fetchSpy.mockRestore();
  });

  it("parses application/atom+xml as text (XML family)", async () => {
    const xml = "<feed><title>Test</title></feed>";
    const fetchSpy = mockFetch(xml, "application/atom+xml");
    const res = await factory.createGETRequest("https://example.com/atom").execute();
    expect(res).toBe(xml);
    fetchSpy.mockRestore();
  });

  it("falls back to blob for unknown types", async () => {
    const bin = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const fetchSpy = mockFetch(bin, "application/octet-stream");
    const res = await factory.createGETRequest("https://example.com/blob").execute();
    expect(res).toBeInstanceOf(Blob);
    const buf = await (res as Blob).arrayBuffer();
    expect(new Uint8Array(buf)).toEqual(bin);
    fetchSpy.mockRestore();
  });

  it("factory.withJSONMimeTypes extends JSON patterns (e.g., application/csp-report)", async () => {
    const extended = new HTTPRequestFactory().withLogLevel("none").withJSONMimeTypes("^application/csp-report$");
    const fetchSpy = mockFetch('{"report":true}', "application/csp-report");
    const res = await extended.createGETRequest("https://example.com/csp").execute();
    expect(res).toEqual({ report: true });
    fetchSpy.mockRestore();
  });

  it("factory.withTextMimeTypes extends text patterns (e.g., application/graphql)", async () => {
    const extended = new HTTPRequestFactory().withLogLevel("none").withTextMimeTypes("^application/graphql$");
    const fetchSpy = mockFetch("query { me { id } }", "application/graphql");
    const res = await extended.createGETRequest("https://example.com/graphql").execute();
    expect(res).toBe("query { me { id } }");
    fetchSpy.mockRestore();
  });
});
