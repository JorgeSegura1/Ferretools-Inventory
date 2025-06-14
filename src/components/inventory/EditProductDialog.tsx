
"use client";

import type { Product } from '@/types';
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Edit3, Loader2 } from 'lucide-react';

interface EditProductDialogProps {
  product: Product;
  children?: React.ReactNode;
}

const formSchema = z.object({
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
  imageUrl: z.string().url("Debe ser una URL válida para la imagen.").or(z.literal('')).optional(),
  generateImage: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function EditProductDialog({ product, children }: EditProductDialogProps) {
  const { updateProductDetails } = useProducts();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: product.quantity,
      imageUrl: product.imageUrl.startsWith('data:image') ? '' : product.imageUrl, // Don't show data URIs in input
      generateImage: false,
    },
  });

  const watchImageUrl = watch("imageUrl");
  const watchGenerateImage = watch("generateImage");

  useEffect(() => {
    if (isOpen) {
      reset({
        quantity: product.quantity,
        imageUrl: product.imageUrl.startsWith('data:image') ? '' : product.imageUrl,
        generateImage: false,
      });
    }
  }, [isOpen, product, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsProcessing(true);
    try {
      await updateProductDetails(product.id, {
        quantity: data.quantity,
        newImageUrl: data.imageUrl,
        generateNewImage: data.generateImage,
      });
      // Toast for success is handled by updateProductDetails
      setIsOpen(false);
    } catch (error) {
      // Toast for error is handled by updateProductDetails or caught here if it throws
      console.error("Error updating product from dialog:", error);
      if (!(error instanceof Error && error.message.includes("handled by context"))) {
          toast({
              title: "Error Inesperado",
              description: "Ocurrió un error al actualizar el producto.",
              variant: "destructive"
          });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ? children : <Button variant="outline" size="sm"><Edit3 className="h-4 w-4 mr-2" /> Editar</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Editar Producto: {product.name}</DialogTitle>
          <DialogDescription>
            Actualiza la cantidad y la imagen para este artículo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor={`quantity-${product.id}`}>Cantidad</Label>
            <Input
              id={`quantity-${product.id}`}
              type="number"
              {...register('quantity')}
              disabled={isProcessing}
            />
            {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <Label htmlFor={`imageUrl-${product.id}`}>URL de la Imagen (opcional)</Label>
            <Input
              id={`imageUrl-${product.id}`}
              type="url"
              {...register('imageUrl')}
              placeholder="https://ejemplo.com/imagen.png o dejar vacío para IA"
              disabled={watchGenerateImage || isProcessing}
            />
            {errors.imageUrl && !watchGenerateImage && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`generateImage-${product.id}`}
              checked={watchGenerateImage}
              onCheckedChange={(checked) => {
                const isChecked = !!checked;
                setValue("generateImage", isChecked, { shouldValidate: true });
                if (isChecked) {
                  setValue("imageUrl", "", { shouldValidate: true }); 
                }
              }}
              disabled={!!watchImageUrl || isProcessing}
            />
            <Label htmlFor={`generateImage-${product.id}`} className="text-sm font-medium">
              Generar nueva imagen con IA (reemplazará la actual si la URL está vacía)
            </Label>
          </div>
          {watchImageUrl && <p className="text-xs text-muted-foreground">Desmarca "Generar imagen con IA" o borra la URL para habilitar la otra opción.</p>}


          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>Cancelar</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
