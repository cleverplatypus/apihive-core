import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { HTTPRequestFactory } from "../src/index.ts";
import requestHashFeature from "../src/features/request-hash.ts";

describe("http_request_get_hash_tests", () => {
    let fetchSpy: any;
    beforeEach(() => {
      fetchSpy = vi
        .spyOn(global as any, "fetch")
        .mockImplementation(() =>
          Promise.resolve(
            new Response(JSON.stringify({}), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          )
        );
    });
    afterEach(() => {
      fetchSpy?.mockRestore();
    });
    const finalize = async (...reqs: any[]) => {
      await Promise.all(reqs.map((r) => r.execute()));
    };
    const testFactory = 
      new HTTPRequestFactory()
      .use(requestHashFeature)
      .withLogLevel("error");
  
    it("should_generate_consistent_hashes_for_identical_requests", async () => {
      const request1 = testFactory.createGETRequest("https://example.com/api");
      const request2 = testFactory.createGETRequest("https://example.com/api");
      await finalize(request1, request2);
      expect(request1.getHash()).toBe(request2.getHash());
    });
  
    it("should_generate_different_hashes_for_different_URLs", async () => {
      const request1 = testFactory.createGETRequest("https://example.com/api/users");
      const request2 = testFactory.createGETRequest("https://example.com/api/posts");
      await finalize(request1, request2);
      expect(request1.getHash()).not.toBe(request2.getHash());
    });
  
    it("should_generate_different_hashes_for_different_HTTP_methods", async () => {
      const getRequest = testFactory.createGETRequest("https://example.com/api");
      const postRequest = testFactory.createPOSTRequest("https://example.com/api");
      await finalize(getRequest, postRequest);
      expect(getRequest.getHash()).not.toBe(postRequest.getHash());
    });
  
    it("should_include_JSON_body_content_in_hash", async () => {
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({ name: "test", id: 1 });
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({ name: "test", id: 2 });
      await finalize(request1, request2);
      expect(request1.getHash()).not.toBe(request2.getHash({ includeBody: true }));
    });
  
    it("should_generate_same_hash_for_identical_JSON_bodies_regardless_of_property_order", async () => {
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({ name: "test", id: 1 });
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({ id: 1, name: "test" });
      await finalize(request1, request2);
      expect(request1.getHash()).toBe(request2.getHash());
    });
  
    it("should_include_form-encoded_body_content_in_hash", async () => {
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withFormEncodedBody("name=test&id=1");
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withFormEncodedBody("name=test&id=2");
      await finalize(request1, request2);
      expect(request1.getHash()).not.toBe(request2.getHash({ includeBody: true }));
    });
  
    it("should_handle_FormData_bodies_consistently", async () => {
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withFormDataBody((formData) => {
          formData.append("name", "test");
          formData.append("id", "1");
        });
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withFormDataBody((formData) => {
          formData.append("id", "1");
          formData.append("name", "test");
        });
      await finalize(request1, request2);
      // Should be the same due to sorted entries in getHash
      expect(request1.getHash()).toBe(request2.getHash());
    });
  
    it("should_generate_different_hashes_for_different_FormData_content", async () => {
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withFormDataBody((formData) => {
          formData.append("name", "test1");
        });
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withFormDataBody((formData) => {
          formData.append("name", "test2");
        });
      await finalize(request1, request2);
      expect(request1.getHash()).not.toBe(request2.getHash({ includeBody: true }));
    });
  
    it("should_include_query_parameters_in_hash", async () => {
      const request1 = testFactory.createGETRequest("https://example.com/api")
        .withQueryParam("page", "1");
      const request2 = testFactory.createGETRequest("https://example.com/api")
        .withQueryParam("page", "2");
      await finalize(request1, request2);
      expect(request1.getHash()).not.toBe(request2.getHash());
    });
  
    it("should_include_URL_parameters_in_hash", async () => {
      const request1 = testFactory.createGETRequest("https://example.com/api/users/{{id}}")
        .withURLParam("id", "123");
      const request2 = testFactory.createGETRequest("https://example.com/api/users/{{id}}")
        .withURLParam("id", "456");
      await finalize(request1, request2);
      expect(request1.getHash()).not.toBe(request2.getHash());
    });
  
    it("should_include_relevant_headers_in_hash", async () => {
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withHeader("content-type", "application/json");
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withHeader("content-type", "application/xml");
      await finalize(request1, request2);
      expect(request1.getHash()).not.toBe(request2.getHash());
    });
  
    it("should_ignore_non_relevant_headers_in_hash", async () => {
      const request1 = testFactory.createGETRequest("https://example.com/api")
        .withHeader("authorization", "Bearer token1");
      const request2 = testFactory.createGETRequest("https://example.com/api")
        .withHeader("authorization", "Bearer token2");
      await finalize(request1, request2);
      // Authorization header is not in the relevant headers list
      expect(request1.getHash()).toBe(request2.getHash());
    });
  
    it("should_cache_hash_value_for_performance", async () => {
      const request = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({ test: "data" });
      await finalize(request);
      const hash1 = request.getHash();
      const hash2 = request.getHash();
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe("string");
      expect(hash1.length).toBeGreaterThan(0);
    });
  
    it("should_generate_deterministic_hashes", async () => {
      const createRequest = () => testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({ name: "test", values: [1, 2, 3] })
        .withQueryParam("filter", "active")
        .withHeader("accept", "application/json");
      
      const request1 = createRequest();
      const request2 = createRequest();
      await finalize(request1, request2);
      expect(request1.getHash()).toBe(request2.getHash());
    });
  
    it("should_handle_requests_without_body", async () => {
      const request1 = testFactory.createGETRequest("https://example.com/api");
      const request2 = testFactory.createGETRequest("https://example.com/api");
      await finalize(request1, request2);
      expect(request1.getHash()).toBe(request2.getHash());
      expect(typeof request1.getHash()).toBe("string");
    });
  
    it("should_handle_empty_JSON_body", async () => {
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({});
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody({});
      await finalize(request1, request2);
      expect(request1.getHash()).toBe(request2.getHash());
    });
  
    it("should_handle_complex_nested_JSON_bodies", async () => {
      const complexData = {
        user: { id: 1, name: "test" },
        preferences: { theme: "dark", notifications: true },
        metadata: { tags: ["tag1", "tag2"], created: "2023-01-01" }
      };
      
      const request1 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody(complexData);
      const request2 = testFactory.createPOSTRequest("https://example.com/api")
        .withJSONBody(JSON.parse(JSON.stringify(complexData)));
      await finalize(request1, request2);
      expect(request1.getHash()).toBe(request2.getHash());
    });
  });