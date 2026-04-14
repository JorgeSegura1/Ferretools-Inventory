"use client";

import ProductList from '@/components/products/ProductList';
import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, ListTree, XIcon, ShoppingCart, Loader2, Sparkles, Search } from 'lucide-react';
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
import type { Product, SaleItem } from '@/types';

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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative py-12 px-6 rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />
        <div className="relative z-10 flex flex-col items-start gap-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Innovación Industrial
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            La Siguiente Generación de <span className="text-primary">Ferretería Profesional</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Suministros de alto nivel para marcas serias. Gestión inteligente de inventario y despacho eficiente en toda Colombia.
          </p>
        </div>
      </section>

      {/* Control Panel */}
      <div className="sticky top-4 z-30 flex flex-col gap-6 p-6 glass-card rounded-2xl shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por referencia o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 border-white/10 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                  <ListTree className="mr-2 h-4 w-4" />
                  {selectedCategory || "Categorías"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-white/10 w-56">
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Filtrar por sector</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setSelectedCategory(null)} className="rounded-lg">Todas</DropdownMenuItem>
                {allCategories.map(cat => (
                  <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)} className="rounded-lg">{cat}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 border-white/10 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                  <Filter className="mr-2 h-4 w-4" /> Filtros
                </Button>
              </SheetTrigger>
              <SheetContent className="glass-card border-none">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black uppercase tracking-tighter">Refinar Selección</SheetTitle>
                  <SheetDescription>Ajusta los parámetros para encontrar el equipo ideal.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-8 py-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary">Disponibilidad</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox id="inStock" checked={showInStockOnly} onCheckedChange={v => setShowInStockOnly(!!v)} />
                        <Label htmlFor="inStock" className="text-sm font-medium">Solo en Stock</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="outOfStock" checked={showOutOfStockOnly} onCheckedChange={v => setShowOutOfStockOnly(!!v)} />
                        <Label htmlFor="outOfStock" className="text-sm font-medium">Solo Agotados</Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary">Rango de Precio (COP)</Label>
                    <Slider
                      min={minMaxPrice[0]}
                      max={minMaxPrice[1]}
                      step={1000}
                      value={currentPriceRange}
                      onValueChange={v => setCurrentPriceRange(v as [number, number])}
                    />
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>${currentPriceRange[0].toLocaleString()}</span>
                      <span>${currentPriceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <SheetFooter>
                   <Button onClick={resetAllFilters} variant="ghost" className="w-full text-xs font-bold uppercase">Limpiar Todo</Button>
                   <SheetClose asChild>
                     <Button className="w-full h-12 rounded-xl font-black uppercase tracking-tighter">Aplicar Cambios</Button>
                   </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(searchTerm || selectedCategory) && (
              <Button onClick={resetAllFilters} variant="link" className="text-xs h-auto p-0 text-primary font-bold uppercase tracking-widest">
                <XIcon className="mr-1 h-3 w-3" /> Borrar Búsqueda
              </Button>
            )}
          </div>
          {role === 'admin' && saleItems.length > 0 && (
            <Button onClick={() => setIsSaleSheetOpen(true)} className="relative premium-gradient border-none rounded-xl h-12 px-6 font-black uppercase tracking-tighter shadow-lg shadow-primary/20 transition-transform active:scale-95">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Carrito
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-[10px] font-black border-2 border-background">
                {saleItems.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid Section */}
      {loadingProducts && products.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Catálogo de Expertos / {filteredProducts.length} Resultados
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

      {role === 'admin' && (
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
