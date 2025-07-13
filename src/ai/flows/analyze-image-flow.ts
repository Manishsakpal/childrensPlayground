'use server';
/**
 * @fileOverview An image analysis AI agent.
 *
 * - analyzeImage - A function that handles the image analysis process.
 * - AnalyzeImageInput - The input type for the analyzeImage function.
 * - AnalyzeImageOutput - The return type for the analyzeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageInputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the image to analyze.'),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema = z.object({
  description: z
    .string()
    .describe('A description of the image content.'),
  hasSky: z.boolean().describe('Whether the image contains sky.'),
  hasTrees: z.boolean().describe('Whether the image contains trees.'),
  hasGreenLand: z.boolean().describe('Whether the image contains green land.'),
  hasWater: z.boolean().describe('Whether the image contains water.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return analyzeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: {schema: AnalyzeImageInputSchema},
  output: {schema: AnalyzeImageOutputSchema},
  prompt: `You are an expert image analyst. Analyze the following image and identify its key components. 
  
  Specifically, determine if the image contains sky, trees, green land, or water. 
  
  Provide a general description and set the boolean flags accordingly.

Image: {{media url=imageUrl}}`,
});

const analyzeImageFlow = ai.defineFlow(
  {
    name: 'analyzeImageFlow',
    inputSchema: AnalyzeImageInputSchema,
    outputSchema: AnalyzeImageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
