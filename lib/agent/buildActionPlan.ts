import { z } from 'zod';
import type { ActionPlan, Profile, Scholarship } from '@/types';
import { useMocks } from '../config';
import { generateJSON } from '../llm';

const preparationSchema = z.object({
  assumptions: z.array(z.string().max(500)).max(10),
  steps: z.array(z.object({
    title: z.string().min(1).max(150),
    detail: z.string().min(1).max(1500),
    daysBeforeDeadline: z.number().int().min(0).max(1095),
  })).min(4).max(16),
});

export function scheduleSteps(steps: z.infer<typeof preparationSchema>['steps'], deadline: string | null, today: string): ActionPlan['steps'] {
  return [...steps].sort((a, b) => b.daysBeforeDeadline - a.daysBeforeDeadline).map(({ title, detail, daysBeforeDeadline }) => {
    const date = deadline ? new Date(Date.parse(deadline) - daysBeforeDeadline * 86400000).toISOString().slice(0, 10) : null;
    return { title, detail, date, overdue: !!date && date < today };
  });
}

export async function buildActionPlan(s: Scholarship, p: Profile): Promise<ActionPlan> {
  if (s.trust === 'red') throw new Error('Plans are unavailable for high-risk offers.');
  const today = new Date().toISOString().slice(0, 10);
  const valid = !!s.deadline && /^\d{4}-\d{2}-\d{2}$/.test(s.deadline) && !Number.isNaN(Date.parse(s.deadline)) && new Date(s.deadline).toISOString().slice(0, 10) === s.deadline;
  const deadline = valid ? s.deadline : null;
  const tasks: [number, string, string][] = [[70, 'Confirm the current call', `Check nationality (${p.country}), degree level, fees and the exact deadline on the provider website.`], [56, 'Gather your academic documents', 'Request transcripts, certified translations and a valid passport.'], [42, 'Arrange language evidence', `Confirm which certificates are accepted for ${p.languages.join(', ')} and book an exam if needed.`], [28, 'Draft your application', `Connect your interest in ${p.fieldOfInterest} to the programme. Request references.`], [14, 'Review requirements', 'Check every required document, recommendation and programme-specific condition.'], [3, 'Submit and save confirmation', 'Submit through the verified provider portal and keep your receipt.']];
  const warnings = ['Suggested preparation dates, not official milestones. Confirm the deadline and timezone with the provider.'];
  if (s.trust !== 'green') warnings.push('Verify this opportunity before applying. Never pay based on a guarantee.');
  if (!deadline) warnings.push('Deadline unknown. Confirm the current call before assigning dates.');
  let steps = tasks.map(([daysBeforeDeadline, title, detail]) => ({ daysBeforeDeadline, title, detail }));
  if (!useMocks()) {
    try {
      const generated = await generateJSON(
        'Build a realistic application preparation plan tailored to the evidenced scholarship requirements and profile (education level, citizenship and languages). Return daysBeforeDeadline offsets, never absolute dates. Work backward from the supplied deadline, including when it is past; do not move dates forward to today. If deadline is unknown, give relative preparation offsets only. Include verification of passport validity and, if needed, passport issuance (allow roughly 8–12 weeks); academic document issuance, legalization and apostille checks (allow roughly 4–8 weeks); certified translations after documents are issued/legalized (allow roughly 2–4 weeks). For language evidence, distinguish speaking a language from holding an accepted certificate: include exam booking/availability (allow roughly 4–8 weeks), preparation where needed, sitting the exam, a separate results-available milestone (allow roughly 2–4 weeks after sitting, depending on exam), and delivery before submission. Give separate dependency-ordered steps and leave buffers. These are conservative planning estimates, not country-specific official processing claims: explicitly tell the student to confirm actual local processing times and whether each procedure is required. Do not require an apostille, exam or passport application as a factual award requirement unless evidenced; use conditional checks otherwise. Include references, review and submission. Explain assumptions and any likely infeasibility given today, missing eligibility criteria or an expired deadline.',
        { scholarship: s, profile: p, today, deadline }, preparationSchema, 'smart',
      );
      steps = generated.steps;
      warnings.push(...generated.assumptions);
    } catch {
      console.warn('[plan] Nemotron plan unavailable; using template fallback.');
      warnings.push('AI planning was unavailable. This is a generic fallback; confirm processing times for passports, legalization, apostilles, translations and language-test results before relying on these dates.');
    }
  }
  return { scholarshipName: s.name, deadline, warning: warnings.join(' '), steps: scheduleSteps(steps, deadline, today) };
}
