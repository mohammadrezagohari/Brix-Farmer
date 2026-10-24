'use client';
import {localizeError} from '../lib/errors';
import {FormEvent,useState} from 'react';
import {Check,ChevronLeft,ChevronRight,Save,Send,Sprout} from 'lucide-react';
import {dashboardCopy,request} from '../lib/dashboard';
import {Dictionary,Locale} from '../lib/i18n';
import {Card} from './ui';
export type Listing = {id:number;title:string;status:string;inventory_lot_id:number|null;product_category_id?:number;details:Record<string,string>};
export default function ProductWizard({org,locale,t,categories,initial,onSaved}:{org:string;locale:Locale;t:Dictionary;categories:{id:number;name:string}[];initial?:Listing;onSaved:(id:number,submitted:boolean)=>void}){
 const c=dashboardCopy(locale);const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null);
 const [id,setId]=useState(initial?.id);
 const [title,setTitle]=useState(initial?.title||'');const [category,setCategory]=useState(String(initial?.product_category_id||''));
 const [values,setValues]=useState<Record<string,string>>({quantity:'',minimum:'',unit:'kg',grade:'',country:'IR',currency:'USD',...initial?.details});
 const steps=[c.productInfo,c.quantityQuality,c.location,c.commercial,c.check];const locked=!!initial?.inventory_lot_id;
 const update=(key:string,value:string)=>setValues(v=>({...v,[key]:value}));
 const field=(key:string,label:string,required=false,type='text')=><label>{label}{required&&<span className="required">*</span>}<input name={key} type={type} required={required} value={values[key]||''} onChange={e=>update(key,e.target.value)} disabled={locked&&['quantity','minimum','country'].includes(key)} dir={['quantity','minimum','country','price','ready_days'].includes(key)?'ltr':undefined}/></label>;
 async function save(submit=false){
  setBusy(true);setError('');
  try{const result=await request(id?`listings/${id}`:'listings',id?'PUT':'POST',{title,product_category_id:category||null,details:values},org);setId(result.data.id);if(submit)await request(`listings/${result.data.id}/transition`,'POST',{action:'submit'},org);onSaved(result.data.id,submit);}
  catch(e){setError(e);}finally{setBusy(false);}
 }
 function next(e:FormEvent){e.preventDefault();setStep(s=>Math.min(4,s+1));}
 return <Card className="wizard"><ol className="stepper">{steps.map((label,index)=><li key={label} className={index===step?'current':index<step?'complete':''}><button type="button" onClick={()=>setStep(index)} aria-current={index===step?'step':undefined}><span>{index<step?<Check size={15}/>:new Intl.NumberFormat(locale).format(index+1)}</span><b>{label}</b></button></li>)}</ol>
  <div className="wizard-body"><div className="section-heading"><div><span className="eyebrow">{steps[step]}</span><h2>{step===4?c.check:c.newProduct}</h2></div><Sprout className="muted"/></div>
   <p className="helper">{c.draftHint}</p>{!!error&&<div className="alert error" role="alert">{localizeError(error,locale)}</div>}
   <form onSubmit={next}>
    {step===0&&<><label>{t.product}<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><div className="form-grid"><label>{c.category}<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">{c.choose}</option>{categories.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>{field('variety',c.variety)}</div><label>{c.description}<textarea value={values.description||''} onChange={e=>update('description',e.target.value)} rows={4}/></label></>}
    {step===1&&<><div className="form-grid">{field('quantity',c.quantity,true)}<label>{c.unit}<select value={values.unit} disabled={locked} onChange={e=>update('unit',e.target.value)}><option value="kg">{c.kg}</option><option value="tonne">{c.tonne}</option></select></label>{field('minimum',c.minimum,true)}{field('grade',c.grade,true)}{field('harvest_date',c.harvest,false,'date')}</div></>}
    {step===2&&<div className="form-grid">{field('country',c.country,true)}{field('province',c.province)}{field('city',c.city)}{field('warehouse',c.warehouse)}{field('packaging',c.packaging)}{field('ready_days',c.ready,false,'number')}</div>}
    {step===3&&<><div className="form-grid">{field('price',c.price)}<label>{c.currency}<select value={values.currency} onChange={e=>update('currency',e.target.value)}>{['USD','EUR','CNY','INR','AED','IRR','RUB','BRL','ZAR'].map(code=><option key={code}>{code}</option>)}</select></label></div><div className="alert">{c.mediaPending}</div></>}
    {step===4&&<dl className="review-grid"><div><dt>{t.product}</dt><dd>{title||'—'}</dd></div>{[['quantity',c.quantity],['unit',c.unit],['minimum',c.minimum],['grade',c.grade],['country',c.country],['packaging',c.packaging],['price',c.price],['currency',c.currency]].map(([key,label])=><div key={key}><dt>{label}</dt><dd><bdi>{values[key]||'—'}</bdi></dd></div>)}</dl>}
    <div className="wizard-actions"><button className="secondary" type="button" disabled={busy||step===0} onClick={()=>setStep(s=>s-1)}><ChevronRight size={16}/>{c.back}</button><button type="button" className="secondary" disabled={busy||!title} onClick={()=>save()}><Save size={16}/>{c.save} · {c.draft}</button>{step<4?<button disabled={busy}>{c.next}<ChevronLeft size={16}/></button>:<button type="button" disabled={busy||!title} onClick={()=>save(true)}><Send size={16}/>{c.submit}</button>}</div>
   </form>
  </div>
 </Card>;
}
