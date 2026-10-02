import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

const SHA256 = /^[a-f0-9]{64}$/i;
function isPublicHttps(input) {
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
    const h = u.hostname.toLowerCase();
    if (isIP(h.replace(/^\[|\]$/g, ''))) return false;
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')
      || h === '[::1]' || /^\[(?:fc|fd|fe80)/.test(h)
      || /^(?:0|10|127|169\.254|192\.168)\./.test(h)
      || (/^172\.(\d+)\./.test(h) && Number(h.split('.')[1]) >= 16
        && Number(h.split('.')[1]) <= 31)) return false;
    return true;
  } catch { return false; }
}
const DEPENDENCY = /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*@([0-9]+\.[0-9]+\.[0-9]+)$/i;

export function assessReviewedPreviewCandidate(candidate, limits = {}) {
  const block = reason => ({ status: 'blocked', reason });
  const r = candidate?.reviewed;
  if (r?.license?.decision !== 'approved' || !r.license.reviewer
      || !r.license.identifier) return block('license-not-approved');
  if (!candidate?.namespace?.startsWith('@') || !candidate.slug
      || candidate.sourceJson?.name !== candidate.slug) return block('source-identity-mismatch');
  if (!isPublicHttps(candidate.officialUrl) || !isPublicHttps(r.registryItemUrl)
      || !isPublicHttps(r.docsUrl)) return block('source-url-not-public');
  if (candidate.officialUrl !== r.registryItemUrl) return block('source-url-mismatch');
  if (typeof r.demoComposition !== 'string'
      || !/^reviewed-fixtures\/[a-z0-9-]+\.tsx$/.test(r.demoComposition))
    return block('missing-reviewed-demo-composition');
  if (!Array.isArray(candidate.sourceJson?.files)
      || !candidate.sourceJson.files.length
      || candidate.sourceJson.files.some(file => typeof file?.content !== 'string'
        || typeof file.path !== 'string' || file.path.startsWith('/')
        || file.path.includes('..'))) return block('unreviewed-source-files');
  const dependencies = candidate.sourceJson.dependencies ?? [];
  if (!Array.isArray(dependencies)) return block('invalid-source-dependencies');
  for (const specifier of dependencies) {
    const match = typeof specifier === 'string' ? specifier.match(DEPENDENCY) : null;
    if (!match) return block('dependency-not-pinned');
    const version = match[2];
    const name = specifier.slice(0, specifier.length - 1 - version.length);
    if (r.dependencyLock?.[name] !== version)
      return block('dependency-not-pinned');
  }
  if (!SHA256.test(r.expectedSha256 ?? '')
      || typeof candidate.officialRawBytes !== 'string') return block('unverified-source-hash');
  if (Buffer.byteLength(candidate.officialRawBytes) > (limits.maxSourceBytes ?? 524288))
    return block('source-budget-exceeded');
  if (createHash('sha256').update(candidate.officialRawBytes).digest('hex').toLowerCase()
      !== r.expectedSha256.toLowerCase()) return block('source-hash-mismatch');
  let official;
  try { official = JSON.parse(candidate.officialRawBytes); }
  catch { return block('invalid-official-json'); }
  if (official.name !== candidate.slug
      || JSON.stringify(official.files) !== JSON.stringify(candidate.sourceJson.files))
    return block('source-content-mismatch');
  return {
    status: 'eligible-for-restricted-build',
    namespace: candidate.namespace,
    slug: candidate.slug,
    sourceSha256: r.expectedSha256.toLowerCase(),
    reviewedDependencies: Object.keys(r.dependencyLock),
    // Approval is not code execution, license compliance, or browser verification.
  };
}
