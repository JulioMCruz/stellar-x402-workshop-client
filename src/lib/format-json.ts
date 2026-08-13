export function formatJsonResponse(body: string) {
  if (!body.trim()) return "(empty response body)";

  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
