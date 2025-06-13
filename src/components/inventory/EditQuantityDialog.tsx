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
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Edit3 } from 'lucide-react';

interface EditQuantityDialogProps {
  product: Product;
  children?: React.ReactNode; // To allow custom trigger
}

const formSchema = z.object({
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
});

type FormData = z.infer<typeof formSchema>;

export default function EditQuantityDialog({ product, children }: EditQuantityDialogProps) {
  const { updateProductQuantity } = useProducts();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: product.quantity,
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    updateProductQuantity(product.id, data.quantity);
    toast({
      title: "Inventario Actualizado",
      description: `La cantidad de "${product.name}" se ha actualizado a ${data.quantity}.`,
    });
    setIsOpen(false);
  };
  
  // Reset form when dialog opens or product quantity changes
  React.useEffect(() => {
    if (isOpen) {
      reset({ quantity: product.quantity });
    }
  }, [isOpen, product.quantity, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ? children : <Button variant="outline" size="sm"><Edit3 className="h-4 w-4 mr-2" /> Editar</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Editar Cantidad: {product.name}</DialogTitle>
          <DialogDescription>
            Actualiza la cantidad disponible para este artículo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Cantidad
              </Label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity')}
                className="col-span-3"
              />
            </div>
            {errors.quantity && (
              <p className="col-span-4 text-sm text-destructive text-right">{errors.quantity.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
