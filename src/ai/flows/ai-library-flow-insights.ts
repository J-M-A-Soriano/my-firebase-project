'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI-powered Library Flow Insights Tool.
 *
 * - aiLibraryFlowInsights - A function that analyzes historical check-in and check-out data to provide insights into library usage patterns.
 * - AiLibraryFlowInsightsInput - The input type for the aiLibraryFlowInsights function.
 * - AiLibraryFlowInsightsOutput - The return type for the aiLibraryFlowInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiLibraryFlowInsightsInputSchema = z.object({
  historicalData: z.array(
    z.object({
      studentId: z.string().describe('The unique identifier of the student.'),
      timestamp: z.string().describe('The ISO 8601 timestamp of the event (e.g., "2023-10-27T10:30:00Z").'),
      eventType: z.enum(['check-in', 'check-out']).describe('The type of event: either "check-in" or "check-out".'),
    })
  ).describe('An array of historical student check-in and check-out events.'),
});

export type AiLibraryFlowInsightsInput = z.infer<typeof AiLibraryFlowInsightsInputSchema>;

const AiLibraryFlowInsightsOutputSchema = z.object({
  peakUsageTimes: z.string().describe('A summary of times when the library experiences the highest student traffic, including specific hours, days of the week, or periods.'),
  commonFlowPatterns: z.string().describe('An analysis of typical student behavior patterns, such as average duration of stay, common arrival/departure times relative to class schedules, or group entry/exit trends.'),
});

export type AiLibraryFlowInsightsOutput = z.infer<typeof AiLibraryFlowInsightsOutputSchema>;

export async function aiLibraryFlowInsights(input: AiLibraryFlowInsightsInput): Promise<AiLibraryFlowInsightsOutput> {
  return aiLibraryFlowInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiLibraryFlowInsightsPrompt',
  input: {schema: AiLibraryFlowInsightsInputSchema},
  output: {schema: AiLibraryFlowInsightsOutputSchema},
  prompt: `You are an expert library data analyst. Your task is to analyze the provided historical student check-in and check-out data for the library.

Based on the following data, identify and summarize the key insights regarding peak usage times and common student flow patterns.

Historical Data:
{{{JSON.stringify historicalData}}}

Provide your analysis in the following structured JSON format:
`,
});

const aiLibraryFlowInsightsFlow = ai.defineFlow(
  {
    name: 'aiLibraryFlowInsightsFlow',
    inputSchema: AiLibraryFlowInsightsInputSchema,
    outputSchema: AiLibraryFlowInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
