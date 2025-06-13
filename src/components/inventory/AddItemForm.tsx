
"use client";

import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { generateProductImage } from '@/ai/flows/generate-product-image-flow';
import type { Product } from '@/types';


const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
  imageUrl: z.string().url("Debe ser una URL válida para la imagen.").or(z.literal('')),
  category: z.string().optional(),
  generateImage: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function AddItemForm() {
  const { addProduct } = useProducts();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false); // Combined loading state

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      imageUrl: '',
      category: '',
      generateImage: true,
    }
  });

  const watchImageUrl = watch("imageUrl");
  const watchGenerateImage = watch("generateImage");

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsProcessing(true);
    let finalImageUrl = data.imageUrl;

    if (data.generateImage && !data.imageUrl) {
      try {
        toast({
          title: "Generando Imagen con IA...",
          description: "Esto puede tomar unos segundos.",
        });
        const generatedImageOutput = await generateProductImage({
          productName: data.name,
          productDescription: data.description,
        });

        if (generatedImageOutput && generatedImageOutput.imageDataUri) {
          finalImageUrl = generatedImageOutput.imageDataUri; // This will be a Base64 string
          toast({
            title: "Imagen Generada por IA",
            description: "La imagen está lista para ser procesada y guardada.",
            variant: "default",
          });
        } else {
          toast({
            title: "Error de IA",
            description: "No se pudo generar la imagen. Se usará una imagen de marcador.",
            variant: "destructive",
          });
          finalImageUrl = 'https://placehold.co/300x200.png';
        }
      } catch (error) {
        console.error("Error generating image:", error);
        toast({
          title: "Error de IA",
          description: "Ocurrió un error al generar la imagen. Se usará una imagen de marcador.",
          variant: "destructive",
        });
        finalImageUrl = 'https://placehold.co/300x200.png';
      }
    } else if (!data.imageUrl) {
      finalImageUrl = 'https://placehold.co/300x200.png';
    }
    
    const { generateImage, ...productDetails } = data;

    const newProductData: Omit<Product, 'id' | 'userId'> = {
        ...productDetails,
        imageUrl: finalImageUrl, // Pass the Base64 or placeholder to addProduct
    };

    try {
      await addProduct(newProductData); // addProduct now handles Storage upload if imageUrl is Base64
      // Success toast is handled by addProduct
      reset();
      router.push('/inventory');
    } catch (error) {
      // Error toast is handled by addProduct
      console.error("Failed to add product from form:", error);
      // Optionally, specific UI feedback if addProduct throws an error not caught by its own toasts
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Agregar Nuevo Artículo al Inventario</CardTitle>
        <CardDescription>Completa los detalles del nuevo producto.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Nombre del Artículo</Label>
            <Input id="name" {...register('name')} disabled={isProcessing} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register('description')} disabled={isProcessing} />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Precio ($)</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} disabled={isProcessing} />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad Inicial</Label>
              <Input id="quantity" type="number" {...register('quantity')} disabled={isProcessing} />
              {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="imageUrl">URL de la Imagen (opcional)</Label>
            <Input 
              id="imageUrl" 
              type="url" 
              {...register('imageUrl')} 
              placeholder="https://ejemplo.com/imagen.png o dejar vacío para IA" 
              disabled={watchGenerateImage || isProcessing}
            />
             {errors.imageUrl && !watchGenerateImage && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="generateImage" 
              checked={watchGenerateImage}
              onCheckedChange={(checked) => {
                const isChecked = !!checked;
                setValue("generateImage", isChecked, { shouldValidate: true });
                if (isChecked) {
                  setValue("imageUrl", "", { shouldValidate: true }); // Clear manual URL if AI is chosen
                }
              }}
              disabled={!!watchImageUrl || isProcessing}
            />
            <Label htmlFor="generateImage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Generar imagen con IA si la URL está vacía
            </Label>
          </div>
          { watchImageUrl && <p className="text-xs text-muted-foreground mt-1">Desmarca "Generar imagen con IA" o borra la URL para habilitar la otra opción.</p>}


          <div>
            <Label htmlFor="category">Categoría (opcional)</Label>
            <Input id="category" {...register('category')} placeholder="Ej: Herramientas Manuales, Pinturas" disabled={isProcessing}/>
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Agregar Artículo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
