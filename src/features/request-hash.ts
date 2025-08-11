import { HTTPRequest } from "../HTTPRequest";
import { HTTPRequestFactory } from "../HTTPRequestFactory";
import { Feature, FeatureCommands } from "../types";
import { maybeFunction } from "../utils";

function isTypedArray(v: any): boolean {
  return ArrayBuffer.isView(v) && !(v instanceof DataView);
}

function formDataHasBinary(fd: FormData): boolean {
  for (const [, v] of fd.entries()) {
    if (v instanceof File || (v as any) instanceof Blob) return true;
  }
  return false;
}

function isBinaryBody(body: any, contentType?: string | null, textualMimeTypes?: string[]): boolean {
  if (
    body instanceof Blob ||
    (typeof File !== "undefined" && body instanceof File) ||
    body instanceof ArrayBuffer ||
    isTypedArray(body) ||
    (typeof ReadableStream !== "undefined" && body instanceof ReadableStream)
  )
    return true;

  if (body instanceof FormData) return formDataHasBinary(body);

  // Heuristic by content-type when body type isn’t conclusive
  if (contentType) {
    const ct = contentType.toLowerCase();
    const textualCT = textualMimeTypes?.some((mt) => new RegExp(mt).test(ct));
    return !textualCT;
  }

  return false;
}

/**
 * Creates a deterministic string representation of an object with sorted keys.
 * This ensures that objects with the same properties in different orders
 * will produce identical string representations.
 *
 * @param {any} obj - The object to stringify
 * @return {string} A deterministic JSON string
 */
function deterministicStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return (
      "[" + obj.map((item) => deterministicStringify(item)).join(",") + "]"
    );
  }

  // Sort object keys and recursively stringify values
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    const value = deterministicStringify(obj[key]);
    return `"${key}":${value}`;
  });

  return "{" + pairs.join(",") + "}";
}

/**
 * Simple hash function for generating cache keys.
 * Uses a variant of the djb2 algorithm for good distribution and speed.
 *
 * @param {string} str - The string to hash
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return (hash >>> 0).toString(16);
}

class RequestHashFeature implements Feature<HTTPRequestFactory> {
  private hashes = new WeakMap<HTTPRequest, string>();

  apply(target: HTTPRequestFactory, commands: FeatureCommands) {
    commands.afterRequestCreated((request) => {
      request.getHash = () => {
        if (this.hashes.has(request)) {
          return this.hashes.get(request)!;
        }
        const config = request.getReadOnlyConfig();
        const contentType = config.headers["content-type"];
        const bodyContent = maybeFunction(config.body, request);
        const isBinary = isBinaryBody(bodyContent, contentType as string, [
            ... config.textMimeTypes,
            ... config.jsonMimeTypes,
        ]);

        if (isBinary) {
          throw new Error("Hashing binary request bodies are not supported");
        }
        // Create a normalized representation of the request
        const keyComponents = {
          method: config.method,
          url: config.url,
          queryParams: config.queryParams,
          urlParams: config.urlParams,
          body: null as any,
          // Only include headers that affect response (exclude auth, user-agent, etc.)
          relevantHeaders: {} as Record<string, any>,
        };

        // Include request body if present
        if (bodyContent) {
          // Handle FormData specially for consistent hashing
          if (bodyContent instanceof FormData) {
            const entries = Array.from(bodyContent.entries()).sort();
            keyComponents.body = JSON.stringify(entries);
          } else if (typeof bodyContent === "string") {
            // Check if it's a JSON string and normalize it for consistent property order
            try {
              const parsedJSON = JSON.parse(bodyContent);
              // If it's valid JSON, use deterministic stringify for consistent ordering
              keyComponents.body = deterministicStringify(parsedJSON);
            } catch {
              // Not valid JSON, use as-is
              keyComponents.body = bodyContent;
            }
          } else {
            keyComponents.body = bodyContent;
          }
        }

        // Include only cache-relevant headers (content-type, accept, etc.)
        const relevantHeaderKeys = [
          "content-type",
          "accept",
          "accept-language",
          "accept-encoding",
        ];
        for (const headerKey of relevantHeaderKeys) {
          const headerValue =
            config.headers[headerKey] ||
            config.headers[headerKey.toLowerCase()];
          if (headerValue !== undefined) {
            keyComponents.relevantHeaders[headerKey.toLowerCase()] =
              typeof headerValue === "function"
                ? headerValue(request.getReadOnlyConfig())
                : headerValue;
          }
        }

        // Create a stable string representation with deep sorting
        const keyString = deterministicStringify(keyComponents);

        // Generate a hash of the key string for efficiency and cache it
        const hash = simpleHash(keyString);
        this.hashes.set(request, hash);
        return hash;
      };
    });
  }
}

export default new RequestHashFeature();
