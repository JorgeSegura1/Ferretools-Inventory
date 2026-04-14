
"use client";

import ProductList from '@/components/products/ProductList';
import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, ListTree, XIcon, ShoppingCart, Loader2, Sparkles, Search, BarChart3, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import SaleReviewSheet from '@/components/admin/SaleReviewSheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollBar } from '@/components/ui/scroll-area';
import type { Product, SaleItem } from '@/types';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { products, loadingProducts, processSaleAndUpdateStock } = useProducts();
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [minMaxPrice, setMinMaxPrice] = useState<[number, number]>([0, 1000]);
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([0, 1000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSaleSheetOpen, setIsSaleSheetOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Refs for drag-to-scroll
  const featuredRef = useRef<HTMLDivElement>(null);
  const tradeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price).filter(p => typeof p === 'number');
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setMinMaxPrice([min, max]);
        if (currentPriceRange[0] === 0 && currentPriceRange[1] === 1000) {
            setCurrentPriceRange([min, max]);
        }
      }
    }
  }, [products]);

  const allCategories = useMemo(() => {
    const categories = products
      .map(product => product.category)
      .filter((category): category is string => !!category); 
    return [...new Set(categories)].sort();
  }, [products]);

  const stats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 5).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    return { totalValue, lowStock, outOfStock };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let tempProducts = products;
    if (searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      tempProducts = tempProducts.filter(product => product.category === selectedCategory);
    }
    if (showInStockOnly) tempProducts = tempProducts.filter(product => product.quantity > 0);
    if (showOutOfStockOnly) tempProducts = tempProducts.filter(product => product.quantity === 0);
    tempProducts = tempProducts.filter(product => 
      product.price >= currentPriceRange[0] && product.price <= currentPriceRange[1]
    );
    return tempProducts;
  }, [products, searchTerm, selectedCategory, showInStockOnly, showOutOfStockOnly, currentPriceRange]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setShowInStockOnly(false);
    setShowOutOfStockOnly(false);
    setCurrentPriceRange(minMaxPrice);
  };

  const handleSelectForSale = (product: Product) => {
    setSaleItems(prev => {
      if (prev.find(item => item.productId === product.id)) return prev;
      return [...prev, {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        category: product.category,
        quantityToSell: 1,
        maxQuantity: product.quantity,
      }];
    });
  };

  const handleConfirmSale = async () => {
    setIsProcessingSale(true);
    const success = await processSaleAndUpdateStock(saleItems.map(item => ({
      ...item,
      quantitySold: item.quantityToSell,
      priceAtSale: item.price,
      productName: item.name,
    })));
    if (success) {
      setSaleItems([]);
      setIsSaleSheetOpen(false); 
    }
    setIsProcessingSale(false);
  };

  // Logic for drag-to-scroll
  const handleDragScroll = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
    const ele = ref.current;
    if (!ele) return;
    
    const startPos = {
      left: ele.scrollLeft,
      x: e.clientX,
    };

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startPos.x;
      ele.scrollLeft = startPos.left - dx;
      ele.style.cursor = 'grabbing';
      ele.style.userSelect = 'none';
    };

    const onMouseUp = () => {
      ele.style.cursor = 'grab';
      ele.style.removeProperty('user-select');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-6 md:px-12 rounded-[2.5rem] overflow-hidden border border-white/5 bg-gradient-to-br from-primary/20 via-background to-background shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="relative z-10 flex flex-col items-start gap-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles className="h-3.5 w-3.5" /> Estándar Industrial 4.0
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white">
            Infraestructura para <span className="text-primary italic">Líderes.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Optimiza tu cadena de suministro con tecnología de punta. Gestión inteligente de inventario y logística integral en un solo lugar.
          </p>
        </div>
      </section>

      {/* Control Panel */}
      <div className="sticky top-4 z-30 flex flex-col gap-6 p-6 glass-card rounded-2xl shadow-2xl border-white/10">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por referencia o nombre técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary text-sm font-medium"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-14 border-white/10 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 flex-1 md:flex-none">
                  <ListTree className="mr-2 h-4 w-4" />
                  {selectedCategory || "Categoría"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-white/10 w-64 p-2">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Especialidad</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setSelectedCategory(null)} className="rounded-xl py-3 font-medium">Todas las Categorías</DropdownMenuItem>
                {allCategories.map(cat => (
                  <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)} className="rounded-xl py-3 font-medium">{cat}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-14 border-white/10 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 flex-1 md:flex-none">
                  <Filter className="mr-2 h-4 w-4" /> Filtros
                </Button>
              </SheetTrigger>
              <SheetContent className="glass-card border-none w-full sm:max-w-md">
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-3xl font-black uppercase tracking-tighter">Parámetros</SheetTitle>
                  <SheetDescription className="text-sm">Ajusta la búsqueda de suministros específicos.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-10 py-4">
                  <div className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Disponibilidad de Almacén</Label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <Checkbox id="inStock" checked={showInStockOnly} onCheckedChange={v => setShowInStockOnly(!!v)} />
                        <Label htmlFor="inStock" className="text-sm font-bold cursor-pointer">Unidades Disponibles</Label>
                      </div>
                      <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <Checkbox id="outOfStock" checked={showOutOfStockOnly} onCheckedChange={v => setShowOutOfStockOnly(!!v)} />
                        <Label htmlFor="outOfStock" className="text-sm font-bold cursor-pointer">Sin Stock / Bajo Pedido</Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Margen de Inversión (COP)</Label>
                    <div className="px-2">
                      <Slider
                        min={minMaxPrice[0]}
                        max={minMaxPrice[1]}
                        step={1000}
                        value={currentPriceRange}
                        onValueChange={v => setCurrentPriceRange(v as [number, number])}
                        className="my-6"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-black text-muted-foreground bg-white/[0.03] p-3 rounded-xl border border-white/5">
                      <span className="text-white">${currentPriceRange[0].toLocaleString()}</span>
                      <span className="text-white">${currentPriceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <SheetFooter className="mt-12 flex-col gap-3">
                   <Button onClick={resetAllFilters} variant="ghost" className="w-full text-xs font-black uppercase tracking-widest">Restablecer</Button>
                   <SheetClose asChild>
                     <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-tighter shadow-lg shadow-primary/20">Aplicar Filtros</Button>
                   </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(searchTerm || selectedCategory) && (
              <Button onClick={resetAllFilters} variant="link" className="text-xs h-auto p-0 text-primary font-black uppercase tracking-[0.1em]">
                <XIcon className="mr-2 h-3.5 w-3.5" /> Limpiar búsqueda
              </Button>
            )}
          </div>
          {user && saleItems.length > 0 && (
            <Button onClick={() => setIsSaleSheetOpen(true)} className="relative premium-gradient border-none rounded-2xl h-14 px-8 font-black uppercase tracking-tighter shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
              <ShoppingCart className="mr-3 h-5 w-5" />
              {role === 'admin' ? 'Revisar Despacho' : 'Revisar Carrito'}
              <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white text-[11px] font-black border-[3px] border-background shadow-lg">
                {saleItems.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Admin Quick Stats */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-white/5 bg-white/[0.02]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Inventario</p>
                <p className="text-2xl font-black text-white">{stats.totalValue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5 bg-white/[0.02]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Productos en Stock</p>
                <p className="text-2xl font-black text-white">{products.filter(p => p.quantity > 0).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5 bg-white/[0.02] border-destructive/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-destructive/10 p-3 rounded-2xl">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Atención Crítica</p>
                <p className="text-2xl font-black text-white">{stats.lowStock + stats.outOfStock} SKU</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Featured Collections */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-white">Colecciones Destacadas</h2>
          <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
            Explorar Más <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div 
          ref={featuredRef}
          onMouseDown={(e) => handleDragScroll(e, featuredRef)}
          className="w-full overflow-x-auto whitespace-nowrap pb-4 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex space-x-4 md:space-x-6">
            {placeholderData.featuredCollections.map((col) => (
              <div key={col.id} className="inline-block group cursor-pointer w-32 md:w-40 shrink-0">
                <div className="aspect-square relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 glass-card mb-3 transition-all duration-300 group-hover:border-primary/50 group-hover:scale-105 pointer-events-none">
                  <Image
                    src={col.image}
                    alt={col.name}
                    fill
                    draggable={false}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    data-ai-hint={col.hint}
                  />
                </div>
                <div className="text-center px-1">
                  <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-tighter text-white leading-tight mb-1 line-clamp-2">
                    {col.name}
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{col.count} artículos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop By Trade */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-white">Compra Por Oficio</h2>
          <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
            Ver Más <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div 
          ref={tradeRef}
          onMouseDown={(e) => handleDragScroll(e, tradeRef)}
          className="w-full overflow-x-auto whitespace-nowrap pb-4 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex space-x-4 md:space-x-6">
            {placeholderData.shopByTrade.map((trade) => (
              <div key={trade.id} className="inline-block group cursor-pointer w-32 md:w-40 shrink-0">
                <div className="aspect-square relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 glass-card mb-3 transition-all duration-300 group-hover:border-primary/50 group-hover:scale-105 pointer-events-none">
                  <Image
                    src={trade.image}
                    alt={trade.name}
                    fill
                    draggable={false}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    data-ai-hint={trade.hint}
                  />
                </div>
                <div className="text-center px-1">
                  <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-tighter text-white leading-tight mb-1 line-clamp-2">
                    {trade.name}
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{trade.count} artículos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Section */}
      {loadingProducts && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-14 w-14 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base de Datos</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <div className="w-8 h-px bg-muted-foreground/30" /> Catálogo Industrial / {filteredProducts.length} SKU encontrados
            </h2>
          </div>
          <ProductList 
            products={filteredProducts} 
            role={role}
            onSelectForSale={handleSelectForSale}
            onRemoveFromSale={id => setSaleItems(prev => prev.filter(i => i.productId !== id))}
            isProductInSale={id => saleItems.some(i => i.productId === id)}
          />
        </div>
      )}

      {user && (
        <SaleReviewSheet
          isOpen={isSaleSheetOpen}
          setIsOpen={setIsSaleSheetOpen}
          items={saleItems}
          onUpdateQuantity={(id, q) => setSaleItems(prev => prev.map(i => i.productId === id ? {...i, quantityToSell: q} : i))}
          onRemoveItem={id => setSaleItems(prev => prev.filter(i => i.productId !== id))}
          onConfirmSale={handleConfirmSale}
          isProcessingSale={isProcessingSale}
        />
      )}
    </div>
  );
}
