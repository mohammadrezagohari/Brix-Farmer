'use client';
import {ReactNode,useEffect,useRef} from 'react';
import {Check,Inbox,X} from 'lucide-react';
export function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={'surface '+className}>{children}</section>;}
export function Badge({value,label}:{value:string;label?:string}){return <span className={'badge badge-'+value}>{label||value}</span>;}
export function Empty({title,description,children}:{title:string;description:string;children?:ReactNode}){return <div className="empty-state"><Inbox size={36}/><h3>{title}</h3><p>{description}</p>{children}</div>;}
export function Skeleton(){return <div className="skeleton-grid" role="status" aria-label="Loading"><div/><div/><div/><div/></div>;}
export function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return ()=>dialog?.close();},[]);
 return <dialog ref={ref} className="detail-dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Close" onClick={onClose}><X size={20}/></button></div>{children}</dialog>;
}
export function Toast({text}:{text:string}){return <div className="toast" role="status"><Check size={18}/>{text}</div>;}
export function Table({head,rows}:{head:string[];rows:ReactNode[][]}){return <div className="table-scroll" tabIndex={0}><table><thead><tr>{head.map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((cells,i)=><tr key={i}>{cells.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;}
