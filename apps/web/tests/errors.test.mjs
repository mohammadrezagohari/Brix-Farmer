import {test} from 'node:test';
import assert from 'node:assert/strict';
import {errorDictionaries,localizeError,RequestError} from '../src/lib/errors.ts';
import {languages} from '../src/lib/i18n.ts';

test('all selected languages have complete error translations and no raw server leakage',()=>{
 for(const locale of Object.keys(languages)) {
  const dictionary=errorDictionaries[locale];
  assert.deepEqual(Object.keys(dictionary),Object.keys(errorDictionaries.en));
  assert.ok(Object.values(dictionary).every(value=>typeof value==='string'&&value.trim()));
  assert.equal(localizeError(new RequestError(422,{message:'Verified supplier required.'}),locale),dictionary.supplier);
  assert.equal(localizeError(new RequestError(422,{errors:{email:['The email has already been taken.']}}),locale),dictionary.validation);
  for(const [status,key] of [[401,'login'],[419,'login'],[403,'forbidden'],[404,'missing'],[429,'throttle'],[409,'conflict'],[500,'failure']]) {
   assert.equal(localizeError(new RequestError(status,{message:'Internal SQL detail'}),locale),dictionary[key]);
  }
  assert.equal(localizeError(new TypeError('Failed to fetch'),locale),dictionary.failure);
 }
});
test('the same retained error follows a language change without losing status',()=>{
 const error=new RequestError(422,{message:'Verified supplier required.'});
 assert.match(localizeError(error,'fa'),/تأمین‌کننده/);
 assert.notEqual(localizeError(error,'fa'),localizeError(error,'en'));
 assert.equal(error.status,422);
});
