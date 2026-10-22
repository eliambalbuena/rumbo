import {profileSchema,scholarshipSchema} from '@/types';import {buildActionPlan} from '@/lib/agent/buildActionPlan';
import {needsOfferVerification} from '@/lib/results';
export const runtime='nodejs';
export async function POST(request:Request){try{const body=await request.json();const profile=profileSchema.parse(body.profile);const scholarship=scholarshipSchema.parse(body.scholarship);if(scholarship.trust==='red'||needsOfferVerification(scholarship))return Response.json({error:'Plans are unavailable for high-risk offers.'},{status:422});return Response.json(await buildActionPlan(scholarship,profile));}catch{return Response.json({error:'Invalid plan request. Please run your search again.'},{status:400});}}
