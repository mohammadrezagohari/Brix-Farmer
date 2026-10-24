import {notFound} from 'next/navigation';
import Workspace from '../../../components/workspace';
export default async function PanelPage({params}:{params:Promise<{panel:string;section?:string[]}>}) {
 const {panel,section=[]}=await params;
 if(!['admin','farmer','trader'].includes(panel))notFound();
 const allowed:Record<string,string[]>={admin:['dashboard','users','organizations','listings','categories','audits','activity','future'],farmer:['dashboard','products','inventory','incoming','profile','activity','future'],trader:['dashboard','marketplace','reservations','inventory','customers','opportunities','profile','activity','future']};
 if(!allowed[panel].includes(section[0]||'dashboard')||section.length>2)notFound();
 if(section.length===2&&(!['products','marketplace'].includes(section[0])||!(section[1]==='new'&&section[0]==='products')&&!/^\d+$/.test(section[1])))notFound();
 return <Workspace panel={panel as 'admin'|'farmer'|'trader'} section={section}/>;
}
