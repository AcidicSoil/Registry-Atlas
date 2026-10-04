/** User-safe descriptions for reviewed local preview errors. Never render a remote exception. */
export function describeSourcePreviewFailure(value: unknown): string {
  const record = value && typeof value === 'object'
    ? value as Record<string, unknown> : {};
  const reason = record.reason;
  const dependency = typeof record.package === 'string'
    && /^(?:@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)$/.test(record.package)
    ? record.package : null;
  if (reason === 'unreviewed-package' && dependency)
    return 'Source preview cannot run: dependency '+dependency+
      ' is not reviewed for the local preview runtime. The original component remains available.';
  if (reason === 'unpinned-package' && dependency
      || reason === 'dependency-version-mismatch' && dependency)
    return 'Source preview cannot run: dependency '+dependency+
      ' does not match the reviewed version. The original component remains available.';
  if (reason === 'source-file-too-large' || reason === 'too-many-source-files'
      || reason === 'preview-budget-exceeded')
    return 'Source preview blocked: upstream source exceeds the local preview size limit. The original component remains available.';
  if (reason === 'author-demo-required' || reason === 'component-export-unresolved')
    return 'Source preview needs an unambiguous upstream demo. No substitute behavior was generated.';
  if (reason === 'registry-preview-unavailable')
    return 'Source preview could not be loaded from the registry. Check connectivity and retry; the original page remains available.';
  return 'Source preview unavailable for this component. The original page remains available.';
}
