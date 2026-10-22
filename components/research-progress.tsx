'use client';
import {useEffect,useRef} from 'react';import {Check,LoaderCircle} from 'lucide-react';
import {getCopy,stageLabels,type Locale} from '@/lib/copy';
export default function ResearchProgress({step,activity,locale}:{step:number;activity:{kind:'query'|'domain';value:string}[];locale:Locale}){
 const t=(key:string)=>getCopy(locale).ui[key];
 const end=useRef<HTMLDivElement>(null);useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[activity.length]);
 const stages=stageLabels[locale];
 return <section className="research-screen" aria-labelledby="research-title"><h1 id="research-title">{t('researchTitle')}</h1><p className="lead" role="status">{stages[step]}…</p><div className="research-tools"><span>{t('modelLabel')}</span><span>{t('searchLabel')}</span></div><ol className="research-steps">{stages.map((title,i)=><li key={title} className={i<step?'done':i===step?'active':''}>{i<step?<Check size={22}/>:i===step?<LoaderCircle size={22} className="spin"/>:<span className="stage-number">{i+1}</span>}<span>{title}</span></li>)}</ol><div className="research-journal"><h2>{t('activity')}</h2><ul className="activity-log" aria-label={t('activity')} role="log" aria-live="polite">{activity.map((item,i)=><li key={i}><strong>{item.kind==='query'?t('searchingLabel'):t('reading')}</strong><span>{item.value}</span></li>)}</ul><div ref={end}/></div></section>;
}
