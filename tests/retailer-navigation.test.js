import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

describe('Retailer navigation refactor - Manage Planograms -> retailer scoped', () => {
  it('global Sidebar no longer contains Manage Planograms, retains Dashboard/Manage Reports/Users', () => {
    const sidebar = fs.readFileSync(path.join(root, 'app/components/layout/Sidebar.jsx'), 'utf8');
    // Global section is the return at bottom - check it does not contain Manage Planograms
    // Extract global return block: look for the second return [
    const globalHasManagePlanograms = sidebar.includes('label: "Manage Planograms"') && sidebar.includes('/managePlanograms/masterdata');
    assert.ok(!globalHasManagePlanograms, 'global Sidebar must NOT contain Manage Planograms with /managePlanograms/masterdata');
    // Global must still have Dashboard, Manage Reports, Users
    assert.ok(sidebar.includes('label: "Dashboard"'), 'global sidebar must contain Dashboard');
    assert.ok(sidebar.includes('label: "Manage Reports"'), 'global sidebar must contain Manage Reports');
    assert.ok(sidebar.includes('href: "/manageReports"'), 'Manage Reports must link to /manageReports');
    assert.ok(sidebar.includes('label: "Users"'), 'global sidebar must contain Users');
    assert.ok(sidebar.includes('href: "/users"'), 'Users must link to /users');
    // Must not have stale global Manage Planograms href
    assert.ok(!sidebar.includes('"/managePlanograms/masterdata"') && !sidebar.includes("'/managePlanograms/masterdata'"), 'no stale global /managePlanograms/masterdata link should remain');
    assert.ok(!sidebar.includes('"/managePlanograms/timeperiod"') && !sidebar.includes("'/managePlanograms/timeperiod'"), 'no stale global /managePlanograms/timeperiod link should remain');
  });

  it('retailer Sidebar contains Planograms with Project and Master Data with Resets (renamed labels)', () => {
    const sidebar = fs.readFileSync(path.join(root, 'app/components/layout/Sidebar.jsx'), 'utf8');
    assert.ok(sidebar.includes('if (pathname?.startsWith("/retailerPlanogram"))'), 'retailerPlanogram sidebar block must exist');
    const retailerBlockStart = sidebar.indexOf('if (pathname?.startsWith("/retailerPlanogram"))');
    const retailerBlock = sidebar.slice(retailerBlockStart);
    // Old labels must be gone
    assert.ok(!retailerBlock.includes('"Manage Planograms"'), 'retailer sidebar must NOT contain old Manage Planograms label (renamed to Planograms)');
    assert.ok(!retailerBlock.includes('"Manage Projects"'), 'retailer sidebar must NOT contain old Manage Projects label (renamed to Project)');
    assert.ok(!retailerBlock.includes('"Manage Timeperiod"') && !retailerBlock.includes('"Manage Time Period"'), 'retailer sidebar must NOT contain old Manage Timeperiod label (renamed to Resets)');
    // New labels must exist
    assert.ok(retailerBlock.includes('"Planograms"'), 'retailer sidebar must contain Planograms');
    assert.ok(retailerBlock.includes('"Resets"'), 'retailer sidebar must contain Resets');
    // Project label may be "Project" or "Projects" - accept either but must not be "Manage Projects"
    assert.ok(retailerBlock.includes('"Project"') || retailerBlock.includes('"Projects"'), 'retailer sidebar must contain Project(s) under Planograms');
    // Order: Master Data -> Planograms -> Weekly Sales Upload -> Settings
    const idxMaster = retailerBlock.indexOf('"Master Data"');
    const idxPlanograms = retailerBlock.indexOf('"Planograms"');
    const idxWeekly = retailerBlock.indexOf('"Weekly Sales Upload"');
    const idxSettings = retailerBlock.indexOf('"Settings"');
    assert.ok(idxMaster !== -1 && idxPlanograms !== -1 && idxWeekly !== -1 && idxSettings !== -1, 'retailer sidebar must contain Master Data, Planograms, Weekly Sales Upload, Settings');
    assert.ok(idxMaster < idxPlanograms && idxPlanograms < idxWeekly && idxWeekly < idxSettings, 'order must be Master Data -> Planograms -> Weekly Sales Upload -> Settings');
    // Master Data must contain Resets with timeperiod href
    const masterSection = retailerBlock.slice(idxMaster, idxMaster + 1500);
    assert.ok(masterSection.includes('"Resets"'), 'Master Data must contain Resets child');
    assert.ok(masterSection.includes('"Products"') && masterSection.includes('"Stores"') && masterSection.includes('"Week Setup"'), 'Master Data must retain Products/Stores/Week Setup');
    assert.ok(masterSection.includes('/retailerPlanogram/${id}/timeperiod') || masterSection.includes('/retailerPlanogram/${retailerId}/timeperiod'), 'Resets href must be /retailerPlanogram/${id or retailerId}/timeperiod with dynamic id');
    assert.ok(!masterSection.includes('/managePlanograms/masterdata'), 'Master Data must NOT use old global route');
    // Planograms must contain Project(s) with masterdata href and must NOT contain Resets
    const planogramsSection = retailerBlock.slice(idxPlanograms, idxPlanograms + 1000);
    assert.ok(planogramsSection.includes('/retailerPlanogram/${id}/masterdata') || planogramsSection.includes('/retailerPlanogram/${retailerId}/masterdata'), 'Project href must be /retailerPlanogram/${id or retailerId}/masterdata with dynamic id');
    assert.ok(!planogramsSection.includes('"Resets"'), 'Planograms must NOT contain Resets (moved to Master Data)');
    assert.ok(!planogramsSection.includes('/managePlanograms/masterdata'), 'retailer Planograms must NOT use old global route');
    assert.ok(!planogramsSection.includes('Manage Reports'), 'Manage Reports must NOT be under Planograms');
    // Planograms should have exactly 1 child (Project)
    const planogramsChildCount = (planogramsSection.match(/label: "Project/g) || []).length;
    assert.ok(planogramsChildCount === 1, 'Planograms must have exactly 1 child (Project)');
    // Master Data should have Resets as one of its children
    assert.ok(masterSection.includes('"Resets"'), 'Master Data must have Resets as child');
  });

  it('retailer DataTable links use dynamic retailerId to /retailerPlanogram/${rid}/products', () => {
    const dt = fs.readFileSync(path.join(root, 'app/components/table/DataTable.jsx'), 'utf8');
    assert.ok(dt.includes('`/retailerPlanogram/${rid}/products`'), 'DataTable must link to `/retailerPlanogram/${rid}/products` with dynamic rid');
    assert.ok(!dt.includes('4e221Q27Pk'), 'DataTable must not hardcode example retailer id');
    // Verify ManageReports still uses DataTable
    const mr = fs.readFileSync(path.join(root, 'app/components/ManageReports.jsx'), 'utf8');
    assert.ok(mr.includes('DataTable'), 'ManageReports must still render DataTable');
  });

  it('retailer-scoped masterdata and timeperiod routes exist with dynamic retailerId', () => {
    const masterPathId = path.join(root, 'app/retailerPlanogram/[id]/masterdata/page.js');
    const masterPathRetailer = path.join(root, 'app/retailerPlanogram/[retailerId]/masterdata/page.js');
    const timePathId = path.join(root, 'app/retailerPlanogram/[id]/timeperiod/page.js');
    const timePathRetailer = path.join(root, 'app/retailerPlanogram/[retailerId]/timeperiod/page.js');
    const masterPath = fs.existsSync(masterPathRetailer) ? masterPathRetailer : masterPathId;
    const timePath = fs.existsSync(timePathRetailer) ? timePathRetailer : timePathId;
    assert.ok(fs.existsSync(masterPath), 'retailerPlanogram/[id] or [retailerId]/masterdata/page.js must exist');
    assert.ok(fs.existsSync(timePath), 'retailerPlanogram/[id] or [retailerId]/timeperiod/page.js must exist');
    const master = fs.readFileSync(masterPath, 'utf8');
    const time = fs.readFileSync(timePath, 'utf8');
    // Must use useParams for retailerId
    assert.ok(master.includes('useParams') && master.includes('params?.id'), 'masterdata must get retailerId from useParams');
    assert.ok(time.includes('useParams') && time.includes('params?.id'), 'timeperiod must get retailerId from useParams');
    // Must NOT use localStorage STORAGE_KEY retailer selector
    assert.ok(!master.includes('STORAGE_KEY'), 'masterdata must not use localStorage STORAGE_KEY retailer selector');
    assert.ok(!master.includes('Select retailer') || master.includes('scopedRetailerId') || !master.includes('<select'), 'masterdata must not show retailer dropdown');
    assert.ok(!master.includes('Select retailer:') || master.includes('retailerId'), 'masterdata should not have Select retailer dropdown for retailer choice');
    // Must fetch with retailerId
    assert.ok(master.includes('/listprojects/${retailerId'), 'masterdata must fetch /listprojects/${retailerId}');
    assert.ok(!master.includes('manageReportsSelectedRetailer'), 'masterdata must not use manageReportsSelectedRetailer storage');
    // No double slash
    assert.ok(!master.includes('//masterdata'), 'must not have double slash //masterdata');
    assert.ok(!time.includes('//timeperiod'), 'must not have double slash //timeperiod');
    assert.ok(master.includes('CreateProjectModal') && master.includes('retailerId={retailerId}'), 'masterdata must pass retailerId to CreateProjectModal');
  });

  it('CreateProjectModal supports retailerId prop and skips retailer selection when scoped', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');
    assert.ok(modal.includes('scopedRetailerId'), 'CreateProjectModal must accept retailerId prop (scopedRetailerId)');
    assert.ok(modal.includes('isScoped'), 'CreateProjectModal must handle isScoped mode');
    assert.ok(modal.includes('useEffect'), 'CreateProjectModal must sync scoped retailer via useEffect');
  });

  it('legacy global routes redirect to /manageReports', () => {
    const masterLegacy = fs.readFileSync(path.join(root, 'app/managePlanograms/masterdata/page.js'), 'utf8');
    const timeLegacy = fs.readFileSync(path.join(root, 'app/managePlanograms/timeperiod/page.js'), 'utf8');
    assert.ok(masterLegacy.includes('/manageReports'), 'legacy masterdata must redirect to /manageReports');
    assert.ok(timeLegacy.includes('/manageReports'), 'legacy timeperiod must redirect to /manageReports');
    // legacy client redirect is sufficient; proxy matcher change reverted to avoid internal server error
  });

  it('proxy and DataTable never hardcode retailerId', () => {
    const files = [
      'app/components/layout/Sidebar.jsx',
      'app/components/table/DataTable.jsx',
      'app/retailerPlanogram/[retailerId]/masterdata/page.js',
      'app/components/modal/CreateProjectModal.jsx',
    ];
    // fallback to [id] if [retailerId] not exists for backward compat
    for (const rel of files) {
      let p = path.join(root, rel);
      if (!fs.existsSync(p)) {
        p = p.replace('[retailerId]', '[id]');
      }
      const c = fs.readFileSync(p, 'utf8');
      assert.ok(!c.includes('4e221Q27Pk'), `${rel} must not hardcode 4e221Q27Pk`);
    }
  });

  it('project routes are retailer+project scoped via /retailerPlanogram/:retailerId/projectplanogram/:projectId', () => {
    const base = path.join(root, 'app/retailerPlanogram/[retailerId]/projectplanogram/[projectId]');
    // also support [id] parent for backward compat
    const altBase = path.join(root, 'app/retailerPlanogram/[id]/projectplanogram/[projectId]');
    const actualBase = fs.existsSync(base) ? base : altBase;
    assert.ok(fs.existsSync(actualBase), 'projectplanogram nested route must exist under retailer');
    const children = fs.readdirSync(actualBase);
    const expected = ['uploads','projectproducts','projectstores','planogram','validation','download','dashboard','submitreport'];
    for(const exp of expected){
      assert.ok(children.includes(exp) || fs.existsSync(path.join(actualBase, exp)), `project child route ${exp} must exist`);
    }
    // Check that uploads page uses both retailerId and projectId from useParams
    const uploads = fs.readFileSync(path.join(actualBase, 'uploads/page.js'), 'utf8');
    assert.ok(uploads.includes('useParams') && uploads.includes('retailerId') && uploads.includes('projectId'), 'uploads must get retailerId and projectId from useParams');
    assert.ok(uploads.includes('const { retailerId, projectId } = useParams()') || uploads.includes('retailerId') && uploads.includes('projectId'), 'uploads should destructure retailerId/projectId');
    assert.ok(!uploads.includes('4e221Q27Pk'), 'uploads must not hardcode retailerId');
    // Check ProjectsTable link uses new scoped URL
    const pt = fs.readFileSync(path.join(root, 'app/components/table/ProjectsTable.jsx'), 'utf8');
    assert.ok(pt.includes('/retailerPlanogram/${selectedRetailer}/projectplanogram/${item?.projectid}/uploads'), 'ProjectsTable must link to retailer+project scoped uploads');
    assert.ok(!pt.includes('href={`/projectplanogram/${item?.projectid}/uploads`'), 'ProjectsTable must not use old global projectplanogram link');
    // Check Sidebar project links preserve both ids
    const sidebar = fs.readFileSync(path.join(root, 'app/components/layout/Sidebar.jsx'), 'utf8');
    assert.ok(sidebar.includes('/projectplanogram/') && sidebar.includes('retailerId') && sidebar.includes('projectId'), 'Sidebar project section must preserve retailerId and projectId');
    assert.ok(sidebar.includes('`/retailerPlanogram/${retailerId}/projectplanogram/${projectId}/uploads`'), 'Sidebar Uploads must be retailer+project scoped');
    // Check CreateProjectModal redirect is scoped
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');
    assert.ok(modal.includes('/retailerPlanogram/${rid}/projectplanogram/${data?.projectid}/uploads') || modal.includes('/retailerPlanogram/${rid}/projectplanogram'), 'CreateProjectModal must redirect to retailer+project scoped uploads');
  });
});
