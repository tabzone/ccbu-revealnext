import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

describe('CreateWeekModal - Data Week numeric-only validation', () => {
  it('Data Week input only allows numbers (input filtering + validation)', () => {
    const modal = fs.readFileSync(path.join(root, 'app/components/modal/CreateWeekModal.jsx'), 'utf8');

    // Input must be numeric-only: inputMode numeric and pattern
    assert.ok(modal.includes('inputMode="numeric"') || modal.includes("inputMode='numeric'"), 'Data Week input must have inputMode="numeric"');
    assert.ok(modal.includes('pattern="[0-9]*"') || modal.includes("pattern='[0-9]*'"), 'Data Week input must have pattern="[0-9]*"');

    // onChange must filter non-digits
    assert.ok(modal.includes('replace(/\\D/g'), 'Data Week onChange must filter non-digits via replace(/\\D/g, "")');
    // Must handle dataweek key specifically
    assert.ok(modal.includes('key === "dataweek"') || modal.includes("key === 'dataweek'") || modal.includes('dataweek'), 'must handle dataweek key for filtering');

    // handleSubmit must validate numeric
    assert.ok(modal.includes('/^\\d+$/') || modal.includes('/^\\d+$/.test'), 'handleSubmit must validate dataWeek with /^\\d+$/ regex');
    assert.ok(modal.includes('Data Week must be a number'), 'must show error "Data Week must be a number" on non-numeric');

    // Ensure the Data Week input still onChange via set("dataweek")
    assert.ok(modal.includes('set("dataweek")'), 'Data Week input must use set("dataweek") handler');

    // Ensure the filtering is in the set function near form state
    const setIdx = modal.indexOf('const set =');
    assert.ok(setIdx !== -1, 'set function must exist');
    const setBlock = modal.slice(setIdx, setIdx + 300);
    assert.ok(setBlock.includes('replace(/\\D/g'), 'set function block must contain digit filtering');

    // Ensure validation is before saving/apiPost
    const handleIdx = modal.indexOf('const handleSubmit');
    assert.ok(handleIdx !== -1, 'handleSubmit must exist');
    const handleBlock = modal.slice(handleIdx, handleIdx + 800);
    assert.ok(handleBlock.includes('/^\\d+$/'), 'handleSubmit must contain numeric regex');
    assert.ok(handleBlock.indexOf('/^\\d+$/') < handleBlock.indexOf('setSaving(true)'), 'numeric validation must occur before setSaving/apiPost');
  });

  it('Data Week numeric filtering correctly strips non-digits', () => {
    // Simulate the actual filter logic
    const filter = (v) => v.replace(/\D/g, "");
    assert.equal(filter("20"), "20");
    assert.equal(filter("20a"), "20");
    assert.equal(filter("a2b0"), "20");
    assert.equal(filter("12.5"), "125");
    assert.equal(filter("-12"), "12");
    assert.equal(filter(""), "");
    assert.equal(filter("abc"), "");

    // Validation regex
    const isNumeric = (v) => /^\d+$/.test(v.trim());
    assert.equal(isNumeric("20"), true);
    assert.equal(isNumeric("0"), true);
    assert.equal(isNumeric(" 20 "), true);
    assert.equal(isNumeric(""), false);
    assert.equal(isNumeric("20a"), false);
    assert.equal(isNumeric("a"), false);
    assert.equal(isNumeric("12.5"), false);
  });
});
