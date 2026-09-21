import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

describe('Navbar - project routes show Project Name via GET /getproject/:id', () => {
  it('detects project routes via includes("/projectplanogram") not startsWith, dynamic for any projectId', () => {
    const navbar = fs.readFileSync(path.join(root, 'app/components/layout/Navbar.jsx'), 'utf8');
    const hook = fs.readFileSync(path.join(root, 'app/hooks/useProject.js'), 'utf8');
    // Must use includes for project route detection (covers /retailerPlanogram/.../projectplanogram/...)
    assert.ok(navbar.includes('pathname?.includes("/projectplanogram")'), 'Navbar must detect project routes via pathname.includes("/projectplanogram") for all project routes (Uploads, Dashboard, etc.)');
    // Should have isProjectRoute or equivalent and derive isProjectPlanogram from it
    assert.ok(navbar.includes('isProjectRoute') || navbar.includes('isProjectPlanogram'), 'must have project route flag');
    // isRetailerPlanogram must be retailer only (not when project route)
    assert.ok(navbar.includes('!pathname?.includes("/projectplanogram")'), 'isRetailerPlanogram must exclude project routes (not show Parker\'s Kitchen / Retailer Planogram on project pages)');
    // Must not hardcode example project id ZZbf0tD78v
    assert.ok(!navbar.includes('ZZbf0tD78v'), 'Navbar must not hardcode ZZbf0tD78v, must be dynamic');
    assert.ok(!hook.includes('ZZbf0tD78v'), 'useProject must not hardcode ZZbf0tD78v');
    // Hook must fetch via GET /getproject/${id} dynamically
    assert.ok(hook.includes('lambdaGet(`/getproject/${id}`)') || hook.includes("lambdaGet(`/getproject/${id}`)") || hook.includes('/getproject/${id}'), 'useProject must fetch GET /getproject/${id} dynamically');
    // Navbar must use useProject to get currentProject
    assert.ok(navbar.includes('useProject()'), 'Navbar must use useProject hook');
    assert.ok(navbar.includes('currentProject'), 'Navbar must use currentProject from useProject');
  });

  it('uses projectName (projName/projectName) as navbar title, not retailerName on project routes', () => {
    const navbar = fs.readFileSync(path.join(root, 'app/components/layout/Navbar.jsx'), 'utf8');
    // Must derive projectName from multiple possible keys (projName, projectName, name, nested project)
    assert.ok(navbar.includes('projectName') || navbar.includes('projName'), 'Navbar must derive projectName');
    assert.ok(navbar.includes('currentProject?.projName') || navbar.includes('currentProject?.projectName'), 'must read projName/projectName from currentProject');
    // Must handle nested project?.project wrapper
    assert.ok(navbar.includes('currentProject?.project?.projName') || navbar.includes('project?.projName'), 'should handle nested project wrapper');
    // Navbar title span should render projectName (not retailerName) when isProjectPlanogram/isProjectRoute
    // Check that project block renders projectName, not retailerName as primary title
    const projectBlockIdx = navbar.indexOf('isProjectPlanogram');
    assert.ok(projectBlockIdx !== -1, 'must have isProjectPlanogram block');
    const projectBlock = navbar.slice(projectBlockIdx, projectBlockIdx + 1500);
    assert.ok(projectBlock.includes('projectName') || projectBlock.includes('projName'), 'project block must render projectName/projName');
    // Retailer block should be retailer only (no project)
    const retailerBlockIdx = navbar.indexOf('isRetailerPlanogram');
    assert.ok(retailerBlockIdx !== -1, 'must have isRetailerPlanogram block');
    const retailerBlock = navbar.slice(retailerBlockIdx, retailerBlockIdx + 800);
    assert.ok(retailerBlock.includes('retailerName'), 'retailer block should show retailerName only for non-project retailer routes');
    assert.ok(retailerBlock.includes('Retailer Planogram'), 'retailer block should show Retailer Planogram subtitle only for non-project routes');
    // Must not show retailerName as primary on project routes
    // Ensure project block does not show retailerName as title (it shows as small button, not title)
    assert.ok(projectBlock.includes('currentProject?.projName') || projectBlock.includes('projectName'), 'project route title must be projName/projectName');
  });

  it('keeps rest of navbar unchanged (Exit Project, theme, user menu, etc.)', () => {
    const navbar = fs.readFileSync(path.join(root, 'app/components/layout/Navbar.jsx'), 'utf8');
    assert.ok(navbar.includes('Exit Project'), 'must keep Exit Project link');
    assert.ok(navbar.includes('toggleTheme'), 'must keep theme toggle');
    assert.ok(navbar.includes('showUserMenu'), 'must keep user menu');
    assert.ok(navbar.includes('onToggleSidebar'), 'must keep sidebar toggle');
    assert.ok(navbar.includes('useAppTheme'), 'must keep theme integration');
  });

  it('works dynamically for any projectId/route (no hardcoded id, handles retailer + global)', () => {
    const hook = fs.readFileSync(path.join(root, 'app/hooks/useProject.js'), 'utf8');
    // Hook must derive id dynamically from params
    assert.ok(hook.includes('params?.projectId') && hook.includes('params?.id'), 'hook must derive id from params.projectId or params.id dynamically');
    assert.ok(hook.includes('useParams()'), 'hook must use useParams');
    // Must use pathname includes to detect project planogram (covers all project routes)
    assert.ok(hook.includes('pathname?.includes("/projectplanogram")'), 'hook must detect project planogram via includes');
    // Navbar must also be dynamic (no hardcoded retailerId or projectId)
    const navbar = fs.readFileSync(path.join(root, 'app/components/layout/Navbar.jsx'), 'utf8');
    assert.ok(!navbar.includes('4e221Q27Pk'), 'Navbar must not hardcode example retailerId');
    assert.ok(!navbar.includes('X5eMQIsbwZ'), 'Navbar must not hardcode example projectId');
    // retailerId for retailer fetch must be dynamic from parts[2] or params
    assert.ok(navbar.includes('parts[2]') || navbar.includes('retailerId'), 'retailerId must be derived dynamically');
  });
});
