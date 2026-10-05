const DEFAULT_ENDPOINT = 'http://127.0.0.1:18080/v1/systemone';
const NONE = 'NONE';

function validateEndpoint(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid System One endpoint'); }
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
    || url.pathname !== '/v1/systemone' || url.username || url.password || url.hash)
    throw new Error('System One endpoint must be a local /v1/systemone URL');
  return url.href;
}

function validateGroups(groups) {
  if (!Array.isArray(groups) || groups.length < 1 || groups.length > 254)
    throw new Error('Observed groups must contain 1 to 254 labels');
  const labels = new Set();
  for (const label of groups) {
    if (typeof label !== 'string' || !label || label !== label.trim() || label === NONE)
      throw new Error('Observed group labels must be non-empty exact labels and may not use NONE');
    if (labels.has(label)) throw new Error('Observed group labels must be unique');
    labels.add(label);
  }
  return labels;
}

function validateAnswer(body, labels) {
  const answer = body?.answers?.group;
  if (answer?.type !== 'choice' || typeof answer.choice !== 'string')
    throw new Error('Invalid System One group response');
  const allowed = new Set([...labels, NONE]);
  if (!allowed.has(answer.choice))
    throw new Error('System One group choice is outside the allowed observed labels');
  if (!answer.probabilities || typeof answer.probabilities !== 'object')
    throw new Error('System One group response is missing probabilities');
  for (const label of allowed) {
    const value = answer.probabilities[label];
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error('System One group response has invalid probabilities');
  }
  for (const label of Object.keys(answer.probabilities)) {
    if (!allowed.has(label))
      throw new Error('System One group response has probabilities outside the allowed labels');
  }
  if (!Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1)
    throw new Error('System One group response has invalid confidence');
  return answer;
}

export async function chooseObservedGroup({
  state,
  groups,
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = 15000,
  fetchImpl = fetch,
} = {}) {
  const target = validateEndpoint(endpoint);
  const labels = validateGroups(groups);
  if (!state || typeof state !== 'object' || Array.isArray(state))
    throw new Error('System One group state must be an object');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000)
    throw new Error('Invalid System One timeout');

  const criteria = Object.fromEntries([...labels].map(label => [label, null]));
  criteria[NONE] = null;
  const signal = AbortSignal.timeout(timeoutMs);

  let response;
  try {
    response = await fetchImpl(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal,
      body: JSON.stringify({
        state,
        questions: {
          group: {
            type: 'choice',
            instructions: 'Choose the exact observed group containing this asset. Use NONE if none applies. Never invent or rename a group.',
            criteria,
          },
        },
      }),
    });
  } catch (error) {
    if (signal.aborted || ['AbortError', 'TimeoutError'].includes(error?.name))
      throw new Error('System One group request timed out');
    throw new Error('System One group request failed: ' + String(error?.message ?? error));
  }

  if (!response?.ok)
    throw new Error('System One group request failed with HTTP ' + response?.status);
  const body = await response.json();
  const answer = validateAnswer(body, labels);
  return {
    choice: answer.choice,
    probability: answer.probabilities[answer.choice],
    probabilities: answer.probabilities,
    confidence: answer.confidence,
    usage: body.usage ?? null,
    model: body.model ?? null,
  };
}
