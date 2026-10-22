import type {Locale} from '../copy';
import {z} from 'zod';import type {Scholarship} from '@/types';import {generateJSON} from '../llm';import {useMocks} from '../config';
export async function scoreTrust(s:Scholarship,locale:Locale='en'):Promise<Scholarship>{
 const host=new URL(s.url).hostname;const text=[s.name,s.provider,s.fees,...s.requirements].join(' ');const red=/guaranteed|upfront|processing payment/i.test(text);const agency=/agency|consultation|recruitment|fair|event/i.test(text);const known=['studyinjapan.go.jp','turkiyeburslari.gov.tr','erasmus-plus.ec.europa.eu','daad.de'].some(h=>host===h||host.endsWith('.'+h));const institutional=/(^|\.)(gov|edu)(\.|$)|\.ac\.[a-z]{2}$/.test(host)||known;
 const reasons:string[]=[];if(institutional)reasons.push('Institutional domain signal. Confirm the current call on the linked source.');else reasons.push('Provider ownership has not been independently established.');if(red)reasons.push('Upfront payment or guaranteed acceptance is a serious warning sign.');if(agency)reasons.push('This appears to be an agency or event, rather than a scholarship award.');
 let trust:Scholarship['trust']=red?'red':agency||!institutional?'yellow':'green';
 if(!useMocks()){const judgement=await generateJSON('Assess fraud signals using only evidence supplied. Domain is a signal, not proof. Do not upgrade confidence solely from provider names. Explain uncertainties.',s,z.object({trust:z.enum(['green','yellow','red']),reasons:z.array(z.string()).min(1).max(5)}),'fast',locale);reasons.push(...judgement.reasons);if(judgement.trust==='red')trust='red';else if(judgement.trust==='yellow'&&trust==='green')trust='yellow';}
 return {...s,officialSource:s.officialSource&&institutional,trust,trustReasons:reasons};
}
