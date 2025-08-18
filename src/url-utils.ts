type ComposeURLArgs = {
  templateURLHistory: string[],
  urlParams: Record<string, any>,
  queryParams: Record<string, any>,
  evaluateParam: (v: any) => any,
  evaluateQuery: (v: any) => any
}

/**
 * Compose a final URL from template history, url params, and query params.
 * - Supports relative templates by using a dummy origin during URL construction, then stripping it.
 * - Evaluation strategy for param and query values is provided by the caller to keep coupling low.
 */
export function composeURL({
  templateURLHistory,
  urlParams,
  queryParams,
  evaluateParam,
  evaluateQuery
} : ComposeURLArgs): string {
  const tip = templateURLHistory[templateURLHistory.length - 1];
  let urlString = tip;

  // Path params replacement
  for (const key in urlParams) {
    const raw = urlParams[key];
    const value = evaluateParam(raw);
    urlString = urlString.replace(`{{${key}}}`, String(value));
  }

  // Use dummy base for relative templates
  const url = new URL(urlString, urlString.startsWith('http') ? undefined : 'http://dummy');

  // Query params (supports arrays and functions)
  for (const k of Object.keys(queryParams)) {
    const qp = queryParams[k];
    const evaluated = evaluateQuery(qp);
    if (evaluated == null) continue;
    if (Array.isArray(evaluated)) {
      for (const v of evaluated) url.searchParams.append(k, String(v));
    } else {
      url.searchParams.append(k, String(evaluated));
    }
  }

  const composed = url.toString();
  if (!urlString.startsWith('http')) {
    const i = composed.indexOf('://');
    const slash = composed.indexOf('/', i + 3);
    return composed.slice(slash);
  }
  return composed;
}
