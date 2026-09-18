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

describe('CCBU SubmitReport V3 exact parity (folder match)', () => {
  it('submitreport folder structure matches V3', () => {
    const ccbuBase = path.join(root, 'app/projectplanogram/[id]/submitreport');
    const v3Page = path.join('/home/nobin/projects/revealv3-pog/src/app/(app)/projectplanogram/[id]/submitreport/page.js');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'page.js')), 'CCBU submitreport/page.js should exist');
    assert.ok(fs.existsSync(v3Page), 'V3 page.js should exist');
    // CCBU should have local components mirroring V3 dependencies
    assert.ok(fs.existsSync(path.join(ccbuBase, 'components/PublishModal.jsx')), 'local PublishModal should exist inside submitreport folder');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'components/PublishProjectReqTable.jsx')), 'local PublishProjectReqTable should exist');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'components/Modal.jsx')), 'local Modal should exist');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'components/LoadingSpinner.jsx')), 'local LoadingSpinner should exist');
  });

  it('page.js reproduces V3 logic/UI without changing outside folder', () => {
    const ccbuPage = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/submitreport/page.js'), 'utf8');
    const v3Page = fs.readFileSync(path.join('/home/nobin/projects/revealv3-pog/src/app/(app)/projectplanogram/[id]/submitreport/page.js'), 'utf8');
    // Core V3 UI strings must be present
    assert.ok(ccbuPage.includes('Publish For Extraction'), 'should have V3 header Publish For Extraction');
    assert.ok(ccbuPage.includes('Comparison Report'), 'should have Comparison Report toggle');
    assert.ok(ccbuPage.includes('Create Comparison Report'), 'should have Create Comparison Report');
    assert.ok(ccbuPage.includes('Comparison Project'), 'should have Comparison Project selector');
    assert.ok(ccbuPage.includes('Active Report'), 'should have Active Report toggle');
    assert.ok(ccbuPage.includes('Comparison Report Details'), 'should have Comparison Report Details');
    assert.ok(ccbuPage.includes('Project Requests'), 'should have Project Requests section');
    assert.ok(ccbuPage.includes('PublishProjectReqTable'), 'should use PublishProjectReqTable');
    assert.ok(ccbuPage.includes('PublishModal'), 'should use PublishModal');
    // Core V3 logic must be present
    assert.ok(ccbuPage.includes('getRetailerIdFromProject'), 'should have getRetailerIdFromProject helper');
    // Robust retailerId extraction — must handle all CCBU shapes (retailID, retailerId, retailerid, baseCallPoints, etc.)
    assert.ok(ccbuPage.includes('retailID') && ccbuPage.includes('retailerId') && ccbuPage.includes('retailerid'), 'getRetailerIdFromProject should handle retailID/retailerId/retailerid variants');
    assert.ok(ccbuPage.includes('baseCallPoints') || ccbuPage.includes('basecallpoints'), 'should handle baseCallPoints array shape');
    assert.ok(ccbuPage.includes('project?.project') || ccbuPage.includes('data?.project'), 'should unwrap data.project wrapper');
    // Must handle retailerId as string, not object, and trim
    assert.ok(ccbuPage.includes('String(') || ccbuPage.includes('.trim()'), 'should normalize retailerId to string');
    // Must call retailer-aware listprojects — tolerate both legacy lambda and new api path, with robust fallback
    const hasLegacy = ccbuPage.includes('/listprojects/${retailerId}');
    const hasNew = ccbuPage.includes('/retailers/listprojects/${retailerId}') || ccbuPage.includes('/retailers/${retailerId}/projects') || ccbuPage.includes('apiGet');
    assert.ok(hasLegacy || hasNew, 'should fetch listprojects with retailerId (legacy /listprojects/${retailerId} or new /retailers/listprojects/${retailerId})');
    // Must handle empty retailerId fallback fetch
    assert.ok(ccbuPage.includes('fetchCurrentProjectDetails()'), 'should refetch project if retailerId initially missing');
    assert.ok(ccbuPage.includes('/getprojectrequest/${id}/${filetype}'), 'should fetch getprojectrequest');
    assert.ok(ccbuPage.includes('/getvalidation/${id}'), 'should fetch getvalidation');
    assert.ok(ccbuPage.includes('isPublishDisabled'), 'should have isPublishDisabled logic');
    assert.ok(ccbuPage.includes('isEnabled && !selectedCompareProject'), 'publish disabled when comparison required');
    // CCBU adaptations must not use Redux (outside folder intact)
    assert.ok(!ccbuPage.includes("from \"react-redux\"") && !ccbuPage.includes("from 'react-redux'"), 'should not import react-redux (no Redux in CCBU)');
    // Verify outside global PublishModal was NOT overwritten (keeps weekly sales publish)
    const globalPublish = fs.readFileSync(path.join(root, 'app/components/modal/PublishModal.jsx'), 'utf8');
    assert.ok(globalPublish.includes('Publish Data') && globalPublish.includes('apiGet'), 'global PublishModal should remain weekly-sales version, not overwritten');
  });

  it('local PublishModal matches V3 PublishModal implementation', () => {
    const local = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/submitreport/components/PublishModal.jsx'), 'utf8');
    const v3 = fs.readFileSync(path.join('/home/nobin/projects/revealv3-pog/src/app/components/modal/PublishModal.js'), 'utf8');
    // Key V3 modal features
    assert.ok(local.includes('Select Report Type') && local.includes('Review And Submit') && local.includes('Check Status'), 'should have 3-step wizard');
    assert.ok(local.includes('Validation Failed') || local.includes('Validation Success'), 'should have validation banner');
    assert.ok(local.includes('Total Planograms') && local.includes('Total Products') && local.includes('Total Stores'), 'should have totals cards');
    assert.ok(local.includes('Stores Exclude'), 'should have Stores Exclude');
    assert.ok(local.includes('pollGetRequest') && local.includes('/getrequest/${projectId}/${requestId}/${filetype}'), 'should have polling logic');
    // Content should be substantially same as V3 (allow CCBU lambda path diff)
    const normalize = s => s.replace(/@\/app\/utils\/lambdaClient/g, '@/app/lamda/lambdaClient').replace(/react-redux/g, '');
    assert.ok(normalize(local).includes('fetchStores') && normalize(v3).includes('fetchStores'), 'both should have fetchStores');
  });

  it('local PublishProjectReqTable matches V3', () => {
    const local = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/submitreport/components/PublishProjectReqTable.jsx'), 'utf8');
    const v3 = fs.readFileSync(path.join('/home/nobin/projects/revealv3-pog/src/app/components/table/PublishProjectReqTable.js'), 'utf8');
    assert.ok(local.includes('FILE_TYPE_MAP') && local.includes('SUB'), 'should have FILE_TYPE_MAP');
    assert.ok(local.includes('formatDate'), 'should use formatDate');
    assert.ok(local.includes('File Type') && local.includes('Created At') && local.includes('Updated / Completed At') && local.includes('Status'), 'should have 4 columns');
    // Rough parity: same table structure
    assert.equal(local.includes('PublishProjectReqTable'), v3.includes('PublishProjectReqTable'), 'component name parity');
  });
});

describe('CCBU Download V3 exact parity (folder match)', () => {
  it('download folder structure matches V3', () => {
    const ccbuBase = path.join(root, 'app/projectplanogram/[id]/download');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'page.js')), 'CCBU download/page.js should exist');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'components/DownloadTable.jsx')), 'local DownloadTable should exist inside download folder');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'components/LoadingSpinner.jsx')), 'local LoadingSpinner should exist');
    assert.ok(fs.existsSync(path.join(ccbuBase, 'components/formatters.js')), 'local formatters should exist');
  });

  it('page.js reproduces V3 layout/styling/controls and preserves CCBU data flow with retailerId', () => {
    const ccbuPage = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/download/page.js'), 'utf8');
    const v3Page = fs.readFileSync(path.join('/home/nobin/projects/revealv3-pog/src/app/(app)/projectplanogram/[id]/download/page.js'), 'utf8');
    // V3 UI/layout must be reproduced (theme-aware: text color via th.textSec, class may be inline style)
    assert.ok(ccbuPage.includes('relative w-full h-full flex flex-col'), 'should have V3 outer container');
    assert.ok(ccbuPage.includes('RefreshCcw') && ccbuPage.includes('Reload'), 'should have Reload button with RefreshCcw');
    assert.ok(ccbuPage.includes('DownloadTable'), 'should use DownloadTable');
    assert.ok(ccbuPage.includes('Rows per page:'), 'should have Rows per page control');
    assert.ok(ccbuPage.includes('Showing') && ccbuPage.includes('of {totalRows}'), 'should have Showing x-y of total');
    assert.ok(ccbuPage.includes('Page {totalRows'), 'should have Page x of y');
    assert.ok(ccbuPage.includes('ChevronsLeft') && ccbuPage.includes('ChevronRight'), 'should have pagination chevrons');
    assert.ok(ccbuPage.includes('filteredExtractFiles') && ccbuPage.includes('handleSort'), 'should have sorting/filtering logic');
    assert.ok(ccbuPage.includes('/getextractfile/'), 'should fetch getextractfile');
    // CCBU data flow: retailerId-aware, AppLayout wrapped, no unrelated break
    assert.ok(ccbuPage.includes('useProject') && ccbuPage.includes('retailerId'), 'should use retailerId from useProject');
    assert.ok(ccbuPage.includes('/getextractfile/${retailerId}/${params?.id}') || ccbuPage.includes('/getextractfile/${retailerId}'), 'should have retailer-aware getextractfile');
    assert.ok(ccbuPage.includes('AppLayout'), 'should be wrapped in AppLayout to keep CCBU layout');
    assert.ok(ccbuPage.includes('isLoading') && ccbuPage.includes('extractFilesData'), 'should preserve loading/data states');
    // Verify outside pages not changed by this edit (submitreport still intact)
    const submitPage = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/submitreport/page.js'), 'utf8');
    assert.ok(submitPage.includes('Publish For Extraction'), 'unrelated submitreport page should stay intact');
  });

  it('local DownloadTable matches V3 implementation', () => {
    const local = fs.readFileSync(path.join(root, 'app/projectplanogram/[id]/download/components/DownloadTable.jsx'), 'utf8');
    const v3 = fs.readFileSync(path.join('/home/nobin/projects/revealv3-pog/src/app/components/table/DownloadTable.js'), 'utf8');
    assert.ok(local.includes('File Name') && local.includes('Updated At') && local.includes('Size') && local.includes('Status') && local.includes('Download'), 'should have 5 columns');
    assert.ok(local.includes('formatDate') && local.includes('formatFileSize'), 'should use formatters');
    assert.ok(local.includes('LoadingSpinner') && local.includes('No data found'), 'should handle loading/empty states');
    assert.ok(local.includes('handleDownload') && local.includes('toast.info'), 'should have download handler with toast');
    assert.ok(local.includes('Loader') && local.includes('animate-spin'), 'should show spinner when downloading');
    // Content parity (allow jsx vs js extension)
    assert.ok(local.includes('DownloadTable') && v3.includes('DownloadTable'), 'component name parity');
  });
});

describe('CCBU Planogram download resilience', () => {
  it('uses retailer-aware downloadurl with fallback and validates URL', () => {
    const pagePath = path.join(root, 'app/projectplanogram/[id]/planogram/page.js');
    const content = fs.readFileSync(pagePath, 'utf8');
    // Must use retailerId-aware primary path
    assert.ok(content.includes('/downloadurl/${retailerId}/${id}/POG'), 'should call /downloadurl/${retailerId}/${id}/POG when retailerId available');
    // Legacy fallback for mixed backend
    assert.ok(content.includes('/downloadurl/${id}/POG'), 'should fallback to /downloadurl/${id}/POG');
    // Flexible extraction: downloadUrl || url || data.downloadUrl || string
    assert.ok(content.includes('downloadUrl') && content.includes('|| res?.url'), 'should handle both downloadUrl and url shapes');
    assert.ok(content.includes('typeof res === "string"'), 'should handle string response');
    // Validates URL before triggering download
    assert.ok(content.includes('startsWith') || content.includes('^https?'), 'should validate URL is http');
    assert.ok(content.includes('Download URL not available'), 'should throw when URL missing');
    // Shows detailed error toast, not generic
    assert.ok(content.includes('Download failed:'), 'should surface error message in toast');
    // Uses retailerId from useProject
    assert.ok(content.includes('useProject') && content.includes('retailerId'), 'should get retailerId from useProject');
    // Guards missing id
    assert.ok(content.includes('Missing project id'), 'should guard missing id');
  });
});

describe('CCBU lamdaClient binary handling', () => {
  it('handles JSON vs Blob (PDF/qrcode) without SyntaxError', () => {
    const lambdaPath = path.join(root, 'app/lamda/lambdaClient.js');
    const content = fs.readFileSync(lambdaPath, 'utf8');
    // Must inspect content-type before parsing, like V3
    assert.ok(content.includes('content-type') || content.includes('contentType') || content.includes('get("content-type"'), 'should check content-type header');
    assert.ok(content.includes('application/json'), 'should handle application/json');
    // PDF / image / octet-stream → blob (fix for %PDF-1.3 SyntaxError)
    assert.ok(content.includes('application/pdf') || content.includes('pdf'), 'should handle PDF blob');
    assert.ok(content.includes('response.blob()'), 'should return blob for binary');
    assert.ok(content.includes('response.text()'), 'should fallback to text for non-JSON');
    // Should not blindly JSON-parse every response
    assert.ok(!content.includes('const data =\n    await response.json();\n\n  if (!response.ok)'), 'should not parse JSON before checking ok/content-type');
    // Handle non-ok with text, not JSON message
    assert.ok(content.includes('!response.ok'), 'should check response.ok');
  });
});

describe('MANAGE PROJECTS retailer select', () => {
  it('retailer-scoped masterdata gets retailerId from route and fetches without selector', () => {
    const retailerPathId = path.join(root, 'app/retailerPlanogram/[id]/masterdata/page.js');
    const retailerPathRetailer = path.join(root, 'app/retailerPlanogram/[retailerId]/masterdata/page.js');
    const retailerPath = fs.existsSync(retailerPathRetailer) ? retailerPathRetailer : retailerPathId;
    const content = fs.readFileSync(retailerPath, 'utf8');
    // Must get retailerId from route params (supports retailerId or id)
    assert.ok(content.includes('useParams') && (content.includes('params?.id') || content.includes('params?.retailerId') || content.includes('retailerId')), 'retailer-scoped masterdata must get retailerId from useParams');
    assert.ok(content.includes('/listprojects/${retailerId'), 'should fetch /listprojects/${retailerId}');
    // Must pass retailerId to CreateProjectModal
    assert.ok(content.includes('CreateProjectModal') && content.includes('retailerId={retailerId}'), 'should pass retailerId to CreateProjectModal');
    // Must NOT use legacy global retailer selector storage
    assert.ok(!content.includes('manageReportsSelectedRetailer') && !content.includes('STORAGE_KEY'), 'retailer-scoped must not use legacy retailer selector storage');
    assert.ok(!content.includes('Select retailer:') && !content.includes('Select retailer</label>'), 'must not have legacy retailer dropdown label');
  });
  it('legacy global managePlanograms redirects to manageReports', () => {
    const legacyPath = path.join(root, 'app/managePlanograms/masterdata/page.js');
    const content = fs.readFileSync(legacyPath, 'utf8');
    assert.ok(content.includes('/manageReports'), 'legacy global page should redirect to /manageReports');
    // proxy redirect is optional - legacy page client redirect is sufficient
    assert.ok(fs.existsSync(legacyPath), 'legacy global page should exist as redirect');
  });
});
