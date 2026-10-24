import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const path='docs/openapi.json';
const spec=JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
const routes=JSON.parse(execFileSync('php',['artisan','route:list','--path=api/v1','--json'],{cwd:'apps/api',encoding:'utf8'}));
const str=(extra={})=>({type:'string',...extra});
const choice=(...values)=>str({enum:values});
const schema=(properties,required=Object.keys(properties))=>({type:'object',properties,required});
const quantity=str({pattern:'^\\d{1,12}(\\.\\d{1,3})?$',description:'Positive decimal string; no JSON floating point.'});
const details=schema({variety:str(),description:str({maxLength:3000}),quantity,minimum:quantity,unit:choice('kg','tonne'),grade:str(),country:str({pattern:'^[A-Z]{2}$'}),province:str(),city:str(),warehouse:str(),packaging:str(),harvest_date:str({format:'date'}),ready_days:{type:'integer',minimum:0,maximum:365},price:str({pattern:'^\\d{1,12}(\\.\\d{1,2})?$'}),currency:choice('USD','EUR','CNY','INR','AED','IRR','RUB','BRL','ZAR')},['unit','currency']);
const bodies={
 '/listings':schema({title:str({maxLength:160}),product_category_id:{type:['integer','null']},details},['title','details']),
 '/listings/{listing}':schema({title:str({maxLength:160}),product_category_id:{type:['integer','null']},details},['title','details']),
 '/listings/{listing}/transition':schema({action:choice('submit','pause')}),
 '/admin/organizations/{organization}/review':schema({decision:choice('verified','rejected','corrections','suspend','activate'),reason:str({minLength:5,maxLength:2000}),evidence:str({minLength:5,maxLength:3000})}),
 '/admin/listings/{listing}/review':schema({decision:choice('published','rejected'),reason:str({minLength:5,maxLength:2000})}),
 '/admin/users/{user}/suspension':schema({suspended:{type:'boolean'},reason:str({minLength:5,maxLength:2000})}),
 '/admin/categories':schema({name:str({maxLength:100})}),
 '/organization-profile':schema({legal_name:str(),registration_number:str(),country:str({pattern:'^[A-Z]{2}$'}),address:str(),phone:str(),farm:str()},['legal_name','registration_number','country','address']),
 '/trade-partners':schema({company:str(),country:str({pattern:'^[A-Z]{2}$'}),contact:str(),email:str({format:'email'}),phone:str(),notes:str()},['company','country']),
 '/opportunities':schema({trade_partner_id:{type:'integer'},title:str(),next_action:str(),due_at:str({format:'date'})},['trade_partner_id','title']),
 '/opportunities/{opportunity}/stage':schema({stage:choice('new','contacted','qualified','negotiation','proposal','won','lost')}),
};
const paths={};
for(const route of routes){const p='/'+route.uri.replace(/^api\/v1\//,'');paths[p]||={};
 for(const method of route.method.split('|').filter(m=>m!=='HEAD')){
  const verb=method.toLowerCase(),old=spec.paths[p]?.[verb]||{};
  const publicRoute=['/login','/register','/csrf','/health'].includes(p);
  const needsOrg=!publicRoute&&!p.startsWith('/admin/')&&!['/organizations','/me','/logout','/categories'].includes(p);
  const op={...old,summary:`${method} ${p}`,security:publicRoute?[]:[{session:[]}],parameters:[]};
  for(const match of p.matchAll(/\{([^}]+)\}/g))op.parameters.push({name:match[1],in:'path',required:true,schema:{type:'integer'}});
  if(needsOrg)op.parameters.push({name:'X-Organization-ID',in:'header',required:true,schema:{type:'integer'}});
  if(method!=='GET')op.parameters.push({name:'X-CSRF-TOKEN',in:'header',required:true,schema:str()});
  if(p==='/inventory-lots/{lot}/reservations')op.parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:str({maxLength:100})});
  if(method==='GET'&&!['/me','/csrf','/health'].includes(p))for(const name of ['page','q'])op.parameters.push({name,in:'query',schema:name==='page'?{type:'integer',minimum:1}:str({maxLength:100})});
  if(method!=='GET'&&bodies[p])op.requestBody={required:true,content:{'application/json':{schema:bodies[p]}}};
  const created=method==='POST'&&['/register','/organizations','/inventory-lots','/inventory-lots/{lot}/reservations','/listings','/trade-partners','/opportunities','/admin/categories'].includes(p);
  const noContent=p.endsWith('/review')||p.endsWith('/suspension')||p.endsWith('/stage')||p.endsWith('/release')||p==='/logout';
  op.responses={[created?'201':noContent?'204':'200']:{description:created?'Created resource in data':noContent?'Action recorded':'Data resource or paginated collection'},'401':{description:'Unauthenticated'},'403':{description:'Forbidden'},'404':{description:'Unavailable or unauthorized resource'},'409':{description:'State conflict, stock unavailable, or idempotency input mismatch'},'422':{description:'Validation errors: message and errors'},'429':{description:'Rate limit exceeded'}};
  if(method!=='GET')op.responses['419']={description:'CSRF token mismatch'};
  paths[p][verb]=op;
 }
}
spec.paths=paths;spec.info.version='0.2.0';spec.info.description='Implemented dashboard slice only. Authentication and CSRF required; no order, export compliance, contract or payment API is claimed.';
writeFileSync(path,JSON.stringify(spec,null,2)+'\n');
console.log(`Documented ${Object.keys(paths).length} resource paths from actual Laravel routes.`);
