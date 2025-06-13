
'use server';
/**
 * @fileOverview Un flujo de Genkit para generar imágenes de productos.
 *
 * - generateProductImage - Una función que genera una imagen para un producto.
 * - GenerateProductImageInput - El tipo de entrada para la función generateProductImage.
 * - GenerateProductImageOutput - El tipo de retorno para la función generateProductImage.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductImageInputSchema = z.object({
  productName: z.string().describe('El nombre del producto.'),
  productDescription: z.string().describe('La descripción del producto.'),
});
export type GenerateProductImageInput = z.infer<typeof GenerateProductImageInputSchema>;

const GenerateProductImageOutputSchema = z.object({
  imageDataUri: z.string().nullable().describe('La imagen generada como un data URI (Base64), o null si falla.'),
});
export type GenerateProductImageOutput = z.infer<typeof GenerateProductImageOutputSchema>;

export async function generateProductImage(input: GenerateProductImageInput): Promise<GenerateProductImageOutput> {
  return generateProductImageFlow(input);
}

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async (input) => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: `Generate a visually appealing, clear, and high-quality e-commerce style product image for a hardware store item.
The image should be suitable for a product catalog.
Product Name: ${input.productName}
Description: ${input.productDescription}
The image should be a photorealistic representation of the product, well-lit, and on a clean, neutral background, or a subtle contextually relevant one if appropriate (e.g., a tool on a workbench).
Avoid text, logos, or watermarks in the image. Output only the image.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
          ],
        },
      });
      
      if (media && media.url) {
        return { imageDataUri: media.url };
      }
      return { imageDataUri: null };
    } catch (error) {
      console.error('Error generating product image with Genkit:', error);
      return { imageDataUri: null };
    }
  }
);
