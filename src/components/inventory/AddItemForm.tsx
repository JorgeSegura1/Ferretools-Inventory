
"use client";

import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
  imageUrl: z.string().url("Debe ser una URL válida para la imagen.").or(z.literal('')),
  category: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddItemForm() {
  const { addProduct } = useProducts();
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      imageUrl: '',
      category: '',
    }
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Form data received:', data);
    const newProductData = {
        ...data,
        imageUrl: data.imageUrl || 'https://placehold.co/300x200.png'
    };
    addProduct(newProductData);
    toast({
      title: "Artículo Agregado",
      description: `"${data.name}" ha sido agregado al inventario.`,
    });
    reset();
    router.push('/inventory');
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
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Precio ($)</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad Inicial</Label>
              <Input id="quantity" type="number" {...register('quantity')} />
              {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="imageUrl">URL de la Imagen (opcional)</Label>
            <Input id="imageUrl" type="url" {...register('imageUrl')} placeholder="https://ejemplo.com/imagen.png" />
            {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
          </div>

          <div>
            <Label htmlFor="category">Categoría (opcional)</Label>
            <Input id="category" {...register('category')} placeholder="Ej: Herramientas Manuales, Pinturas"/>
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit">Agregar Artículo</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
