import {verifyInputSchema,verifyOffer} from '@/lib/agent/verifyOffer';
export const runtime='nodejs';export const maxDuration=300;
export async function POST(request:Request){let input;try{input=verifyInputSchema.parse(await request.json());}catch{return Response.json({error:'Paste an offer (10–12,000 characters) or a public HTTPS URL.'},{status:400});}try{return Response.json(await verifyOffer(input.offer,input.locale));}catch{return Response.json({error:'Verification could not finish. Try pasting the offer text, or check the server API configuration.'},{status:502});}}
