import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const retailerPage = 'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectproducts/page.js';
const retailerCapitalPage = 'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/ProjectProducts/page.js';
const legacyPage = 'app/projectplanogram/[id]/projectproducts/page.js';
const retailerTable = 'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectproducts/components/ProjectProductTble.jsx';
const retailerCapitalTable = 'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/ProjectProducts/components/ProjectProductTble.jsx';
const retailerPublishModal = 'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/submitreport/components/PublishModal.jsx';

describe('projectproducts data loading - fetching not stuck', () => {
  it('retailer page initial loading is boolean (not null) and always resets', () => {
    for (const rel of [retailerPage, retailerCapitalPage]) {
      const c = read(rel);
      // Should not initialize loading with null (causes flash and ambiguous falsy)
      assert.ok(!c.includes('projectProducLoading] = useState(null)') && !c.includes('projectProducLoading, setProjectProducLoading] = useState(null'), `${rel} should not use useState(null) for projectProducLoading`);
      assert.ok(c.match(/projectProducLoading.*useState\(false\)/) || c.match(/projectProducLoading.*useState\(true\)/), `${rel} should init projectProducLoading with boolean`);
      // fetch should set loading true then false in finally, and data?.data fallback to array
      assert.ok(c.includes('setProjectProducLoading(true)'), `${rel} should set loading true on fetch start`);
      assert.ok(c.includes('setProjectProducLoading(false)'), `${rel} should set loading false in finally`);
    }
  });

  it('handles both wrapper {data: [...]} and direct array response', () => {
    for (const rel of [retailerPage, retailerCapitalPage, legacyPage]) {
      const c = read(rel);
      // Must handle data?.data ?? data fallback or Array.isArray check
      const hasFallback = c.includes('data?.data ??') || c.includes('data?.data ||') || c.includes('Array.isArray(data)') || c.includes('data?.data ?') || c.includes('?? data');
      assert.ok(hasFallback, `${rel} should handle both wrapper and direct array response`);
    }
  });

  it('retailer table component uses projectId not undefined id', () => {
    for (const rel of [retailerTable, retailerCapitalTable]) {
      const c = read(rel);
      // Should not have bare const { id } = params that yields undefined in retailer scope
      assert.ok(!c.match(/const\s*\{\s*id\s*\}\s*=\s*useParams\(\)/), `${rel} should not destructure bare id`);
      // Should derive id from projectId or retailerId
      assert.ok(c.includes('projectId') && c.includes('useParams'), `${rel} should use projectId from useParams`);
      assert.ok(c.includes('/getupcpogstoredata/') && c.includes('/getupcstoredata/'), `${rel} should have modal fetches`);
      // Ensure it uses correct variable (projectId or alias id = projectId)
      const hasAlias = c.includes('projectId') && (c.includes('const id = projectId') || c.includes('id = projectId') || c.includes('/${projectId}/') || c.includes('/${id}/'));
      assert.ok(hasAlias, `${rel} should alias id from projectId or use projectId directly`);
    }
  });

  it('retailer page does not hide table behind error - shows table with error banner', () => {
    for (const rel of [retailerPage, retailerCapitalPage]) {
      const c = read(rel);
      // Should have productsError inline banner, not early return blanking page
      assert.ok(c.includes('productsError'), `${rel} should have productsError`);
      assert.ok(c.includes('Failed to load products'), `${rel} should show failed to load products`);
      assert.ok(c.includes('<AppLayout>'), `${rel} should always render AppLayout`);
      // Should not have global if (error) return before AppLayout
      const firstLayout = c.indexOf('<AppLayout>');
      const earlyError = c.indexOf('if (error)');
      assert.ok(earlyError === -1 || earlyError > firstLayout, `${rel} should not have early error return before AppLayout`);
    }
  });

  it('paginatedData derives correctly even when data is undefined', () => {
    for (const rel of [retailerPage, retailerCapitalPage]) {
      const c = read(rel);
      // filteredProjectProduct should return [] when projectProductData falsy
      assert.ok(c.includes('if (!projectProductData) return []'), `${rel} should handle null projectProductData`);
      // paginatedData should fallback to []
      assert.ok(c.includes('paginatedData') && c.includes('slice'), `${rel} should have paginatedData slice`);
    }
  });

  it('PublishModal uses projectId for /projecttotals and related APIs', () => {
    const c = read(retailerPublishModal);
    assert.ok(c.includes('const { retailerId, projectId } = useParams()'), 'should destructure retailerId and projectId');
    assert.ok(!c.match(/const\s*\{\s*id\s*\}\s*=\s*useParams\(\)/), 'should not destructure bare id');
    assert.ok(c.includes('/projecttotals/${projectId}'), 'should call /projecttotals/${projectId} with projectId');
    assert.ok(c.includes('/projectstorelist/${retailerId}/${projectId}'), 'should call /projectstorelist/${retailerId}/${projectId}');
    assert.ok(c.includes('if (!projectId || !retailerId) return') || c.includes('if (step === 2 && projectId)'), 'should guard with projectId and retailerId');
    assert.ok(c.includes('updateRequest(') && c.includes('projectId,'), 'should pass projectId to updateRequest/polling');
  });

  it('all retailer projectplanogram routes use URL params as source of truth', () => {
    const projectRoutes = [
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/planogram/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectproducts/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/ProjectProducts/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectstores/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/validation/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/download/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/uploads/page.js',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/submitreport/page.js',
    ];
    for (const rel of projectRoutes) {
      const c = read(rel);
      assert.ok(c.includes('const { retailerId, projectId } = useParams()'), `${rel} should destructure retailerId and projectId from useParams`);
      assert.ok(!c.includes('useProject'), `${rel} should not import or use useProject`);
      assert.ok(!c.match(/const\s*\{\s*retailerId\s*\}\s*=\s*useProject/), `${rel} should not have retailerId from useProject`);
      assert.ok(!c.match(/const\s*\{\s*id\s*\}\s*=\s*useParams/), `${rel} should not destructure bare id`);
      // No dead params alias id: retailerId
      assert.ok(!c.includes('params = { retailerId, projectId, id:'), `${rel} should not have dead params alias`);
    }
    const componentRoutes = [
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectproducts/components/UploadProductsModal.jsx',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/ProjectProducts/components/UploadProductsModal.jsx',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/uploads/components/UploadModal.jsx',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/submitreport/components/PublishModal.jsx',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/projectproducts/components/ProjectProductTble.jsx',
      'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]/ProjectProducts/components/ProjectProductTble.jsx',
    ];
    for (const rel of componentRoutes) {
      const c = read(rel);
      assert.ok(c.includes('const { retailerId, projectId } = useParams()') || c.includes("const { retailerId, projectId } = useParams"), `${rel} should use retailerId and projectId from useParams`);
      assert.ok(!c.match(/const\s*\{\s*id\s*\}\s*=\s*useParams\(\)/), `${rel} should not destructure bare id`);
    }
  });
});
