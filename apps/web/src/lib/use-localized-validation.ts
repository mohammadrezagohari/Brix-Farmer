'use client';
import {useEffect} from 'react';
import type {Locale} from './i18n';
import {errorDictionaries} from './errors';

// Browser validation normally uses the browser's language, not the app's.
export function useLocalizedValidation(locale:Locale) {
 useEffect(()=>{
  const isField=(target:EventTarget|null):target is HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement => target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
  const invalid=(event:Event)=>{if(isField(event.target))event.target.setCustomValidity(errorDictionaries[locale].validation);};
  const clear=(event:Event)=>{if(isField(event.target))event.target.setCustomValidity('');};
  document.addEventListener('invalid',invalid,true);
  document.addEventListener('input',clear,true);
  document.addEventListener('change',clear,true);
  return ()=>{
   document.removeEventListener('invalid',invalid,true);
   document.removeEventListener('input',clear,true);
   document.removeEventListener('change',clear,true);
   document.querySelectorAll('input,select,textarea').forEach(field=>{if(isField(field))field.setCustomValidity('');});
  };
 },[locale]);
}
