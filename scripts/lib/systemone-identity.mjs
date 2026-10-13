import { isInputObject, isInputString } from './input-guards.mjs';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:8080/v1/systemone';

const NONE = 'NONE';

function validEndpoint(raw) {
  let url;

  try { url = new URL(raw); } catch { throw new Error('Invalid System One endpoint'); }

  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
    || url.pathname !== '/v1/systemone' || url.username || url.password || url.hash)
    throw new Error('System One endpoint must be a local /v1/systemone URL');

  return url.href;
}

function validateCandidates(candidates) {
  if (!Array.isArray(candidates) || candidates.length < 1 || candidates.length > 254)
    throw new Error('Identity candidates must contain 1 to 254 entries');
  const ids = new Set();

  for (const candidate of candidates) {
    if (!candidate || !isInputString(candidate.id) || !candidate.id.trim()
      || candidate.id === NONE || ids.has(candidate.id))
      throw new Error('Invalid identity candidate set');
    ids.add(candidate.id);
  }

  return ids;
}

function validateAnswer(body, ids) {
  const answer = body?.answers?.identity;

  if (answer?.type !== 'choice' || !isInputString(answer.choice))
    throw new Error('Invalid System One identity response');
  const allowed = new Set([...ids, NONE]);

  if (!allowed.has(answer.choice))
    throw new Error('System One choice is outside candidate set');

  if (!answer.probabilities || !isInputObject(answer.probabilities))
    throw new Error('System One response is missing probabilities');

  for (const id of allowed) {
    const value = answer.probabilities[id];

    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error('System One response has invalid probabilities');
  }

  if (!Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1)
    throw new Error('System One response has invalid confidence');

  return answer;
}

export async function chooseRegistryIdentity({
  endpoint = DEFAULT_ENDPOINT,
  registry,
  observedLink,
  candidates,
  fetchImpl = fetch,
  timeoutMs = 15000,
} = {}) {
  const target = validEndpoint(endpoint);

  if (!isInputString(registry) || !registry.trim())
    throw new Error('Registry namespace is required');

  if (!observedLink || !isInputString(observedLink.text)
    || !isInputString(observedLink.url))
    throw new Error('Observed link evidence is required');

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000)
    throw new Error('Invalid System One timeout');
  const ids = validateCandidates(candidates);

  const criteria = Object.fromEntries(candidates.map(candidate => [
    candidate.id,
    candidate.title || candidate.description || 'Known registry catalog identity.',
  ]));

  criteria[NONE] = 'The observed link does not identify any candidate, or the evidence is insufficient to distinguish them.';

  const response = await fetchImpl(target, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      state: {
        registry,
        observedLink,
        candidates,
      },
      questions: {
        identity: {
          type: 'choice',
          instructions: [
            'Choose which known registry catalog identity the observed official link refers to.',
            'Use only the supplied link text, observed URL path, listing context, and candidate metadata.',
            'Choose NONE when the evidence does not distinguish a candidate.',
            'Do not invent a URL or catalog identity.',
          ],
          criteria,
        },
      },
    }),
  });

  if (!response.ok)
    throw new Error('System One request failed with HTTP ' + response.status);
  const body = await response.json();
  const answer = validateAnswer(body, ids);

  return {
    choice: answer.choice,
    probability: answer.probabilities[answer.choice],
    probabilities: answer.probabilities,
    confidence: answer.confidence,
    usage: body.usage ?? null,
    model: body.model ?? null,
  };
}
