import {test} from 'node:test';
import assert from 'node:assert/strict';
import {landingCopy,landingDictionaries} from '../src/lib/landing-copy.ts';
import {languages} from '../src/lib/i18n.ts';

test('all permitted locales provide complete, independent landing dictionaries',()=>{
 assert.deepEqual(Object.keys(landingDictionaries).sort(),Object.keys(languages).sort());
 const baseline=landingCopy('en');
 for(const locale of Object.keys(languages)) {
  const copy=landingCopy(locale);
  assert.deepEqual(Object.keys(copy).sort(),Object.keys(baseline).sort(),locale);
  for(const [key,value] of Object.entries(copy)) {
   if(Array.isArray(baseline[key])) {
    assert.ok(Array.isArray(value),`${locale}.${key}`);
    assert.equal(value.length,baseline[key].length,`${locale}.${key}`);
    assert.ok(value.every(text=>typeof text==='string'&&text.trim()),`${locale}.${key}`);
   } else assert.ok(typeof value==='string'&&value.trim(),`${locale}.${key}`);
   if(locale!=='en'&&key!=='topBrand')assert.notDeepEqual(value,baseline[key],`${locale}.${key} must not fall back to English`);
  }
  assert.equal(copy.questions.length,copy.answers.length);
 }
});
