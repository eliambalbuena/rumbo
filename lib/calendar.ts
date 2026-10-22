import type {ActionPlan} from '@/types';
const encoder=new TextEncoder();
export function escapeCalendarText(value:string){return value.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function foldLine(line:string){const parts:string[]=[];let part='';for(const char of line){if(encoder.encode(part+char).length>75){parts.push(part);part=' '+char;}else part+=char;}parts.push(part);return parts.join('\r\n');}
function dateOnly(value:string|null):value is string{return !!value&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
function hash(text:string){let value=2166136261;for(const char of text){value^=char.codePointAt(0)!;value=Math.imul(value,16777619);}return (value>>>0).toString(16);}
export function buildCalendar(plan:ActionPlan,source:string,now=new Date()):string{
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Rumbo//Application plan//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 plan.steps.forEach((step,index)=>{if(!dateOnly(step.date))return;const next=new Date(Date.parse(step.date)+86400000).toISOString().slice(0,10);lines.push('BEGIN:VEVENT','UID:'+hash(source+'|'+plan.deadline+'|'+index+'|'+step.title)+'@rumbo.local','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+step.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+next.replaceAll('-',''),'SUMMARY:'+escapeCalendarText(step.title+' — '+plan.scholarshipName),'DESCRIPTION:'+escapeCalendarText(step.detail+'\n'+plan.warning+'\n'+source),'STATUS:'+(step.overdue?'TENTATIVE':'CONFIRMED'),'END:VEVENT');});
 lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
}
