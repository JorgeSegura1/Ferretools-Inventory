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
import { Minus, Plus, Trash2, Loader2, CreditCard, Wallet, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

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
  const { toast } = useToast();
  const { role } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'nequi'>('cash');
  const [nequiPhone, setNequiPhone] = useState('');
  const [isSimulatingNequi, setIsSimulatingNequi] = useState(false);
  const [isNequiConfirmed, setIsNequiConfirmed] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantityToSell, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantityToSell, 0);

  const handleSimulateNequi = () => {
    if (!nequiPhone || nequiPhone.length < 10) {
      toast({
        title: "Número inválido",
        description: "Por favor ingresa un número de Nequi válido.",
        variant: "destructive"
      });
      return;
    }
    setIsSimulatingNequi(true);
    // Simular tiempo de espera de la notificación push
    setTimeout(() => {
      setIsSimulatingNequi(false);
      setIsNequiConfirmed(true);
      toast({
        title: "¡Pago Confirmado!",
        description: "El pago por Nequi ha sido verificado exitosamente.",
      });
    }, 3000);
  };

  const handleFinalConfirm = async () => {
    if (paymentMethod === 'nequi' && !isNequiConfirmed) {
      toast({
        title: "Pago pendiente",
        description: "Primero debes simular y confirmar el pago por Nequi.",
        variant: "destructive"
      });
      return;
    }
    await onConfirmSale();
    // Reset simulation states
    setIsNequiConfirmed(false);
    setNequiPhone('');
  };

  const sheetTitle = role === 'admin' ? "Revisión de Despacho" : "Confirmar Pedido";
  const sheetDescription = role === 'admin' 
    ? "Ajusta las cantidades finales y selecciona el método de recaudo."
    : "Revisa tus suministros y finaliza tu compra segura.";
  const confirmButtonText = role === 'admin' ? "Finalizar Despacho" : "Finalizar Compra";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col glass-card border-l border-white/10">
        <SheetHeader>
          <SheetTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{sheetTitle}</SheetTitle>
          <SheetDescription className="text-xs">
            {sheetDescription}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <Trash2 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Lista vacía</p>
            <SheetClose asChild>
              <Button variant="outline" className="mt-4 rounded-xl font-bold uppercase text-[10px] tracking-widest">Volver al Catálogo</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-grow my-4 pr-3">
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                   <div className="h-1 w-1 rounded-full bg-primary" /> Items Seleccionados
                </div>
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 sm:gap-4 p-3 glass-card rounded-xl border-white/5">
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-white/10">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        data-ai-hint={getProductHint(item.category)}
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-xs sm:text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        UNID: {item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-lg border-white/10"
                          onClick={() => onUpdateQuantity(item.productId, item.quantityToSell - 1)}
                          disabled={item.quantityToSell <= 1 || isProcessingSale}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-black min-w-8 text-center">{item.quantityToSell}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-lg border-white/10"
                          onClick={() => onUpdateQuantity(item.productId, item.quantityToSell + 1)}
                          disabled={item.quantityToSell >= item.maxQuantity || isProcessingSale}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="text-[9px] text-muted-foreground font-black ml-1 uppercase">Máx: {item.maxQuantity}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8"
                      onClick={() => onRemoveItem(item.productId)}
                      disabled={isProcessingSale}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Sección de Pago */}
                <div className="pt-6 space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" /> Método de Pago
                  </div>
                  
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(v) => {
                      setPaymentMethod(v as 'cash' | 'nequi');
                      setIsNequiConfirmed(false);
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                      <Label
                        htmlFor="cash"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-white/5 bg-white/[0.02] p-4 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <CreditCard className="mb-2 h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{role === 'admin' ? 'Efectivo' : 'Contra Entrega'}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="nequi" id="nequi" className="peer sr-only" />
                      <Label
                        htmlFor="nequi"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-white/5 bg-white/[0.02] p-4 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <Wallet className="mb-2 h-5 w-5 text-[#DA0081]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Nequi</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'nequi' && (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                      {!isNequiConfirmed ? (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="nequi-phone" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Número Celular Nequi</Label>
                            <Input 
                              id="nequi-phone"
                              type="tel"
                              placeholder="3xx xxx xxxx"
                              value={nequiPhone}
                              onChange={(e) => setNequiPhone(e.target.value)}
                              className="h-12 rounded-xl bg-black/20 border-white/10 font-bold"
                              disabled={isSimulatingNequi}
                            />
                          </div>
                          <Button 
                            onClick={handleSimulateNequi} 
                            disabled={isSimulatingNequi}
                            className="w-full h-12 rounded-xl bg-[#DA0081] hover:bg-[#DA0081]/90 font-black uppercase tracking-tighter text-[11px]"
                          >
                            {isSimulatingNequi ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Esperando Aprobación...</>
                            ) : (
                              "Pagar con Nequi"
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-2 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Pago Nequi Verificado</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="mt-auto border-t border-white/10 pt-6">
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-white">{totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-y border-white/5">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-primary">Total a Pagar</span>
                  <span className="text-2xl font-black text-white">{totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0})}</span>
                </div>
                <div className="flex flex-col gap-3">
                    <Button 
                        onClick={handleFinalConfirm} 
                        className="w-full h-14 rounded-2xl premium-gradient border-none font-black uppercase tracking-tighter shadow-xl shadow-primary/30"
                        disabled={isProcessingSale || items.length === 0 || (paymentMethod === 'nequi' && !isNequiConfirmed)}
                    >
                        {isProcessingSale ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : confirmButtonText}
                    </Button>
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100" disabled={isProcessingSale}>Cancelar Operación</Button>
                    </SheetClose>
                </div>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
