import {describe,expect,it} from 'vitest';
import {describeSourcePreviewFailure} from '../../src/registry-explorer/ui/sourcePreviewStatus';

describe('local source-preview failure states',()=>{
 it('explains which reviewed package is missing without asserting that it was verified',()=>{
  const message=describeSourcePreviewFailure({reason:'unreviewed-package',package:'motion'});
  expect(message).toContain('motion');
  expect(message).toMatch(/not reviewed/i);
  expect(message).toMatch(/cannot run/i);
 });
 it('separates a source budget block from transient retrieval errors',()=>{
  expect(describeSourcePreviewFailure({reason:'source-file-too-large'}))
    .toMatch(/size limit/i);
  expect(describeSourcePreviewFailure({reason:'registry-preview-unavailable'}))
    .toMatch(/could not be loaded/i);
 });
 it('never renders arbitrary remote error strings or paths',()=>{
  const message=describeSourcePreviewFailure({reason:'/home/user/PRIVATE',package:'<img onerror=alert(1)>'});
  expect(message).not.toMatch(/PRIVATE|img|alert/);
  expect(message).toMatch(/unavailable/i);
 });
});
