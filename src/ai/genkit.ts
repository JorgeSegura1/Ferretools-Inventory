
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Intenta leer la clave API de Gemini desde las variables de entorno.
// El plugin googleAI() también buscará GEMINI_API_KEY o GOOGLE_API_KEY por defecto.
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey && process.env.NODE_ENV === 'development') {
  console.warn(
    "\n**************************************************************************************\n" +
    "ADVERTENCIA: La variable de entorno GEMINI_API_KEY no está configurada.\n" +
    "La generación de imágenes con IA probablemente fallará.\n" +
    "Por favor, configura GEMINI_API_KEY en tu archivo .env.local y reinicia el servidor.\n" +
    "Necesitarás una clave API de Google Cloud con la API de Vertex AI (o Generative Language API) habilitada.\n" +
    "Más detalles: https://firebase.google.com/docs/genkit/plugins/google-genai\n" +
    "**************************************************************************************\n"
  );
}

export const ai = genkit({
  plugins: [
    // Pasa la apiKey explícitamente. Si es undefined, el plugin intentará otros métodos
    // o fallará si es requerida y no se encuentra de otra forma.
    googleAI({ apiKey: geminiApiKey }),
  ],
  // El modelo por defecto se usará si no se especifica uno en la llamada a ai.generate()
  // Para la generación de imágenes, el modelo se especifica directamente en el flujo.
  model: 'googleai/gemini-2.0-flash', 
});

