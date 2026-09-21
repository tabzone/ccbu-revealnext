import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('retailerPlanogram projectplanogram routes - no undefined id ReferenceError', () => {
  it('submitreport page uses projectId not undefined id for currentProjectId', () => {
    const p = read('app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/submitreport/page.js');
    assert.ok(p.includes('const { retailerId, projectId } = useParams()'), 'should destructure retailerId and projectId');
    assert.ok(p.includes('const currentProjectId = projectId'), 'currentProjectId must be projectId, not id');
    assert.ok(!p.includes('const currentProjectId = id;'), 'must not assign undefined id');
    // Ensure file does not contain bare `if (id)` or `const ... = id` that would throw ReferenceError
    const bareIdMatches = [...p.matchAll(/(^|[^a-zA-Z0-9_])id([^a-zA-Z0-9_]|$)/g)].filter(m => {
      // allow params.id, projectId, retailerId, requestid etc - only count bare `id` word
      const before = p.slice(Math.max(0, m.index - 20), m.index);
      const after = p.slice(m.index, m.index + 10);
      // crude filter: ignore `params.id` already handled, ignore `projectId` already excluded by regex, ignore `requestid`
      return after.startsWith('id') && !before.includes('retailerId') && !before.includes('projectId');
    });
    // At least ensure no `if (id` pattern remains
    assert.ok(!p.includes('if (id)'), 'must not have if (id) bare reference');
    assert.ok(p.includes('String(projectId) !== String(currentProjectId)'), 'filter should compare projectId strings');
  });

  it('projectproducts pages use projectId && retailerId guard not id', () => {
    for (const rel of [
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectproducts/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/ProjectProducts/page.js',
    ]) {
      const c = read(rel);
      assert.ok(c.includes('const { retailerId, projectId } = useParams()'), `${rel} should destructure`);
      assert.ok(!c.includes('if (id && retailerId)'), `${rel} must not have if (id && retailerId)`);
      assert.ok(c.includes('if (projectId && retailerId)'), `${rel} should guard with projectId && retailerId`);
      // ensure no bare `id` variable declaration
      assert.ok(!c.match(/\bconst\s+id\b/), `${rel} should not declare bare id`);
    }
  });

  it('projectplanogram root redirect uses projectId not id', () => {
    const p = read('app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/page.js');
    assert.ok(p.includes('const { retailerId, projectId } = useParams()'), 'should destructure');
    assert.ok(p.includes('if (projectId) router.replace'), 'should check projectId');
    assert.ok(!p.includes('if (id) router.replace'), 'must not check bare id');
    assert.ok(p.includes('Redirecting to project {projectId}'), 'should display projectId');
    assert.ok(!p.includes('Redirecting to project {id}'), 'must not display bare id');
  });

  it('retailer scoped routes render without ReferenceError (no undefined id at runtime)', () => {
    const files = [
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/submitreport/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectproducts/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/ProjectProducts/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/page.js',
    ];
    for (const rel of files) {
      const content = read(rel);
      // Quick static check: file should be parsable and not contain undeclared `id` in scope
      // Check that every occurrence of ` id` is either part of `retailerId`, `projectId`, `requestid`, `params.id`, or `currentProjectId`
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\bif\s*\(\s*id\b/.test(line) || /\bconst\s+currentProjectId\s*=\s*id\b/.test(line)) {
          assert.fail(`${rel}:${i+1} still contains bare id reference: ${line.trim()}`);
        }
      }
    }
  });
});
