'use client';

import {FormEvent, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {dictionaries, formatQuantity, isLocale, languages, Locale} from '../lib/i18n';

type Org = {id:number; name:string; verification_status:string; role:string};
type Lot = {id:number; product:string; on_hand_kg:string; minimum_order_kg:string; origin_country:string};
type User = {name:string; is_platform_admin:boolean};
type Summary = Record<string,number>;
type Theme = 'light'|'dark'|'system';

export default function Home() {
  const router = useRouter();
  const [locale,setLocale] = useState<Locale>('fa');
  const [theme,setTheme] = useState<Theme>('system');
  const [preferencesReady,setPreferencesReady] = useState(false);
  const [user,setUser] = useState<User|null>(null);
  const [orgs,setOrgs] = useState<Org[]>([]);
  const [org,setOrg] = useState('');
  const [lots,setLots] = useState<Lot[]>([]);
  const [register,setRegister] = useState(false);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [view,setView] = useState<'workspace'|'admin'>('workspace');
  const [summary,setSummary] = useState<Summary|null>(null);
  const [adminOrgs,setAdminOrgs] = useState<Org[]>([]);
  const t = dictionaries[locale];
  const currentOrg = orgs.find(o=>String(o.id)===org);
  useEffect(()=>{
    if(user?.is_platform_admin) router.replace('/admin');
    else if(user&&orgs.length){const active=orgs.find(o=>String(o.id)===org)||orgs[0];router.replace(['trader','buyer'].includes(active.role)?'/trader':'/farmer');}
  },[user,orgs,org,router]);
  const canCreateLot = !!currentOrg && ['owner','manager','trader'].includes(currentOrg.role);
  const canTrade = !!currentOrg && ['owner','manager','buyer','trader'].includes(currentOrg.role);

  useEffect(()=>{
    try {
      const savedLocale = localStorage.getItem('agritrade.locale');
      const savedTheme = localStorage.getItem('agritrade.theme');
      if(isLocale(savedLocale)) setLocale(savedLocale);
      if(savedTheme==='light'||savedTheme==='dark'||savedTheme==='system') setTheme(savedTheme);
    } catch { /* Browser storage can be unavailable. Preferences still work in memory. */ }
    setPreferencesReady(true);
  },[]);
  useEffect(()=>{
    document.documentElement.lang = locale;
    document.documentElement.dir = languages[locale].dir;
    if(preferencesReady) try { localStorage.setItem('agritrade.locale',locale); } catch {}
  },[locale,preferencesReady]);
  useEffect(()=>{
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = ()=> { document.documentElement.dataset.theme = theme==='system' ? (media.matches?'dark':'light') : theme; };
    apply(); media.addEventListener('change',apply);
    if(preferencesReady) try {localStorage.setItem('agritrade.theme',theme);} catch {}
    return ()=>media.removeEventListener('change',apply);
  },[theme,preferencesReady]);

  async function api(path:string,method='GET',body?:unknown,organization=org) {
    const headers:Record<string,string> = {Accept:'application/json','Content-Type':'application/json'};
    if(organization) headers['X-Organization-ID'] = organization;
    if(method!=='GET') {
      const response = await fetch('/api/v1/csrf',{credentials:'include'});
      if(!response.ok) throw Error(t.failure);
      headers['X-CSRF-TOKEN'] = (await response.json()).token;
    }
    const response = await fetch('/api/v1/'+path,{method,headers,credentials:'include',body:body?JSON.stringify(body):undefined});
    if(response.status===204) return null;
    const data = await response.json();
    if(!response.ok) throw Error(Object.values(data.errors||{}).flat().join(' ')||data.message||t.failure);
    return data;
  }
  async function loadOrgs() {
    const result = await api('organizations');
    setOrgs(result.data);
    setOrg(previous=>result.data.some((o:Org)=>String(o.id)===previous)?previous:String(result.data[0]?.id||''));
  }
  useEffect(()=>{
    (async()=>{
      try {
        const response = await fetch('/api/v1/me',{headers:{Accept:'application/json'},credentials:'include'});
        if(response.ok) {setUser((await response.json()).data); await loadOrgs();}
        else if(response.status!==401) setError(t.failure);
      } catch {setError(t.failure);} finally {setLoading(false);}
    })();
  },[]); // Initial session lookup only.
  useEffect(()=>{
    let active = true;
    setLots([]); setSummary(null); setAdminOrgs([]); setError('');
    if(!user) return;
    (async()=>{
      try {
        if(view==='admin'&&user.is_platform_admin) {
          const [dashboard,organizations] = await Promise.all([api('admin/dashboard'),api('admin/organizations')]);
          if(active) {setSummary(dashboard.data); setAdminOrgs(organizations.data);}
        } else if(org) {
          const inventory = await api('inventory-lots');
          if(active) setLots(inventory.data);
          if(canTrade) {const dashboard = await api('trader/dashboard'); if(active)setSummary(dashboard.data);}
        }
      } catch(e) {if(active)setError(e instanceof Error?e.message:t.failure);}
    })();
    return ()=>{active=false;};
  },[org,user,view,canTrade]);

  async function submit(event:FormEvent<HTMLFormElement>,action:(data:Record<string,string>)=>Promise<void>) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>;
    try {await action(data);} catch(e) {setError(e instanceof Error?e.message:t.failure);} finally {setBusy(false);}
  }
  const field = (name:string,label:string,type='text')=><label>{label}<input name={name} type={type} required dir={['email','origin_country','on_hand_kg','minimum_order_kg'].includes(name)?'ltr':undefined} minLength={name==='password'&&register?12:undefined} maxLength={name==='origin_country'?2:undefined} autoComplete={name==='password'?(register?'new-password':'current-password'):name==='email'?'email':undefined}/></label>;
  const number = (value:number)=>new Intl.NumberFormat(locale).format(value);
  const labels:Record<string,string> = {users:t.users,organizations:t.organizations,pending_organizations:t.pending,inventory_lots:t.lots,active_reservations:t.activeReservations};

  return <>
    <header>
      <strong dir="ltr">BRICS <span className="brand-accent">AgriTrade</span></strong>
      <div className="toolbar">
        <label>{t.language}<select value={locale} onChange={e=>setLocale(e.target.value as Locale)}>{Object.entries(languages).map(([code,l])=><option key={code} value={code} lang={code}>{l.name}</option>)}</select></label>
        <label>{t.theme}<select value={theme} onChange={e=>setTheme(e.target.value as Theme)}><option value="light">☀ {t.light}</option><option value="dark">☾ {t.dark}</option><option value="system">◐ {t.system}</option></select></label>
        {user&&<button className="secondary" disabled={busy} onClick={async()=>{
          setBusy(true);
          try {await api('logout','POST');setUser(null);setOrgs([]);setOrg('');setLots([]);setSummary(null);setAdminOrgs([]);setView('workspace');}
          catch(e){setError(e instanceof Error?e.message:t.failure);} finally {setBusy(false);}
        }}>{t.logout}</button>}
      </div>
    </header>
    <main>
      <section className="hero"><div><div className="eyebrow">BRICS AGRITRADE</div><h1>{t.title}</h1><p>{t.sub}</p></div><div className="hero-art"><span aria-hidden="true">❧</span><p>{t.sub}</p></div></section>
      <div className="notice">{t.note}</div>
      {error&&<div role="alert" className="notice error">{error}</div>}
      {loading?<p role="status">{t.loading}</p>:!user?<section className="grid">
        <div className="card"><h2>{register?t.register:t.login}</h2><form onSubmit={e=>submit(e,async data=>{const result=await api(register?'register':'login','POST',{...data,password_confirmation:data.password});setUser(result.data);await loadOrgs();})}>
          {register&&field('name',t.name)}{field('email',t.email,'email')}{field('password',t.password,'password')}
          <button disabled={busy}>{busy?t.loading:register?t.register:t.login}</button><button type="button" className="secondary" onClick={()=>setRegister(!register)}>{register?t.login:t.register}</button>
        </form></div>
        <div className="card"><h2>{t.overview}</h2><p>{t.sub}</p><p>{t.signInHelp}</p></div>
      </section>:<>
        <nav className="toolbar workspace-nav" aria-label={t.overview}>
          <button className={view==='workspace'?'':'secondary'} aria-pressed={view==='workspace'} onClick={()=>setView('workspace')}>{t.trader}</button>
          {user.is_platform_admin&&<button className={view==='admin'?'':'secondary'} aria-pressed={view==='admin'} onClick={()=>setView('admin')}>{t.admin}</button>}
        </nav>
        <div className="toolbar workspace-nav"><h2>{user.name}</h2>{view==='workspace'&&<label>{t.org}<select value={org} onChange={e=>setOrg(e.target.value)}><option value="">—</option>{orgs.map(o=><option key={o.id} value={o.id}>{o.name}{o.role==='trader'?` · ${t.trader}`:''}</option>)}</select></label>}</div>
        {summary&&<section className="stats" aria-label={t.overview}>{Object.entries(summary).map(([key,value])=><div className="card" key={key}><p>{labels[key]}</p><strong>{number(value)}</strong></div>)}</section>}
        {view==='admin'?<section className="card"><h2>{t.organizations}</h2>{adminOrgs.length?<ul>{adminOrgs.map(o=><li key={o.id}>{o.name}{o.verification_status==='pending'?` · ${t.pending}`:''}</li>)}</ul>:<p>{t.empty}</p>}</section>:<>
          <section className="grid"><div className="card"><h2>{t.createOrg}</h2><form onSubmit={e=>submit(e,async data=>{const result=await api('organizations','POST',data);await loadOrgs();setOrg(String(result.data.id));})}>
            {field('name',t.name)}<label>{t.type}<select name="type"><option value="supplier">{t.supplier}</option><option value="trader">{t.trader}</option></select></label><button disabled={busy}>{t.createOrg}</button>
          </form></div>
          {canCreateLot&&<div className="card"><h2>{t.createLot}</h2><form onSubmit={e=>submit(e,async data=>{const context=org;await api('inventory-lots','POST',data,context);const result=await api('inventory-lots','GET',undefined,context);setLots(result.data);const dashboard=await api('trader/dashboard','GET',undefined,context);setSummary(dashboard.data);})}>
            {field('product',t.product)}{field('origin_country',t.country)}<div className="grid">{field('on_hand_kg',t.quantity)}{field('minimum_order_kg',t.minimum)}</div><button disabled={busy}>{t.createLot}</button>
          </form></div>}</section>
          <section className="card inventory"><h2>{t.lots}</h2>{lots.length?<div className="tablewrap"><table><thead><tr><th>{t.product}</th><th>{t.country}</th><th>{t.quantity}</th><th>{t.minimum}</th></tr></thead><tbody>{lots.map(l=><tr key={l.id}><td>{l.product}</td><td><bdi>{l.origin_country}</bdi></td><td><bdi>{formatQuantity(l.on_hand_kg,locale)}</bdi></td><td><bdi>{formatQuantity(l.minimum_order_kg,locale)}</bdi></td></tr>)}</tbody></table></div>:<p>{t.empty}</p>}</section>
        </>}
      </>}
      <footer>BRICS AgriTrade · {t.note}</footer>
    </main>
  </>;
}
