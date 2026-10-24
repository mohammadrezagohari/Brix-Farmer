import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dictionaries,keys,languages,formatQuantity,isLocale} from '../src/lib/i18n.ts';
test('all ten locales provide every interface string',()=>{
  assert.equal(Object.keys(languages).length,10);
  for(const [locale,dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary),[...keys],locale);
    assert.ok(Object.values(dictionary).every(value=>typeof value==='string'&&value.trim().length>0),locale);
    assert.doesNotThrow(()=>formatQuantity('999999999999.125',locale));
  }
});
test('decimal string formatting preserves precision and fractional zeros',()=>{
  assert.equal(formatQuantity('999999999999.125','en'),'999,999,999,999.125');
  assert.equal(formatQuantity('50000.000','en'),'50,000.000');
  assert.equal(formatQuantity(50000,'en'),'50,000');
  assert.equal(formatQuantity('1000.025','pt'),'1.000,025');
  assert.equal(languages.fa.dir,'rtl');assert.equal(languages.ar.dir,'rtl');
  assert.equal(isLocale('__proto__'),false);assert.equal(isLocale('xx'),false);assert.equal(isLocale('fa'),true);
});
