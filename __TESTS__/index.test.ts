import { describe, expect, it } from "vitest";
import HTTPError from "../src/HTTPError.ts";
import { HTTPRequestFactory, RequestConfig } from "../src/index.ts";
import requestHashFeature from "../src/features/request-hash.ts";

const factory = new HTTPRequestFactory().withLogLevel("debug");

factory
  .withAPIConfig({
    name: "simple-api",
    baseURL: "https://httpbin.org",
    responseBodyTransformers: (body, request) => {
      if (request.meta?.api?.endpointName === "get-products") {
        body.json.data = Object.keys(body.json.data).map((key) => ({
          id: key,
          ...body.data[key],
        }));
      }
      return body.json;
    },
    headers: {
      accepts: "application/json",
    },
    endpoints: {
      bearer: {
        target: "/bearer",
      },
      "get-product-by-id": {
        method: "POST",
        target: "/anything",
      },
      "get-products": {
        target: "/anything",
        method: "POST",
      },
    },
  })
  .withLogLevel("error")
  .when((config) => {
    return config.meta?.api?.endpointName === "bearer";
  })
  .withHeaders({
    Authorization: () => `Bearer the-access-token`,
  });

  it("response_interceptor_applies_transformers_on_return_by_default", async () => {
    const factory = new HTTPRequestFactory().withAPIConfig({
      name: "transform-on-return",
      baseURL: "https://httpbin.org",
      // Transformer will unwrap objects of the shape { wrapped: any }
      responseBodyTransformers: (body: any) => {
        if (body && typeof body === "object" && "wrapped" in body) {
          return (body as any).wrapped;
        }
        // Fallback to httpbin's json echo
        return body?.json ?? body;
      },
      endpoints: {
        post: { target: "/anything", method: "POST" },
      },
    });

    const payload = { a: 1, b: "two" };
    const result = await factory
      .createAPIRequest("transform-on-return", "post")
      .withJSONBody(payload)
      // Plain function => skipTransformersOnReturn defaults to false; transformers should run
      .withResponseInterceptors(async (resp) => {
        const data = await resp.json();
        return { wrapped: data.json };
      })
      .execute();

    expect(result).toEqual(payload);
  });

  it("api_config_response_interceptors_registration_respects_skip_flag", async () => {
    const factory = new HTTPRequestFactory().withAPIConfig({
      name: "api-config-interceptors",
      baseURL: "https://httpbin.org",
      responseBodyTransformers: (body: any) => {
        // This would unwrap if it ran
        if (body && typeof body === "object" && "wrapped" in body) {
          return (body as any).wrapped;
        }
        return body?.json ?? body;
      },
      responseInterceptors: {
        interceptor: async (resp) => {
          const data = await resp.json();
          return { wrapped: data.json };
        },
        skipTransformersOnReturn: true,
      },
      endpoints: {
        post: { target: "/anything", method: "POST" },
      },
    });

    const payload = { x: 42 };
    const result = await factory
      .createAPIRequest("api-config-interceptors", "post")
      .withJSONBody(payload)
      .execute();

    expect(result).toHaveProperty("wrapped");
    expect(result.wrapped).toEqual(payload);
  });

describe("HTTP Tests", () => {
  it("test_post_request", async () => {
    const array = ["words", "to", "return"];
    await expect(
      (async () => {
        const { json } = await factory
          .createPOSTRequest("https://httpbin.org/anything")
          .withJSONBody(array)
          .execute();
        return json;
      })()
    ).resolves.toEqual(array);
  });

  it("test_transformed_response_body", async () => {
    const response = await factory
      .createAPIRequest("simple-api", "get-products")
      .withJSONBody({
        status: "ok",
        data: {
          "123": {
            name: "Product 123",
          },
          "456": {
            name: "Product 456",
          },
        },
      })
      .execute();
    expect(Array.isArray(response.data)).toBeTruthy();
    expect(response.data).toHaveLength(2);
    expect(response.data[0].id).toBe("123");
    expect(response.data[1].id).toBe("456");
  });

  it("test_put_request", async () => {
    const array = ["words", "to", "return"];
    await expect(
      (async () => {
        const { json } = await factory
          .createPUTRequest("https://httpbin.org/anything")
          .withJSONBody(array)
          .execute();
        return json;
      })()
    ).resolves.toEqual(array);  });
  it("test_patch_request", async () => {
    const array = ["words", "to", "return"];
    await expect(
      (async () => {
        const { json } = await factory
          .createPATCHRequest("https://httpbin.org/anything")
          .withJSONBody(array)
          .execute();
        return json;
      })()
    ).resolves.toEqual(array);  });
  it("test_get_api_request_with_param", async () => {
    const result = await factory
      .createAPIRequest("simple-api", "get-product-by-id")
      .withURLParam("productId", "123")
      .withJSONBody({
        status: "ok",
        data: {
          id: "123",
          name: "Product 123",
        },
      })
      .execute();

    expect(result.status).toEqual("ok");
    expect(result.data).toEqual({
      id: "123",
      name: "Product 123",
    });
  });
  it("test_conditional_auth_headers_happy_path", async () => {
    await expect(
      factory.createAPIRequest("simple-api", "bearer").execute()
    ).resolves.not.toThrowError();
  });
  it("test_conditional_auth_headers_failure", async () => {
    try {
      await factory
        .createAPIRequest("simple-api", "bearer")
        .blank() //get rid of auto-headers
        .withURLParam("productId", "123")
        .execute();
    } catch (e) {
      expect(e).toBeInstanceOf(HTTPError);
      expect(e).toHaveProperty("code", 401);
      expect(e.isUnauthorized()).toBeTruthy();
      expect(e.message).toEqual("UNAUTHORIZED");
    }
  });

  it("test_modified_response_from_interceptor", async () => {
    const result = await factory
      .createAPIRequest("simple-api", "get-product-by-id")
      .withURLParam("productId", "123")
      .withResponseInterceptors({interceptor: async (fetchResponse) => {
        const data = await fetchResponse.json();
        return {
          wrapped: data,
        };
      }, skipTransformersOnReturn: true})
      .execute();
    expect(result).toHaveProperty("wrapped");
  });

  it("test_untouched_response_through_interceptor", async () => {
    const result = await factory
      .createAPIRequest("simple-api", "get-product-by-id")
      .withURLParam("productId", "123")
      .withJSONBody({
        status: "ok",
        data: {
          id: "123",
          secret: "secret",
          name: "Product 123",
        },
      })
      .withResponseInterceptors(async () => {})
      .execute();
    expect(result).toHaveProperty("status", "ok");
  });

  it("test_request_with_query_params", async () => {
    const url = "https://jsonplaceholder.typicode.com/posts";
    const queryParams = {
      userId: 1,
      id: 1,
    };
    const request = factory.createGETRequest(url);
    request.withQueryParams(queryParams);
    const response = await request.execute();
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });

  it("test_timeout", async () => {
    try {
      await factory
        .createGETRequest("https://httpbin.org/delay/3000")
        .withTimeout(1000)
        .execute();
    } catch (e) {
      expect(e).toBeInstanceOf(HTTPError);
      expect(e.isAborted()).toBeTruthy();
    }
  });

  it("test_factory_error_interceptors", async () => {
    const factory = new HTTPRequestFactory();
    let handled: boolean[] = [];
    factory.withErrorInterceptors(async (error: HTTPError) => {
      return new Promise((resolve) => {
        const result = error.code === 401;
        handled.push(result);
        resolve(result);
      });
    });
    await expect(
      factory.createGETRequest("https://httpbin.org/status/401").execute()
    ).rejects.toThrowError(HTTPError);
    expect(handled).toEqual([true]);
  });

  it("test_api_error_interceptors", async () => {
    const responses: boolean[] = [];

    const factory = new HTTPRequestFactory().withAPIConfig({
      name: "error-interceptors",
      errorInterceptors: (error: HTTPError) => {
        const result = error.code >= 500;
        responses.push(result);
        return result;
      },
      endpoints: {
        error: {
          target: "https://httpbin.org/status/{{code}}",
        },
      },
    });
    await expect(
      factory
        .createAPIRequest("error-interceptors", "error")
        .withURLParam("code", "500")
        .execute()
    ).rejects.toThrowError(HTTPError);
    await expect(
      factory
        .createAPIRequest("error-interceptors", "error")
        .withURLParam("code", "501")
        .execute()
    ).rejects.toThrowError(HTTPError);
    await expect(
      factory
        .createAPIRequest("error-interceptors", "error")
        .withURLParam("code", "400")
        .execute()
    ).rejects.toThrowError(HTTPError);
    expect(responses).toEqual([true, true, false]);
  });

  it("test_request_with_query_params", async () => {
    const url = "https://jsonplaceholder.typicode.com/posts";
    const queryParams = {
      userId: 1,
      id: 1,
    };
    const request = factory.createGETRequest(url);
    request.withQueryParams(queryParams);
    const response = await request.execute();
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });

  it("test_basic_request_interceptor", async () => {
    const factory = new HTTPRequestFactory().withLogLevel("debug");
    const url = "https://jsonplaceholder.typicode.com/posts";
    const request = factory
      .withRequestInterceptors(async () => {
        return { body: "intercepted" };
      })
      .createGETRequest(url);
    const response = await request.execute();
    expect(response).toBeDefined();
    expect(response.body).toEqual("intercepted");
  });

  it("test_request_interceptor_rewrite_url", async () => {
    const factory = new HTTPRequestFactory().withLogLevel("debug");
    const url = "https://jsonplaceholder.typicode.com/users/2";
    const request = factory
      .withRequestInterceptors(async (_, { replaceURL }) => {
        replaceURL("https://jsonplaceholder.typicode.com/users/1");
      })
      .createGETRequest(url);
    const response = await request.execute();
    expect(response).toBeDefined();
    expect(response.id).toEqual(1);
  });

  it("test_request_interceptor_with_when", async () => {
    let interceptedOnce = false;

    const factory = new HTTPRequestFactory()
      .withLogLevel("debug")
      .withAPIConfig({
        name: "default",
        endpoints: {
          getUser: {
            meta: {
              proxyOnce: () => !interceptedOnce
            },
            target: "https://jsonplaceholder.typicode.com/users/1",
          },
        },
      })
      .when((config) => config.meta.proxyOnce())
      .withRequestInterceptors(async () => {
        interceptedOnce = true;
        return {
          _localResponse: true,
          id: 1,
        };
      });
    let result = await factory.createAPIRequest("getUser").execute();
    expect(result.id).toEqual(1);
    expect(result._localResponse).toBeTruthy();

    result = await factory.createAPIRequest("getUser").execute();
    expect(result.id).toEqual(1);
    expect(result._localResponse).toBeUndefined();
  });
});

it("test_request_interceptor_from_api_config", async () => {
  const fixtures = {
    users: () => {
      return {
        type: "user",
      };
    },
    posts: () => {
      return {
        type: "post",
      };
    },
  };
  const factory = new HTTPRequestFactory().withLogLevel("debug").withAPIConfig({
    name: "default",
    requestInterceptors: [
      (config: RequestConfig) => {
        const entity = config.meta.api.endpoint.target
          .replace(/^\//, "")
          .replace(/\/\d+/, "");
        if (entity && fixtures[entity]) {
          return fixtures[entity]();
        }
      },
    ],
    baseURL: "https://jsonplaceholder.typicode.com",
    endpoints: {
      getUser: {
        target: "/users/1",
      },
      getPost: {
        target: "/posts/1",
      },
      getToDo: {
        target: "/todos/1",
      },
    },
  });

  let result = await factory.createAPIRequest("getUser").execute();
  expect(result).toHaveProperty("type", "user");

  result = await factory.createAPIRequest("getPost").execute();
  expect(result).toHaveProperty("type", "post");

  result = await factory.createAPIRequest("getToDo").execute();
  expect(result.type).toBeUndefined();
});

describe("HTTPRequest.getHash() Tests", () => {
  const testFactory = 
    new HTTPRequestFactory()
    .use(requestHashFeature)
    .withLogLevel("error");

  it("should_generate_consistent_hashes_for_identical_requests", () => {
    const request1 = testFactory.createGETRequest("https://example.com/api");
    const request2 = testFactory.createGETRequest("https://example.com/api");
    
    expect(request1.getHash()).toBe(request2.getHash());
  });

  it("should_generate_different_hashes_for_different_URLs", () => {
    const request1 = testFactory.createGETRequest("https://example.com/api/users");
    const request2 = testFactory.createGETRequest("https://example.com/api/posts");
    
    expect(request1.getHash()).not.toBe(request2.getHash());
  });

  it("should_generate_different_hashes_for_different_HTTP_methods", () => {
    const getRequest = testFactory.createGETRequest("https://example.com/api");
    const postRequest = testFactory.createPOSTRequest("https://example.com/api");
    
    expect(getRequest.getHash()).not.toBe(postRequest.getHash());
  });

  it("should_include_JSON_body_content_in_hash", () => {
    const request1 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({ name: "test", id: 1 });
    const request2 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({ name: "test", id: 2 });
    
    expect(request1.getHash()).not.toBe(request2.getHash());
  });

  it("should_generate_same_hash_for_identical_JSON_bodies_regardless_of_property_order", () => {
    const request1 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({ name: "test", id: 1 });
    const request2 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({ id: 1, name: "test" });
    
    expect(request1.getHash()).toBe(request2.getHash());
  });

  it("should_include_form-encoded_body_content_in_hash", () => {
    const request1 = testFactory.createPOSTRequest("https://example.com/api")
      .withFormEncodedBody("name=test&id=1");
    const request2 = testFactory.createPOSTRequest("https://example.com/api")
      .withFormEncodedBody("name=test&id=2");
    
    expect(request1.getHash()).not.toBe(request2.getHash());
  });

  it("should_handle_FormData_bodies_consistently", () => {
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
    
    // Should be the same due to sorted entries in getHash
    expect(request1.getHash()).toBe(request2.getHash());
  });

  it("should_generate_different_hashes_for_different_FormData_content", () => {
    const request1 = testFactory.createPOSTRequest("https://example.com/api")
      .withFormDataBody((formData) => {
        formData.append("name", "test1");
      });
    const request2 = testFactory.createPOSTRequest("https://example.com/api")
      .withFormDataBody((formData) => {
        formData.append("name", "test2");
      });
    
    expect(request1.getHash()).not.toBe(request2.getHash());
  });

  it("should_include_query_parameters_in_hash", () => {
    const request1 = testFactory.createGETRequest("https://example.com/api")
      .withQueryParam("page", "1");
    const request2 = testFactory.createGETRequest("https://example.com/api")
      .withQueryParam("page", "2");
    
    expect(request1.getHash()).not.toBe(request2.getHash());
  });

  it("should_include_URL_parameters_in_hash", () => {
    const request1 = testFactory.createGETRequest("https://example.com/api/users/{{id}}")
      .withURLParam("id", "123");
    const request2 = testFactory.createGETRequest("https://example.com/api/users/{{id}}")
      .withURLParam("id", "456");
    
    expect(request1.getHash()).not.toBe(request2.getHash());
  });

  it("should_include_relevant_headers_in_hash", () => {
    const request1 = testFactory.createPOSTRequest("https://example.com/api")
      .withHeader("content-type", "application/json");
    const request2 = testFactory.createPOSTRequest("https://example.com/api")
      .withHeader("content-type", "application/xml");
    
    expect(request1.getHash()).not.toBe(request2.getHash());
  });

  it("should_ignore_non_relevant_headers_in_hash", () => {
    const request1 = testFactory.createGETRequest("https://example.com/api")
      .withHeader("authorization", "Bearer token1");
    const request2 = testFactory.createGETRequest("https://example.com/api")
      .withHeader("authorization", "Bearer token2");
    
    // Authorization header is not in the relevant headers list
    expect(request1.getHash()).toBe(request2.getHash());
  });

  it("should_cache_hash_value_for_performance", () => {
    const request = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({ test: "data" });
    
    const hash1 = request.getHash();
    const hash2 = request.getHash();
    
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe("string");
    expect(hash1.length).toBeGreaterThan(0);
  });

  it("should_generate_deterministic_hashes", () => {
    const createRequest = () => testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({ name: "test", values: [1, 2, 3] })
      .withQueryParam("filter", "active")
      .withHeader("accept", "application/json");
    
    const request1 = createRequest();
    const request2 = createRequest();
    
    expect(request1.getHash()).toBe(request2.getHash());
  });

  it("should_handle_requests_without_body", () => {
    const request1 = testFactory.createGETRequest("https://example.com/api");
    const request2 = testFactory.createGETRequest("https://example.com/api");
    
    expect(request1.getHash()).toBe(request2.getHash());
    expect(typeof request1.getHash()).toBe("string");
  });

  it("should_handle_empty_JSON_body", () => {
    const request1 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({});
    const request2 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody({});
    
    expect(request1.getHash()).toBe(request2.getHash());
  });

  it("should_handle_complex_nested_JSON_bodies", () => {
    const complexData = {
      user: { id: 1, name: "test" },
      preferences: { theme: "dark", notifications: true },
      metadata: { tags: ["tag1", "tag2"], created: "2023-01-01" }
    };
    
    const request1 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody(complexData);
    const request2 = testFactory.createPOSTRequest("https://example.com/api")
      .withJSONBody(JSON.parse(JSON.stringify(complexData)));
    
    expect(request1.getHash()).toBe(request2.getHash());
  });
});
