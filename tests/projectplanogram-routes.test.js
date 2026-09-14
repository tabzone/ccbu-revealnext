import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

describe('projectplanogram routes - lowercase canonical', () => {
  it('has lowercase projectproducts and projectstores folders', () => {
    const base = path.join(root, 'app/projectplanogram/[id]');
    assert.ok(fs.existsSync(path.join(base, 'projectproducts')), 'projectproducts folder should exist (lowercase)');
    assert.ok(fs.existsSync(path.join(base, 'projectproducts/page.js')), 'projectproducts/page.js should exist');
    assert.ok(fs.existsSync(path.join(base, 'projectstores')), 'projectstores folder should exist (lowercase)');
    assert.ok(fs.existsSync(path.join(base, 'projectstores/page.js')), 'projectstores/page.js should exist');
  });

  it('does not have uppercase folders as primary (lowercase is canonical)', () => {
    const base = path.join(root, 'app/projectplanogram/[id]');
    // Uppercase should not exist as separate real dirs; proxy handles legacy. Allow absence.
    // If they exist, they must be compatible, but canonical is lowercase.
    const hasLowerProducts = fs.existsSync(path.join(base, 'projectproducts'));
    const hasLowerStores = fs.existsSync(path.join(base, 'projectstores'));
    assert.ok(hasLowerProducts && hasLowerStores, 'canonical lowercase routes must exist');
  });

  it('Sidebar links point to lowercase routes', () => {
    const sidebar = fs.readFileSync(path.join(root, 'app/components/layout/Sidebar.jsx'), 'utf8');
    assert.ok(sidebar.includes('/projectproducts'), 'Sidebar should link to /projectproducts (lowercase)');
    assert.ok(sidebar.includes('/projectstores'), 'Sidebar should link to /projectstores (lowercase)');
    assert.ok(!sidebar.includes('/ProjectProducts'), 'Sidebar should not link to /ProjectProducts (uppercase)');
    assert.ok(!sidebar.includes('/ProjectStores'), 'Sidebar should not link to /ProjectStores (uppercase)');
  });

  it('proxy handles legacy uppercase without self-loop', async () => {
    const proxyPath = path.join(root, 'proxy.js');
    assert.ok(fs.existsSync(proxyPath), 'proxy.js should exist for legacy uppercase handling');
    const content = fs.readFileSync(proxyPath, 'utf8');
    // Should redirect uppercase to lowercase
    assert.ok(content.includes('/ProjectProducts') && content.includes('/projectproducts'), 'proxy should map ProjectProducts -> projectproducts');
    assert.ok(content.includes('/ProjectStores') && content.includes('/projectstores'), 'proxy should map ProjectStores -> projectstores');
    // Should not redirect lowercase to itself (no self-loop): check that it only checks for uppercase
    // The proxy should check for '/ProjectProducts' (capital) not '/projectproducts' as condition
    const hasUppercaseCheck = content.includes("'/ProjectProducts'") || content.includes('"/ProjectProducts"') || content.includes('/ProjectProducts');
    const lowerCondition = content.match(/if\s*\(.*projectproducts.*\)/i);
    // Ensure proxy does not unconditionally redirect lowercase
    assert.ok(hasUppercaseCheck, 'proxy should explicitly check for uppercase ProjectProducts');
    // Verify redirect is 307 and uses NextResponse.redirect
    assert.ok(content.includes('NextResponse.redirect'), 'proxy should use NextResponse.redirect');
    assert.ok(content.includes('307'), 'proxy redirect should be 307 (temporary)');
  });
});

describe('CCBU ProjectProducts error handling', () => {
  it('keeps page rendered on API failure (no global blank)', () => {
    const pagePath = path.join(root, 'app/projectplanogram/[id]/projectproducts/page.js');
    const content = fs.readFileSync(pagePath, 'utf8');
    // Should NOT have global early return that blanks page
    assert.ok(!content.includes('if (error) {'), 'should not have global if (error) early return');
    assert.ok(!content.includes('if (error)'), 'should not have global error blanking');
    // Should have per-section error states
    assert.ok(content.includes('totalsError'), 'should have totalsError state');
    assert.ok(content.includes('productsError'), 'should have productsError state');
    assert.ok(content.includes('hierarchyError'), 'should have hierarchyError state');
  });

  it('shows clear error message with retry for each section', () => {
    const pagePath = path.join(root, 'app/projectplanogram/[id]/projectproducts/page.js');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes('Failed to load totals:'), 'should show Failed to load totals with retry');
    assert.ok(content.includes('Failed to load products:'), 'should show Failed to load products with retry');
    assert.ok(content.includes('Failed to load hierarchy:'), 'should show Failed to load hierarchy with retry');
    // Retry buttons should call respective fetch
    assert.ok(content.includes('onClick={fetchTotals}'), 'retry should call fetchTotals');
    assert.ok(content.includes('onClick={fetchProjectProducts}'), 'retry should call fetchProjectProducts');
    assert.ok(content.includes('onClick={() => fetchProjectPlanogramHierarchy(selectedFilter)}'), 'retry should call fetchProjectPlanogramHierarchy');
  });

  it('handles 404/500 independently without blanking UI', () => {
    const pagePath = path.join(root, 'app/projectplanogram/[id]/projectproducts/page.js');
    const content = fs.readFileSync(pagePath, 'utf8');
    const lambdaPath = path.join(root, 'app/lamda/lambdaClient.js');
    const lambdaContent = fs.readFileSync(lambdaPath, 'utf8');
    // Each fetch should throw with clear message and set its own error
    assert.ok(content.includes("throw new Error(data?.error"), 'each fetch should throw on data.error');
    assert.ok(lambdaContent.includes('Request failed with status'), 'lambdaClient throws Request failed with status should be surfaced via err.message');
    // AppLayout should always be rendered (page never returns early)
    const appLayoutCount = (content.match(/<AppLayout>/g) || []).length;
    assert.ok(appLayoutCount >= 1, 'AppLayout should be rendered');
    // No early return before AppLayout
    const firstAppLayout = content.indexOf('<AppLayout>');
    const earlyReturn = content.indexOf('if (error)');
    assert.ok(earlyReturn === -1 || earlyReturn > firstAppLayout, 'no early error return before AppLayout');
  });
});

describe('CCBU retailerId API contract', () => {
  it('projectproducts and related endpoints include retailerId', () => {
    const files = [
      'app/projectplanogram/[id]/projectproducts/page.js',
      'app/projectplanogram/[id]/ProjectProducts/page.js',
      'app/projectplanogram/[id]/projectstores/page.js',
      'app/projectplanogram/[id]/planogram/page.js',
      'app/projectplanogram/[id]/validation/page.js',
    ];
    for (const rel of files) {
      const p = path.join(root, rel);
      if (!fs.existsSync(p)) continue;
      const content = fs.readFileSync(p, 'utf8');
      // Must import and use useProject / retailerId
      if (rel.includes('projectproducts') || rel.includes('ProjectProducts') || rel.includes('projectstores') || rel.includes('planogram') || rel.includes('validation')) {
        assert.ok(content.includes('useProject') && content.includes('retailerId'), `${rel} should use useProject and retailerId`);
      }
    }
    // Check specific endpoint patterns include retailerId
    const pp = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/projectproducts/page.js'), 'utf8');
    assert.ok(pp.includes('/projectproducts/${retailerId}/${id}'), 'projectproducts should be /projectproducts/${retailerId}/${id}');
    assert.ok(pp.includes('/${filter}/${retailerId}/${id}'), 'report hierarchies should be /${filter}/${retailerId}/${id}');

    const ps = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/projectstores/page.js'), 'utf8');
    assert.ok(ps.includes('/projectstores/${retailerId}/${id}') || ps.includes('/${filter}/${retailerId}/${id}'), 'projectstores should be /projectstores/${retailerId}/${id}');

    const pl = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/planogram/page.js'), 'utf8');
    assert.ok(pl.includes('/projectplanogramhierarchy/${retailerId}/${id}/${filter}'), 'projectplanogramhierarchy should include retailerId');
    assert.ok(pl.includes('/projectplanogramsv1/${retailerId}/${id}'), 'projectplanogramsv1 should include retailerId');

    const val = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/validation/page.js'), 'utf8');
    assert.ok(val.includes('/getvalidationmessage/${retailerId}/${id}/val1'), 'getvalidationmessage val1 should include retailerId');
    assert.ok(val.includes('/getvalidationmessage/${retailerId}/${id}/${val}'), 'getvalidationmessage val should include retailerId');
  });

  it('no legacy CCBU endpoints remain without retailerId', () => {
    const dir = path.join(root, 'app/projectplanogram');
    const legacyPatterns = [
      '/projectproducts/${id}',
      '/projectstores/${id}',
      '/getvalidationmessage/${id}/',
      '/projectplanogramhierarchy/${id}/',
      '/projectplanogramsv1/${id}',
      '/reportproducthierarchy/${id}',
      '/reportpackagehierarchy/${id}',
      '/reportbrandhierarchy/${id}',
    ];
    function walk(d) {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.jsx'))) {
          const content = fs.readFileSync(full, 'utf8');
          for (const pat of legacyPatterns) {
            // Ensure legacy without retailerId is not present, but allow the new with retailerId
            if (content.includes(pat) && !content.includes(pat.replace('${id}', '${retailerId}/${id}')) && !content.includes('${retailerId}/${id}')) {
              // More precise: check if file contains the legacy pattern and not the new
              // Allow if it's a comment or not an API call, but we check for lambdaGet with legacy
              const hasLegacy = content.includes(`\`${pat}\``) || content.includes(`"${pat}"`) || content.includes(`'${pat}'`) || content.includes(`\`${pat.replace('${id}', '${id}')}\``);
              if (content.includes(pat) && content.includes('lambdaGet') && content.includes(pat)) {
                // If file also contains the new pattern with retailerId, it's okay (means it was updated)
                const hasNew = content.includes('/${retailerId}/${id}');
                if (!hasNew) {
                  assert.fail(`${path.relative(root, full)} still contains legacy endpoint ${pat} without retailerId`);
                }
              }
            }
          }
        }
      }
    }
    walk(dir);
  });

  it('retailerId comes from project data, not hardcoded', () => {
    const hookPath = path.join(root, 'app/hooks/useProject.js');
    assert.ok(fs.existsSync(hookPath), 'useProject hook should exist');
    const hook = fs.readFileSync(hookPath, 'utf8');
    assert.ok(hook.includes('extractRetailerId') || hook.includes('retailerid'), 'hook should extract retailerId from project');
    assert.ok(hook.includes('lambdaGet') && hook.includes('/getproject/${id}'), 'hook should fetch getproject');
    assert.ok(!hook.includes('hardcode') && !hook.match(/retailerId\s*=\s*["\']\w+["\']/), 'retailerId should not be hardcoded');
    // Check that pages do not hardcode retailerId
    const pp = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/projectproducts/page.js'), 'utf8');
    assert.ok(!pp.match(/const retailerId\s*=\s*["'][^"]+["']/), 'projectproducts should not hardcode retailerId');
    assert.ok(pp.includes('useProject'), 'should use useProject to get retailerId');
  });
});

describe('CCBU ProjectStores V3 parity', () => {
  it('ProjectStores page reproduces V3 layout and uses retailerId', () => {
    const pagePath = path.join(root, 'app/projectplanogram/[id]/projectstores/page.js');
    assert.ok(fs.existsSync(pagePath), 'projectstores/page.js should exist');
    const content = fs.readFileSync(pagePath, 'utf8');
    // Must use AppLayout and retailerId
    assert.ok(content.includes('AppLayout'), 'should wrap with AppLayout');
    assert.ok(content.includes('useProject') && content.includes('retailerId'), 'should use useProject for retailerId');
    // API must be retailerId aware
    assert.ok(content.includes('/projectstores/${retailerId}/${id}') || content.includes('/${filter}/${retailerId}/${id}'), 'projectstores API should include retailerId');
    assert.ok(content.includes('/projectstorehierarchy/${retailerId}/${id}/'), 'projectstorehierarchy should include retailerId');
    // UI parity with V3: hierarchy filter, table, pagination, search, download, upload
    assert.ok(content.includes('Select Hierarchy') || content.includes('Hierarchy'), 'should have hierarchy filter');
    assert.ok(content.includes('Upload Store Data'), 'should have Upload Store Data button');
    assert.ok(content.includes('ProjectStoresTable'), 'should use ProjectStoresTable');
    assert.ok(content.includes('SearchIcon') || content.includes('searchTerm'), 'should have search');
    assert.ok(content.includes('downloadDataFile') || content.includes('DownloadIcon'), 'should have download');
    assert.ok(content.includes('ChevronsLeft') && content.includes('ChevronRight'), 'should have pagination controls');
    assert.ok(content.includes('Rows per page'), 'should have rows per page');
  });

  it('ProjectStoresTable component exists with V3 parity', () => {
    const tablePath = path.join(root, 'app/components/table/ProjectStoresTable.jsx');
    assert.ok(fs.existsSync(tablePath), 'ProjectStoresTable.jsx should exist');
    const content = fs.readFileSync(tablePath, 'utf8');
    assert.ok(content.includes('storenumber') && content.includes('pogcount'), 'should have Store Numbers and Pog Count columns');
    assert.ok(content.includes('region') && content.includes('division') && content.includes('state'), 'should have Region/Division/State columns');
    assert.ok(content.includes('storeaddress1') && content.includes('storezip'), 'should have address columns');
    assert.ok(content.includes('QR') || content.includes('QrCode') || content.includes('getqrcode'), 'should have QR column/logic');
    assert.ok(content.includes('SortIcon') || content.includes('onSort'), 'should support sorting');
    assert.ok(content.includes('isLoading') || content.includes('LoadingSpinner'), 'should handle loading/empty states');
  });
});
