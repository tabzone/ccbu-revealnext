import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

describe('CreateProjectModal - getTimePeriod on Create Project click (scoped masterdata)', () => {
  it('openModal calls getTimePeriodList immediately when scoped (retailerPlanogram/[retailerId]/masterdata)', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');
    assert.ok(modal.includes('getTimePeriodList'), 'CreateProjectModal must define getTimePeriodList');
    assert.ok(modal.includes("lambdaGet(`/gettimeperiod`)") || modal.includes('lambdaGet("/gettimeperiod")') || modal.includes("`/gettimeperiod`"), 'getTimePeriodList must call lambdaGet("/gettimeperiod")');
    const openModalIdx = modal.indexOf('const openModal');
    assert.ok(openModalIdx !== -1, 'openModal must exist');
    const openModalSlice = modal.slice(openModalIdx, openModalIdx + 800);
    assert.ok(openModalSlice.includes('isScoped'), 'openModal must branch on isScoped');
    assert.ok(openModalSlice.includes('getTimePeriodList()'), 'openModal must call getTimePeriodList() when scoped so dropdown is populated on Create Project click');
    const isScopedBlock = openModalSlice.slice(openModalSlice.indexOf('if (isScoped)'), openModalSlice.indexOf('} else'));
    assert.ok(isScopedBlock.includes('getTimePeriodList()'), 'isScoped block inside openModal must call getTimePeriodList()');
    assert.ok(modal.includes('onClick={openModal}'), 'Create Project button must call openModal');
    assert.ok(modal.includes('Create Project'), 'button label must be Create Project');
  });

  it('dropdown renders from timePeriodList with loading and empty states', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');
    assert.ok(modal.includes('timePeriodList'), 'must have timePeriodList state');
    assert.ok(modal.includes('timePeriodLoading'), 'must have timePeriodLoading state');
    assert.ok(modal.includes('setTimePeriodList'), 'must update timePeriodList from API');
    assert.ok(modal.includes('period'), 'must handle period array shape from /gettimeperiod');
    assert.ok(modal.includes('value={formData.timePeriod}'), 'dropdown must bind to formData.timePeriod');
    assert.ok(modal.includes('timePeriodList.map'), 'dropdown must map over timePeriodList');
    assert.ok(modal.includes('Loading time periods'), 'must show loading placeholder');
    assert.ok(modal.includes('No time periods available'), 'must show empty placeholder');
    assert.ok(modal.includes('disabled={timePeriodLoading'), 'dropdown must be disabled while loading');
  });

  it('masterdata page passes scoped retailerId to CreateProjectModal', () => {
    const masterPathRetailer = path.join(root, 'app/retailerPlanogram/[retailerId]/masterdata/page.js');
    const masterPathId = path.join(root, 'app/retailerPlanogram/[id]/masterdata/page.js');
    const masterPath = fs.existsSync(masterPathRetailer) ? masterPathRetailer : masterPathId;
    const content = fs.readFileSync(masterPath, 'utf8');
    assert.ok(content.includes('CreateProjectModal'), 'masterdata must render CreateProjectModal');
    assert.ok(content.includes('retailerId={retailerId}'), 'masterdata must pass retailerId={retailerId} so modal is scoped and fetches timePeriod on open');
    assert.ok(content.includes('useParams'), 'masterdata must derive retailerId from useParams for scoped route');
  });
});

describe('CreateProjectModal - project name uses retailer name (dynamic) without state', () => {
  it('project name format is Recap_{retailerName}_{timePeriod}_{date} with actual retailer name, not ID, no state', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');
    // Must include retailer name in projectName, not hardcoded retailer ID literal, and must NOT include state
    assert.ok(modal.includes('selectedRetailer?.name'), 'projectName must use selectedRetailer.name (actual retailer name) not retailer ID');
    assert.ok(!modal.includes('formData.state'), 'projectName must NOT include formData.state after state removal');
    assert.ok(!modal.includes('US_STATES'), 'must not define US_STATES after state removal');
    assert.ok(!modal.includes('String(formData.state'), 'state must not be part of projectName');
    // Check format: Recap_ + retailer + timePeriod + todays (without state)
    assert.ok(modal.includes('`Recap_${'), 'projectName must start with Recap_ (capital R only, not RECAP_)');
    assert.ok(!modal.includes('RECAP_'), 'must not use RECAP_ uppercase - required is Recap_');
    // Ensure no hardcoded retailer ID in projectName formation
    assert.ok(!modal.includes('4e221Q27Pk'), 'CreateProjectModal must not hardcode retailer ID in projectName');
    // Ensure formatted name is not uppercased (required mixed case)
    assert.ok(modal.includes('const formattedProjectName = projectName.replace'), 'must have formattedProjectName');
    assert.ok(!modal.includes('formattedProjectName') || !modal.slice(modal.indexOf('formattedProjectName'), modal.indexOf('formattedProjectName') + 200).includes('toUpperCase'), 'formattedProjectName must NOT call toUpperCase - required is mixed case Recap_Parker');
    // Ensure retailer name resolved dynamically via /getretailers, not hardcoded Parkers literal alone
    assert.ok(modal.includes("lambdaGet(`/getretailers`)") || modal.includes('lambdaGet("/getretailers")'), 'must fetch retailer name dynamically via /getretailers');
    assert.ok(modal.includes('found.name') || modal.includes('found?.name'), 'must resolve retailer name from found.name');
    // Retailer display in Review must be without underscore
    assert.ok(modal.includes("replace(/_/g, \" \")") || modal.includes("replace(/_/g, ' ')"), 'Retailer in Review must display without underscores (replace _ with space)');
    assert.ok(modal.includes("Parker's Kitchen") || modal.includes("Parker"), 'review should be able to show Parkers Kitchen (test allows dynamic)');
    // Verify projectName block does not contain state
    const projIdx = modal.indexOf('const projectName');
    const projBlock = modal.slice(projIdx, projIdx + 500);
    assert.ok(!projBlock.includes('formData.state'), 'projectName block must not reference formData.state');
  });

  it('has no state dropdown and Review has no State row', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');
    assert.ok(!modal.includes('US_STATES'), 'must not define US_STATES after removal');
    assert.ok(!modal.includes('South Carolina'), 'must not include South Carolina after removal');
    assert.ok(!modal.includes('value={formData.state}'), 'state dropdown must be removed');
    assert.ok(!modal.includes('US_STATES.map'), 'must not map over US_STATES');
    // Validation must NOT require state (only timePeriod)
    assert.ok(modal.includes('const step2Valid = !!formData.timePeriod'), 'step2Valid must be !!formData.timePeriod only');
    assert.ok(!modal.includes('!!formData.state'), 'step validation must not require state');
    // Review must NOT show State row
    assert.ok(!modal.includes('"State"') && !modal.includes("'State'"), 'Review must not include State row');
    assert.ok(modal.includes('"Project Name"') && modal.includes('"Retailer"') && modal.includes('"Time Period"'), 'Review must include Project Name, Retailer, Time Period');
  });
});
