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
  if (!Array.isArray(groups) || groups.length < 1 || groups.length > 8)
    throw new Error('Observed groups must contain 1 to 8 labels');
  const labels = new Set();
  for (const label of groups) {
    if (typeof label !== 'string' || !label || label !== label.trim() || label === NONE)
      throw new Error('Observed group labels must be non-empty exact labels and may not use NONE');
    if (labels.has(label)) throw new Error('Observed group labels must be unique');
    labels.add(label);
  }
  return labels;
}

const DECISION_PATTERNS = new Set(['link', 'card', 'range', 'container', 'other']);

function normalizeDecisionState(state, labels) {
  if (!state || typeof state !== 'object' || Array.isArray(state))
    throw new Error('System One group state must be an object');
  const asset = state.asset;
  if (!asset || typeof asset.id !== 'string' || !asset.id.trim())
    throw new Error('System One group state must include an asset id');
  const candidates = state.candidates;
  if (!Array.isArray(candidates) || candidates.length !== labels.size)
    throw new Error('System One group state must include compact candidate facts for every observed group');

  const seen = new Set();
  const normalized = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate.label !== 'string' || !labels.has(candidate.label)
      || seen.has(candidate.label))
      throw new Error('System One group candidates must match the exact observed labels');
    if (!DECISION_PATTERNS.has(candidate.pattern)
      || ![0, 1].includes(candidate.path)
      || !Number.isSafeInteger(candidate.overlap) || candidate.overlap < 0 || candidate.overlap > 99
      || !Array.isArray(candidate.samples) || candidate.samples.length > 2
      || candidate.samples.some(sample => typeof sample !== 'string' || !sample || sample.length > 80))
      throw new Error('System One group candidates must use compact normalized facts');
    seen.add(candidate.label);
    normalized.push({
      label: candidate.label,
      pattern: candidate.pattern,
      path: candidate.path,
      overlap: candidate.overlap,
      samples: [...candidate.samples],
    });
  }

  return {
    asset: {
      id: asset.id.slice(0, 120),
      ...(typeof asset.text === 'string' && asset.text ? { text: asset.text.slice(0, 120) } : {}),
    },
    candidates: normalized,
  };
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
  const decisionState = normalizeDecisionState(state, labels);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000)
    throw new Error('Invalid System One timeout');

  const criteria = Object.fromEntries([...labels, NONE].map(label => [label, null]));
  const signal = AbortSignal.timeout(timeoutMs);

  let response;
  try {
    response = await fetchImpl(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal,
      body: JSON.stringify({
        state: decisionState,
        questions: {
          group: {
            type: 'choice',
            instructions: 'Candidate facts: path=1 means the asset path is under the group path; overlap is token overlap; samples are observed member IDs. Choose one group or NONE. Never invent a label.',
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
