import type { RequestConfig, ResponseBodyTransformer } from './types.js';

/**
 * Applies configured response body transformers to a value, in order.
 * If there are no transformers, returns the value untouched.
 */
export async function applyResponseBodyTransformers(
  value: any,
  config: Pick<RequestConfig, 'responseBodyTransformers'>
): Promise<any> {
  const transformers: ResponseBodyTransformer[] = config.responseBodyTransformers || [];
  if (!transformers.length) return value;
  let transformed = value;
  for (const transformer of transformers) {
    transformed = await transformer(transformed, config as any);
  }
  return transformed;
}
