import type {Scholarship} from '@/types';
export function isEducationMismatch(s:Scholarship){return s.eligibility==='not_eligible'&&(s.eligibilityBlocker==='education'||(!s.eligibilityBlocker&&s.missing.some(m=>/bachelor|degree|education|high school/i.test(m))));}
export function futureMessage(s:Scholarship){return s.futureEligibility||(/graduate|master|phd/i.test(s.level)?"You could apply after finishing your bachelor's degree. Confirm the requirements for a future call.":'You could apply after completing the required education level. Confirm the requirements for a future call.');}
export function groupScholarships(items:Scholarship[],filter='all'){
 const visible=items.filter(s=>s.trust!=='red'&&(filter==='all'||s.trust===filter));
 const groups=[{title:'You can apply',items:visible.filter(s=>s.eligibility==='eligible')},{title:'Almost there',items:visible.filter(s=>s.eligibility==='almost')},{title:'For your future',items:visible.filter(isEducationMismatch)},{title:'Not a match right now',items:visible.filter(s=>s.eligibility==='not_eligible'&&!isEducationMismatch(s))},{title:'Warning signs found',items:items.filter(s=>s.trust==='red')}];
 const timestamp=(s:Scholarship)=>{const n=Date.parse(s.deadline??'');return Number.isNaN(n)?Infinity:n;};
 return groups.map(g=>({...g,items:g.items.sort((a,b)=>timestamp(a)-timestamp(b))}));
}
