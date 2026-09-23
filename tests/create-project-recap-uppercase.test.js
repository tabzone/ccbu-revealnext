import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

describe('CreateProjectModal - RECAP uppercase hardcoded Parkers Kitchen', () => {
  it('project name is uppercase RECAP_{RETAILER}_{TIME_PERIOD}_{MMDDYY} with hardcoded Parkers Kitchen', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');

    // Must use RECAP_ uppercase, not Recap_
    assert.ok(modal.includes('`RECAP_${'), 'projectName must start with RECAP_ uppercase');
    assert.ok(!modal.includes('`Recap_${'), 'must not use Recap_ mixed case');

    // Hardcoded retailer name in title case
    assert.ok(modal.includes("Parker's Kitchen"), 'must hardcode retailer name as Parker\'s Kitchen in title case');

    // Retailer slug derived with spaces replaced and uppercased
    assert.ok(modal.includes("HARDCODED_RETAILER_NAME"), 'must define HARDCODED_RETAILER_NAME');
    assert.ok(modal.includes("HARDCODED_RETAILER_SLUG"), 'must define HARDCODED_RETAILER_SLUG');
    // slug must be uppercased
    assert.ok(modal.includes('.toUpperCase()'), 'retailer slug must be uppercased');
    // spaces replaced with _
    assert.ok(modal.includes('.replace(/ /g, "_")'), 'must replace spaces with underscore');

    // Project name uses hardcoded slug, not selectedRetailer?.name
    const projIdx = modal.indexOf('const projectName');
    assert.ok(projIdx !== -1, 'projectName definition must exist');
    const projBlock = modal.slice(projIdx, projIdx + 600);
    assert.ok(projBlock.includes('HARDCODED_RETAILER_SLUG'), 'projectName must use HARDCODED_RETAILER_SLUG');
    assert.ok(!projBlock.includes('selectedRetailer?.name'), 'projectName must not use selectedRetailer?.name after hardcoding');

    // Verify format RECAP_{RETAILER}_{TIME_PERIOD}_{date} pattern
    assert.ok(projBlock.includes('RECAP_${HARDCODED_RETAILER_SLUG}'), 'must follow RECAP_{RETAILER} pattern');
    assert.ok(projBlock.includes('formData.timePeriod'), 'must include timePeriod in projectName');
    assert.ok(projBlock.includes('todays'), 'must include MMDDYY date (todays) in projectName');

    // Retailer in Review must use hardcoded title case
    assert.ok(modal.includes('["Retailer", HARDCODED_RETAILER_NAME]'), 'Review must show hardcoded retailer title case');

    // Example validation: RECAP_PARKER\'S_KITCHEN_Fall_2026_092326 style
    // Ensure slugs uppercases Parker correctly
    const hardcodedSlug = "Parker's Kitchen".replace(/\//g, "_").replace(/ /g, "_").toUpperCase();
    assert.equal(hardcodedSlug, "PARKER'S_KITCHEN", 'hardcoded slug must be PARKER\'S_KITCHEN uppercased');
    const example = `RECAP_${hardcodedSlug}_Fall_2026_092326`;
    assert.ok(example.startsWith('RECAP_PARKER'), 'example must be RECAP_PARKER...');
  });

  it('Review retailer displays title case not uppercased slug', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateProjectModal.jsx'), 'utf8');
    // HARDCODED_RETAILER_NAME should be title case
    assert.ok(modal.includes('const HARDCODED_RETAILER_NAME = "Parker\'s Kitchen"'), 'title case constant must be exactly Parker\'s Kitchen');
    // Verify Review does not display uppercased version
    const reviewIdx = modal.indexOf('["Retailer"');
    assert.ok(reviewIdx !== -1, 'Review retailer row must exist');
    const reviewSlice = modal.slice(reviewIdx, reviewIdx + 200);
    assert.ok(!reviewSlice.includes('PARKER'), 'Review retailer must be title case not uppercased slug');
    assert.ok(reviewSlice.includes('HARDCODED_RETAILER_NAME'), 'Review must reference HARDCODED_RETAILER_NAME');
  });
});
