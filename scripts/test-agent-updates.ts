import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { generateJSON, parseModelJSON, resolveModel } from '../lib/llm';
import { buildActionPlan } from '../lib/agent/buildActionPlan';
import { mockScholarships } from '../lib/mocks';
import { planQueries } from '../lib/agent/planQueries';
import { scoreTrust } from '../lib/agent/scoreTrust';
import { parseScholarships } from '../lib/agent/parseScholarships';
import { checkEligibility } from '../lib/agent/checkEligibility';
import type { Profile } from '../types';

async function main() {
 const originalFetch=globalThis.fetch; const originalEnv={...process.env};
 try {
 process.env.USE_MOCKS='false';process.env.NEBIUS_API_KEY='test-placeholder';process.env.NEBIUS_BASE_URL='https://llm.example/v1';
 process.env.NEBIUS_MODEL='default-'+randomUUID();process.env.NEBIUS_MODEL_FAST='fast-'+randomUUID();process.env.NEBIUS_MODEL_SMART='smart-'+randomUUID();
 assert.equal(resolveModel('fast'),process.env.NEBIUS_MODEL_FAST);assert.equal(resolveModel('smart'),process.env.NEBIUS_MODEL_SMART);
 const fast=process.env.NEBIUS_MODEL_FAST;delete process.env.NEBIUS_MODEL_FAST;assert.equal(resolveModel('fast'),process.env.NEBIUS_MODEL);process.env.NEBIUS_MODEL_FAST=fast;
 const schema=z.object({message:z.string()});
 assert.deepEqual(parseModelJSON('<think>{"message":"wrong"}</think>Text ```json\n{"message":"brace } and \\\"quote\\\""}\n``` tail',schema),{message:'brace } and "quote"'});
 assert.throws(()=>parseModelJSON('<think>{"message":"hidden"}</think>{"bad":true}',schema));
 const calls:Record<string,unknown>[]=[];
 const ok=(content:string,model:string)=>new Response(JSON.stringify({id:'test',object:'chat.completion',created:0,model,choices:[{index:0,message:{role:'assistant',content},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}}),{headers:{'Content-Type':'application/json'}});
 globalThis.fetch=async(_url,init)=>{const body=JSON.parse(String(init?.body));calls.push(body);if(body.response_format)return new Response(JSON.stringify({error:{message:'response_format json_object is not supported',type:'invalid_request_error',param:'response_format'}}),{status:400,headers:{'Content-Type':'application/json'}});return ok('<think>private reasoning</think>Here is JSON: ```json\n{"message":"ok"}\n```',body.model);};
 assert.deepEqual(await generateJSON('test-'+randomUUID(),{},schema,'fast'),{message:'ok'});assert.equal(calls.length,2);assert.equal(calls[0].model,fast);assert.ok(calls[0].response_format);assert.equal(calls[1].response_format,undefined);
 const profile:Profile={country:'Argentina',educationLevel:'undergraduate',languages:['English','Spanish'],fieldOfInterest:'Computer science',gpa:3.5,gpaScale:'0-4'};const scholarship={...mockScholarships()[0],name:'Test '+randomUUID(),deadline:'2020-06-01'};
 calls.length=0;
 const generated={assumptions:['Confirm local processing times.'],steps:[{title:'Passport check',detail:'If renewal is needed allow 12 weeks.',daysBeforeDeadline:150},{title:'Legalize and apostille',detail:'Check if required, allow 8 weeks before translations.',daysBeforeDeadline:100},{title:'Certified translations',detail:'Allow 4 weeks after documents.',daysBeforeDeadline:44},{title:'Exam sitting',detail:'Book well ahead; verify results schedule.',daysBeforeDeadline:35},{title:'Exam results available',detail:'Allow 4 weeks after the exam.',daysBeforeDeadline:7},{title:'Submit',detail:'Verify all documents before submission.',daysBeforeDeadline:3}]};
 globalThis.fetch=async(_url,init)=>{const body=JSON.parse(String(init?.body));calls.push(body);return ok(JSON.stringify(generated),body.model);};
 const plan=await buildActionPlan(scholarship,profile);assert.equal(calls[0].model,process.env.NEBIUS_MODEL_SMART);assert.ok(JSON.stringify(calls[0]).includes('undergraduate'));assert.ok(JSON.stringify(calls[0]).includes(new Date().toISOString().slice(0,10)));assert.equal(plan.steps[0].date,'2020-01-03');assert.ok(plan.steps.every(s=>s.overdue));assert.match(plan.warning,/Confirm local processing/);
 const unknown=await buildActionPlan({...scholarship,deadline:null},profile);assert.ok(unknown.steps.every(s=>s.date===null&&!s.overdue));
 let failures=0;globalThis.fetch=async()=>{failures++;return new Response(JSON.stringify({error:{message:'Unauthorized',type:'authentication_error'}}),{status:401,headers:{'Content-Type':'application/json'}});};
 const fallback=await buildActionPlan({...scholarship,name:'Fallback '+randomUUID()},profile);assert.equal(fallback.steps.length,6);assert.match(fallback.warning,/generic fallback/);assert.equal(failures,1);
 // Verify each agent's actual routing with a schema-appropriate fake provider.
 calls.length=0;
 globalThis.fetch=async(_url,init)=>{const body=JSON.parse(String(init?.body));calls.push(body);const task=JSON.parse(body.messages[1].content).task as string;const output=task.startsWith('Plan 4-6')?{queries:['a','b','c','d']}:task.startsWith('Assess fraud')?{trust:'green',reasons:['Evidence reviewed.']}:task.startsWith('Extract actual')?{scholarships:[scholarship]}:{eligibility:'almost',missing:['Confirm certificate.']};return ok(JSON.stringify(output),body.model);};
 await planQueries(profile);await scoreTrust(scholarship);await parseScholarships([{url:scholarship.url,content:'Test source'}]);await checkEligibility(scholarship,profile);
 assert.deepEqual(calls.map(c=>c.model),[fast,fast,process.env.NEBIUS_MODEL_SMART,process.env.NEBIUS_MODEL_SMART]);
 console.log('PASS: JSON extraction, unsupported-format retry, model fallback/routing, AI plan, backward dates, unknown dates, expired steps and API-failure template fallback. No external API calls.');
 } finally {globalThis.fetch=originalFetch;process.env=originalEnv;}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
