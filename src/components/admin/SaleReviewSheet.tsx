
"use client";

import type { SaleItem } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';

interface SaleReviewSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  items: SaleItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onConfirmSale: () => Promise<void>;
  isProcessingSale: boolean;
}

function getProductHint(category?: string): string {
  if (category) {
    const words = category.split(' ').filter(Boolean);
    if (words.length === 0) return 'item';
    if (words.length === 1) return words[0];
    return words.slice(0, 2).join(' ');
  }
  return 'item';
}

export default function SaleReviewSheet({
  isOpen,
  setIsOpen,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmSale,
  isProcessingSale,
}: SaleReviewSheetProps) {

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantityToSell, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantityToSell, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-xl sm:text-2xl font-headline">Revisar Venta</SheetTitle>
          <SheetDescription>
            Ajusta las cantidades y confirma la venta para actualizar el stock.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <Trash2 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">No has seleccionado productos para la venta.</p>
            <SheetClose asChild>
              <Button variant="outline" className="mt-4 w-full sm:w-auto">Volver al Catálogo</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-grow my-4 pr-3">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 sm:gap-4 p-3 border rounded-lg">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover min-w-[60px]"
                      data-ai-hint={getProductHint(item.category)}
                    />
                    <div className="flex-grow">
                      <h4 className="font-semibold text-sm sm:text-md">{item.name}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Precio: {item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7"
                          onClick={() => onUpdateQuantity(item.productId, item.quantityToSell - 1)}
                          disabled={item.quantityToSell <= 1 || isProcessingSale}
                        >
                          <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantityToSell}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            onUpdateQuantity(item.productId, isNaN(val) ? 1 : val);
                          }}
                          className="h-6 w-10 sm:h-7 sm:w-12 text-center px-1 text-sm"
                          min="1"
                          max={item.maxQuantity}
                          disabled={isProcessingSale}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7"
                          onClick={() => onUpdateQuantity(item.productId, item.quantityToSell + 1)}
                          disabled={item.quantityToSell >= item.maxQuantity || isProcessingSale}
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground ml-1">(Máx: {item.maxQuantity})</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/80 h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => onRemoveItem(item.productId)}
                      disabled={isProcessingSale}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="mt-auto border-t pt-4">
              <div className="w-full">
                <div className="flex justify-between items-center mb-2 text-md sm:text-lg font-semibold">
                  <span>Total Productos:</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-lg sm:text-xl font-bold text-primary">
                  <span>Monto Total:</span>
                  <span>{totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0})}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full" disabled={isProcessingSale}>Cancelar</Button>
                    </SheetClose>
                    <Button 
                        onClick={onConfirmSale} 
                        className="w-full"
                        disabled={isProcessingSale || items.length === 0}
                    >
                        {isProcessingSale ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Venta y Actualizar Stock"}
                    </Button>
                </div>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
