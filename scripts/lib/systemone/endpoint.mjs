export const DEFAULT_CATALOG_SYSTEMONE_ENDPOINT = "http://127.0.0.1:18080/v1/systemone";

/** Keep System One choices on the local HTTP service. */
export function validateLocalSystemOneEndpoint(raw) {
  let url;

  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid System One endpoint");
  }

  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.pathname !== "/v1/systemone" ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error("System One endpoint must be a local /v1/systemone URL");
  }

  return url.href;
}
