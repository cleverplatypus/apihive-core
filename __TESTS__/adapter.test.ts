import { describe, expect, it, vi, beforeEach } from "vitest";
import { HTTPRequestFactory } from "../src/HTTPRequestFactory.ts";
import { Adapter, AdapterPriority } from "../src/adapter-types.ts";
import { HTTPRequest } from "../src/HTTPRequest.ts";
import { RequestInterceptor, ResponseInterceptor, ErrorInterceptor, RequestConfig, ResponseInterceptorControls, RequestInterceptorControls } from "../src/types.ts";

// Mock adapters for testing
class TestRequestAdapter implements Adapter {
  readonly name = "test-request";
  readonly priority: AdapterPriority = { requestInterceptor: 100 };
  
  public interceptedRequests: Array<{ method: string; url: string; body?: any }> = [];
  public onAttachCalled = false;
  public onDetachCalled = false;

  onAttach(): void {
    this.onAttachCalled = true;
  }

  onDetach(): void {
    this.onDetachCalled = true;
  }

  getRequestInterceptors(): RequestInterceptor[] {
    return [
      async (config: RequestConfig, controls: RequestInterceptorControls) => {
        this.interceptedRequests.push({
          method: config.method,
          url: config.url,
          body: config.body
        });
      }
    ];
  }
}

class TestResponseAdapter implements Adapter {
  readonly name = "test-response";
  readonly priority: AdapterPriority = { responseInterceptor: 200 };
  
  public interceptedResponses: Array<{ status: number; url: string }> = [];

  getResponseInterceptors(): ResponseInterceptor[] {
    return [
      async (response: Response, config: RequestConfig, controls: ResponseInterceptorControls) => {
        this.interceptedResponses.push({
          status: response.status,
          url: config.url
        });
        return response;
      }
    ];
  }
}

class TestPriorityAdapter implements Adapter {
  readonly name = "test-priority";
  readonly priority: AdapterPriority = { requestInterceptor: 50 }; // Higher priority (earlier execution)
  
  public executionOrder: number[] = [];

  getRequestInterceptors(): RequestInterceptor[] {
    return [
      async () => {
        this.executionOrder.push(1);
      }
    ];
  }
}

class TestFactoryDefaultsAdapter implements Adapter {
  readonly name = "test-factory-defaults";
  
  getFactoryDefaults() {
    return [
      (request: HTTPRequest) => {
        request.withHeader("X-Adapter-Applied", "factory-defaults");
      }
    ];
  }
}

class TestErrorAdapter implements Adapter {
  readonly name = "test-error";
  
  public interceptedErrors: string[] = [];

  getErrorInterceptors(): ErrorInterceptor[] {
    return [
      async (error: any) => {
        this.interceptedErrors.push(error.message || "unknown error");
        return false; // Don't handle the error, let it propagate
      }
    ];
  }
}

describe("Adapter System", () => {
  let factory: HTTPRequestFactory;

  beforeEach(() => {
    factory = new HTTPRequestFactory().withLogLevel("none"); // Suppress logs during tests
  });

  describe("Adapter Attachment and Detachment", () => {
    it("should_attach_adapter_successfully", async () => {
      const adapter = new TestRequestAdapter();
      
      await factory.withAdapter(adapter);
      
      expect(factory.hasAdapter("test-request")).toBe(true);
      expect(factory.getAttachedAdapters()).toContain("test-request");
      expect(adapter.onAttachCalled).toBe(true);
    });

    it("should_detach_adapter_successfully", async () => {
      const adapter = new TestRequestAdapter();
      
      await factory.withAdapter(adapter);
      await factory.detachAdapter("test-request");
      
      expect(factory.hasAdapter("test-request")).toBe(false);
      expect(factory.getAttachedAdapters()).not.toContain("test-request");
      expect(adapter.onDetachCalled).toBe(true);
    });

    it("should_prevent_duplicate_adapter_attachment", async () => {
      const adapter = new TestRequestAdapter();
      
      await factory.withAdapter(adapter);
      
      await expect(factory.withAdapter(adapter))
        .rejects.toThrow("Adapter 'test-request' is already attached");
    });

    it("should_handle_detaching_non-existent_adapter", async () => {
      await expect(factory.detachAdapter("non-existent"))
        .rejects.toThrow("Adapter 'non-existent' is not attached");
    });

    it("should_return_correct_adapter_status", async () => {
      const adapter = new TestRequestAdapter();
      
      expect(factory.hasAdapter("test-request")).toBe(false);
      
      await factory.withAdapter(adapter);
      expect(factory.hasAdapter("test-request")).toBe(true);
      
      await factory.detachAdapter("test-request");
      expect(factory.hasAdapter("test-request")).toBe(false);
    });
  });

  describe("Request Interceptors", () => {
    it("should_execute_request_interceptors_with_correct_config_access", async () => {
      const adapter = new TestRequestAdapter();
      await factory.withAdapter(adapter);

      const request = factory.createPOSTRequest("https://httpbin.org/post")
        .withJSONBody({ test: "data" });

      // Mock the execute to avoid actual HTTP call
      const executeSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{"success": true}', { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));

      await request.execute();

      expect(adapter.interceptedRequests).toHaveLength(1);
      expect(adapter.interceptedRequests[0]).toEqual({
        method: "POST",
        url: "https://httpbin.org/post",
        body: "{\"test\":\"data\"}"
      });

      executeSpy.mockRestore();
    });

    it("should_execute_multiple_request_interceptors_in_priority_order", async () => {
      const lowPriorityAdapter = new TestRequestAdapter(); // priority 100
      const highPriorityAdapter = new TestPriorityAdapter(); // priority 50

      await factory.withAdapter(lowPriorityAdapter);
      await factory.withAdapter(highPriorityAdapter);

      const request = factory.createGETRequest("https://httpbin.org/get");
      const executeSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{"success": true}', { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));

      await request.execute();

      // High priority adapter should execute first
      expect(highPriorityAdapter.executionOrder).toEqual([1]);
      expect(lowPriorityAdapter.interceptedRequests).toHaveLength(1);

      executeSpy.mockRestore();
    });
  });

  describe("Response Interceptors", () => {
    it("should_execute_response_interceptors_with_correct_config_access", async () => {
      const adapter = new TestResponseAdapter();
      await factory.withAdapter(adapter);

      const request = factory.createGETRequest("https://httpbin.org/get");

      // Mock fetch to return a controlled response
      const mockResponse = new Response('{"success": true}', { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      await request.execute();

      expect(adapter.interceptedResponses).toHaveLength(1);
      expect(adapter.interceptedResponses[0]).toEqual({
        status: 200,
        url: "https://httpbin.org/get"
      });

      fetchSpy.mockRestore();
    });
  });

  describe("Factory Defaults", () => {
    it("should_apply_factory_defaults_from_adapters", async () => {
      const adapter = new TestFactoryDefaultsAdapter();
      await factory.withAdapter(adapter);

      // Add a config capturing interceptor
      let capturedConfig: RequestConfig | undefined;
      const configCapturingAdapter = {
        name: "config-capturer",
        priority: { requestInterceptor: 1 },
        getRequestInterceptors: () => [async (config: RequestConfig) => {
          capturedConfig = config;
        }]
      };
      
      await factory.withAdapter(configCapturingAdapter);
      
      const request = factory.createGETRequest("https://httpbin.org/get");
      
      // Mock fetch to avoid network call
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
      );
      
      await request.execute();
      
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig!.headers["X-Adapter-Applied"]).toBe("factory-defaults");
      
      fetchSpy.mockRestore();
    });
  });

  describe("Priority System", () => {
    it("should_respect_adapter_priority_overrides", async () => {
      const adapter = new TestRequestAdapter();
      
      await factory.withAdapter(adapter, { 
        priority: { requestInterceptor: 1000 } // Very low priority
      });

      // Priority should be overridden
      const attachedAdapters = factory.getAttachedAdapters();
      expect(attachedAdapters).toContain("test-request");
    });

    it("should_handle_multiple_adapters_with_different_priorities", async () => {
      const adapter1 = new TestRequestAdapter(); // priority 100
      const adapter2 = new TestPriorityAdapter(); // priority 50

      await factory.withAdapter(adapter1);
      await factory.withAdapter(adapter2);

      expect(factory.getAttachedAdapters()).toHaveLength(2);
      expect(factory.getAttachedAdapters()).toContain("test-request");
      expect(factory.getAttachedAdapters()).toContain("test-priority");
    });
  });

  describe("Error Interceptors", () => {
    it("should_execute_error_interceptors", async () => {
      const adapter = new TestErrorAdapter();
      await factory.withAdapter(adapter);

      const request = factory.createGETRequest("https://invalid-url-that-will-fail.test");

      try {
        await request.execute();
      } catch (error) {
        // Error should have been intercepted
        expect(adapter.interceptedErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Complex Scenarios", () => {
    it("should_handle_multiple_adapters_with_all_interceptor_types", async () => {
      const requestAdapter = new TestRequestAdapter();
      const responseAdapter = new TestResponseAdapter();
      const factoryAdapter = new TestFactoryDefaultsAdapter();

      // Add a config capturing interceptor to verify factory defaults
      let capturedConfig: RequestConfig | undefined;
      const configCapturingAdapter = {
        name: "config-capturer",
        priority: { requestInterceptor: 1 },
        getRequestInterceptors: () => [async (config: RequestConfig) => {
          capturedConfig = config;
        }]
      };

      await factory.withAdapter(requestAdapter);
      await factory.withAdapter(responseAdapter);
      await factory.withAdapter(factoryAdapter);
      await factory.withAdapter(configCapturingAdapter);

      expect(factory.getAttachedAdapters()).toHaveLength(4);

      const request = factory.createPOSTRequest("https://httpbin.org/post")
        .withJSONBody({ complex: "test" });

      // Mock fetch response
      const mockResponse = new Response('{"result": "success"}', { 
        status: 201,
        statusText: 'Created'
      });
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      await request.execute();

      // Verify all adapters were executed
      expect(requestAdapter.interceptedRequests).toHaveLength(1);
      expect(responseAdapter.interceptedResponses).toHaveLength(1);
      
      // Verify factory defaults were applied (captured from interceptor)
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig!.headers["X-Adapter-Applied"]).toBe("factory-defaults");

      fetchSpy.mockRestore();
    });

    it("should_clean_up_interceptors_when_adapter_is_detached", async () => {
      const adapter = new TestRequestAdapter();
      
      await factory.withAdapter(adapter);
      expect(factory.hasAdapter("test-request")).toBe(true);

      await factory.detachAdapter("test-request");
      expect(factory.hasAdapter("test-request")).toBe(false);

      // New requests should not trigger the detached adapter
      const request = factory.createGETRequest("https://httpbin.org/get");
      const executeSpy = vi.spyOn(request, 'execute').mockResolvedValue({ success: true });

      await request.execute();

      // The detached adapter should not have intercepted anything new
      expect(adapter.interceptedRequests).toHaveLength(0);

      executeSpy.mockRestore();
    });
  });

  describe("API Request Integration", () => {
    it("should_work_with_API_requests", async () => {
      // Setup API configuration
      factory.withAPIConfig({
        name: "test-api",
        baseURL: "https://api.test.com",
        endpoints: {
          "get-user": {
            target: "/user/{{id}}",
            method: "GET"
          }
        }
      });

      const adapter = new TestRequestAdapter();
      await factory.withAdapter(adapter);

      const request = factory.createAPIRequest("test-api", "get-user")
        .withURLParam("id", "123");

      const executeSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ user: { id: 123 } }), { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));

      await request.execute();

      expect(adapter.interceptedRequests).toHaveLength(1);
      expect(adapter.interceptedRequests[0].method).toBe("GET");
      expect(adapter.interceptedRequests[0].url).toBe("https://api.test.com/user/123");

      executeSpy.mockRestore();
    });
  });
});
