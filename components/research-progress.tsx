'use client';
import {useEffect,useRef} from 'react';import {Check,LoaderCircle} from 'lucide-react';
export default function ResearchProgress({step,activity}:{step:number;activity:{kind:'query'|'domain';value:string}[]}){
 const end=useRef<HTMLDivElement>(null);useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[activity.length]);
 const stages=['Plan searches','Find sources','Read pages','Extract details','Assess trust','Check fit'];
 return <section className="research-screen" aria-labelledby="research-title"><h1 id="research-title">Finding your way forward.</h1><p className="lead" role="status">{stages[step]}…</p><div className="research-tools"><span>Nemotron via Nebius Token Factory</span><span>Tavily search</span></div><ol className="research-steps">{stages.map((title,i)=><li key={title} className={i<step?'done':i===step?'active':''}>{i<step?<Check size={22}/>:i===step?<LoaderCircle size={22} className="spin"/>:<span className="stage-number">{i+1}</span>}<span>{title}</span></li>)}</ol><div className="research-journal"><h2>Research activity</h2><ul className="activity-log" aria-label="Research activity" role="log" aria-live="polite">{activity.map((item,i)=><li key={i}><strong>{item.kind==='query'?'Searching':'Reading'}</strong><span>{item.value}</span></li>)}</ul><div ref={end}/></div></section>;
}
