import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const masterdataPath = path.join(root, 'app/retailerPlanogram/[retailerId]/masterdata/page.js');
const modalPath = path.join(root, 'app/components/modal/CreateProjectModal.jsx');
const globalsPath = path.join(root, 'app/globals.css');

describe('masterdata search - live typing without button', () => {
  it('masterdata page filters on input change without search button', () => {
    const content = fs.readFileSync(masterdataPath, 'utf8');
    // Should have live filtering via onChange -> setSearchTerm and filteredProjects memo
    assert.ok(content.includes('onChange={(e) => setSearchTerm(e.target.value)}'), 'input must update searchTerm onChange for live search');
    assert.ok(content.includes('filteredProjects'), 'must compute filteredProjects from searchTerm');
    assert.ok(content.includes('if (searchTerm.trim())'), 'filter must react to searchTerm trimming');
    // Should NOT have a dedicated search execution button with SearchIcon
    const hasSearchButton = content.includes('<SearchIcon') && content.includes('rounded-r') && content.includes('bg-blue-600');
    assert.equal(hasSearchButton, false, 'should not have a clickable search button (search is live on typing)');
  });

  it('masterdata search input has unified live design and clear affordance', () => {
    const content = fs.readFileSync(masterdataPath, 'utf8');
    // Unified search design: rounded-lg, pl-9, pr-8, py-2.5, border, left search icon SVG, right clear X
    assert.ok(content.includes('rounded-lg border pl-9 pr-8 py-2.5'), 'search input should use canonical rounded-lg pl-9 pr-8 py-2.5 bordered style');
    assert.ok(content.includes('pointer-events-none') && content.includes('circle cx="11"'), 'should have decorative left search icon (non-button)');
    assert.ok(content.includes('setSearchTerm(\'\')'), 'should have clear action to reset search');
    assert.ok(content.includes('absolute right-3 top-1/2'), 'clear button should be positioned inside input');
  });

  it('CreateProjectModal has valid JSX and single primary trigger button (no nested button syntax error)', () => {
    const content = fs.readFileSync(modalPath, 'utf8');
    // Should not have nested <button><button pattern that caused Expression expected
    const nested = content.match(/<button[^>]*>\s*<button/);
    assert.equal(nested, null, 'CreateProjectModal must not contain nested <button><button (syntax error)');
    // Should have exactly one trigger button with onClick={openModal}
    const triggers = (content.match(/onClick=\{openModal\}/g) || []).length;
    assert.equal(triggers, 1, 'should have exactly one Create Project trigger with onClick={openModal}');
    assert.ok(content.includes('Create Project'), 'trigger must label Create Project');
  });

  it('page retains original theme without forced button color unification', () => {
    const css = fs.readFileSync(globalsPath, 'utf8');
    // Colors were reverted per request - should NOT contain unified token overrides
    assert.equal(css.includes('--btn-primary: #2563eb'), false, 'should not contain forced unified --btn-primary after revert');
    const theme = fs.readFileSync(path.join(root, 'app/hooks/useAppTheme.js'), 'utf8');
    assert.ok(theme.includes('accent: isDark ? "#94a3b8" : "#334155"'), 'useAppTheme should retain original accent after revert');
  });
});
