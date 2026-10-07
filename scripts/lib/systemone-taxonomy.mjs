const DEFAULT_ENDPOINT = 'http://127.0.0.1:18080/v1/systemone';
const ROOT_SPECIAL = 'UNCLASSIFIED';
const CHILD_SPECIAL = 'THIS_CATEGORY';

function validateEndpoint(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid System One endpoint'); }
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
    || url.pathname !== '/v1/systemone' || url.username || url.password || url.hash) {
    throw new Error('System One endpoint must be a local /v1/systemone URL');
  }
  return url.href;
}

function stringArray(value, field, id) {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
    throw new Error(`Taxonomy option ${id} has invalid ${field}`);
  }
  return value.map(entry => entry.trim()).filter(Boolean);
}

function normalizeOption(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Taxonomy options must be objects');
  }
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const what = typeof value.what === 'string' ? value.what.trim() : '';
  if (!id || !what) throw new Error('Taxonomy options require id and what');
  return {
    id,
    what,
    notFor: stringArray(value.notFor, 'notFor', id),
    examples: stringArray(value.examples, 'examples', id),
    aliases: stringArray(value.aliases, 'aliases', id),
  };
}

function validateOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error('Taxonomy Choice requires at least one option');
  }
  const seen = new Set();
  return options.map(raw => {
    const option = normalizeOption(raw);
    if (seen.has(option.id)) throw new Error('Taxonomy Choice option ids must be unique');
    if (option.id === ROOT_SPECIAL || option.id === CHILD_SPECIAL) {
      throw new Error('Taxonomy node id uses a reserved Choice value');
    }
    seen.add(option.id);
    return option;
  });
}

function criterion(option) {
  const parts = [option.what];
  if (option.notFor.length) parts.push(`Not for: ${option.notFor.join(' ')}`);
  if (option.examples.length) parts.push(`Examples: ${option.examples.join('; ')}`);
  if (option.aliases.length) parts.push(`Aliases: ${option.aliases.join('; ')}`);
  return parts.join(' ');
}

function validateAnswer(body, allowed) {
  const answer = body?.answers?.taxonomy;
  if (answer?.type !== 'choice' || typeof answer.choice !== 'string') {
    throw new Error('Invalid System One taxonomy response');
  }
  if (!allowed.has(answer.choice)) {
    throw new Error('System One taxonomy choice is outside the allowed options');
  }
  if (!answer.probabilities || typeof answer.probabilities !== 'object' || Array.isArray(answer.probabilities)) {
    throw new Error('System One taxonomy response is missing probabilities');
  }
  const probabilityKeys = Object.keys(answer.probabilities);
  for (const key of probabilityKeys) {
    if (!allowed.has(key)) {
      throw new Error('System One taxonomy response has probabilities outside the allowed options');
    }
  }
  if (probabilityKeys.length !== allowed.size) {
    throw new Error('System One taxonomy response has incomplete probabilities');
  }
  for (const key of probabilityKeys) {
    const value = answer.probabilities[key];
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error('System One taxonomy response has invalid probabilities');
    }
  }
  for (const id of allowed) {
    if (!Object.hasOwn(answer.probabilities, id)) {
      throw new Error('System One taxonomy response has incomplete probabilities');
    }
  }
  if (!Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) {
    throw new Error('System One taxonomy response has invalid confidence');
  }
  return answer;
}

export async function chooseTaxonomyOption({
  state,
  node = null,
  options,
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = 15000,
  fetchImpl = fetch,
} = {}) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('System One taxonomy state must be an object');
  }
  if (node !== null && (!node || typeof node !== 'object' || typeof node.id !== 'string')) {
    throw new Error('System One taxonomy node must be null or a taxonomy node');
  }
  const target = validateEndpoint(endpoint);
  const normalized = validateOptions(options);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000) {
    throw new Error('Invalid System One timeout');
  }

  const special = node === null ? ROOT_SPECIAL : CHILD_SPECIAL;
  const criteria = Object.fromEntries(normalized.map(option => [option.id, criterion(option)]));
  criteria[special] = null;
  const allowed = new Set([...normalized.map(option => option.id), special]);
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
          taxonomy: {
            type: 'choice',
            instructions: node === null
              ? 'Choose the best taxonomy family for this item, or UNCLASSIFIED when none fits.'
              : 'Choose the most specific direct child that fits, or THIS_CATEGORY when the parent fits but no child is more specific.',
            criteria,
          },
        },
      }),
    });
  } catch (error) {
    if (signal.aborted || ['AbortError', 'TimeoutError'].includes(error?.name)) {
      throw new Error('System One taxonomy request timed out');
    }
    throw new Error('System One taxonomy request failed: ' + String(error?.message ?? error));
  }
  if (!response?.ok) {
    throw new Error('System One taxonomy request failed with HTTP ' + response?.status);
  }
  const body = await response.json();
  const answer = validateAnswer(body, allowed);
  return {
    choice: answer.choice,
    probability: answer.probabilities[answer.choice],
    probabilities: answer.probabilities,
    confidence: answer.confidence,
    usage: body.usage ?? null,
    model: body.model ?? null,
  };
}
