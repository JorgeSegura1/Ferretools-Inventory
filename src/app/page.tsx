
"use client";

import ProductList from '@/components/products/ProductList';
import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, ListTree, Tag, XIcon, ShoppingCart, Loader2 } from 'lucide-react';
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
        setCurrentPriceRange([min, max]); 
      } else {
        setMinMaxPrice([0,1000]);
        setCurrentPriceRange([0,1000]);
      }
    }
  }, [products]);

  const allCategories = useMemo(() => {
    if (loadingProducts) return [];
    const categories = products
      .map(product => product.category)
      .filter((category): category is string => !!category); 
    return [...new Set(categories)].sort();
  }, [products, loadingProducts]);

  const filteredProducts = useMemo(() => {
    let tempProducts = products;

    if (searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      tempProducts = tempProducts.filter(product => product.category === selectedCategory);
    }
    
    if (showInStockOnly) {
      tempProducts = tempProducts.filter(product => product.quantity > 0);
    } else if (showOutOfStockOnly) {
      tempProducts = tempProducts.filter(product => product.quantity === 0);
    }

    tempProducts = tempProducts.filter(product => 
      product.price >= currentPriceRange[0] && product.price <= currentPriceRange[1]
    );

    return tempProducts;
  }, [products, searchTerm, selectedCategory, showInStockOnly, showOutOfStockOnly, currentPriceRange]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleClearAdvancedFilters = () => {
    setShowInStockOnly(false);
    setShowOutOfStockOnly(false);
    setCurrentPriceRange(minMaxPrice); 
  };
  
  const activeAdvancedFiltersCount = [
    showInStockOnly,
    showOutOfStockOnly,
    currentPriceRange[0] !== minMaxPrice[0] || currentPriceRange[1] !== minMaxPrice[1]
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    handleClearAdvancedFilters();
  };

  // Sale Item Management
  const handleSelectForSale = (product: Product) => {
    setSaleItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      if (existingItem) {
        // If item already selected, maybe open sheet or show notification? For now, do nothing.
        // Or remove it: return prevItems.filter(item => item.productId !== product.id);
        return prevItems; 
      }
      if (product.quantity > 0) {
        return [...prevItems, {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price, // This is priceAtSale
          category: product.category,
          quantityToSell: 1,
          maxQuantity: product.quantity,
        }];
      }
      return prevItems; // Do not add if out of stock
    });
  };

  const handleRemoveFromSale = (productId: string) => {
    setSaleItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };
  
  const isProductInSale = (productId: string): boolean => {
    return saleItems.some(item => item.productId === productId);
  }

  const handleUpdateSaleQuantity = (productId: string, newQuantity: number) => {
    setSaleItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantityToSell: Math.max(1, Math.min(newQuantity, item.maxQuantity)) }
          : item
      )
    );
  };

  const handleConfirmSale = async () => {
    if (saleItems.length === 0) return;
    setIsProcessingSale(true);
    const itemsToProcess = saleItems.map(item => ({
      productId: item.productId,
      quantitySold: item.quantityToSell,
      priceAtSale: item.price, // Pass the price from SaleItem
      productName: item.name,    // Pass the name from SaleItem
      category: item.category,   // Pass the category from SaleItem
      imageUrl: item.imageUrl    // Pass the imageUrl from SaleItem
    }));
    
    const success = await processSaleAndUpdateStock(itemsToProcess);
    if (success) {
      setSaleItems([]);
      setIsSaleSheetOpen(false); 
    }
    setIsProcessingSale(false);
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">Catálogo de Productos</h1>
        <p className="text-lg text-muted-foreground mt-2">Encuentra todo lo que necesitas para tus proyectos.</p>
      </header>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <Input
          type="text"
          placeholder="Buscar productos por nombre, descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <div className="flex items-center gap-2 justify-self-start md:justify-self-end">
          {(searchTerm || selectedCategory || activeAdvancedFiltersCount > 0) && (
            <Button onClick={resetAllFilters} variant="ghost" className="text-sm">
              <XIcon className="mr-2 h-4 w-4" /> Limpiar filtros
            </Button>
          )}
          {role === 'admin' && saleItems.length > 0 && (
            <Button variant="outline" onClick={() => setIsSaleSheetOpen(true)} size="sm" className="relative">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Revisar Venta
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                {saleItems.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap justify-center items-center gap-2 sm:gap-3 px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-sm">
              <ListTree className="mr-2 h-3.5 w-3.5" />
              {selectedCategory || "Categoría"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Seleccionar Categoría</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleCategorySelect(null)}>
              Todas las categorías
            </DropdownMenuItem>
            {allCategories.map(category => (
              <DropdownMenuItem key={category} onSelect={() => handleCategorySelect(category)}>
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="text-sm" disabled>
          <Tag className="mr-2 h-3.5 w-3.5" />
          Marca
        </Button>

        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="text-sm relative">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Más Filtros
              {activeAdvancedFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  {activeAdvancedFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros Avanzados</SheetTitle>
              <SheetDescription>
                Aplica filtros adicionales para refinar tu búsqueda.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Disponibilidad</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inStock" 
                    checked={showInStockOnly} 
                    onCheckedChange={(checked) => {
                      setShowInStockOnly(!!checked);
                      if (checked) setShowOutOfStockOnly(false);
                    }}
                  />
                  <Label htmlFor="inStock">Mostrar solo en stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="outOfStock" 
                    checked={showOutOfStockOnly} 
                    onCheckedChange={(checked) => {
                      setShowOutOfStockOnly(!!checked);
                      if (checked) setShowInStockOnly(false);
                    }}
                  />
                  <Label htmlFor="outOfStock">Mostrar solo agotados</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="priceRange" className="text-base font-semibold">
                  Rango de Precios: ${currentPriceRange[0]} - ${currentPriceRange[1]}
                </Label>
                <Slider
                  id="priceRange"
                  min={minMaxPrice[0]}
                  max={minMaxPrice[1]}
                  step={1} 
                  value={currentPriceRange}
                  onValueChange={(value) => setCurrentPriceRange(value as [number, number])}
                  minStepsBetweenThumbs={0}
                  disabled={products.length === 0 || minMaxPrice[0] === minMaxPrice[1]}
                />
                 <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${minMaxPrice[0]}</span>
                    <span>${minMaxPrice[1]}</span>
                </div>
              </div>
            </div>
            <SheetFooter className="mt-auto">
              <Button variant="outline" onClick={handleClearAdvancedFilters} className="w-full sm:w-auto">Limpiar Filtros</Button>
              <SheetClose asChild>
                <Button type="button" className="w-full sm:w-auto">Aplicar</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      
      {loadingProducts && products.length === 0 ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <ProductList 
          products={filteredProducts} 
          role={role}
          onSelectForSale={handleSelectForSale}
          onRemoveFromSale={handleRemoveFromSale}
          isProductInSale={isProductInSale}
        />
      )}

      {role === 'admin' && (
        <SaleReviewSheet
          isOpen={isSaleSheetOpen}
          setIsOpen={setIsSaleSheetOpen}
          items={saleItems}
          onUpdateQuantity={handleUpdateSaleQuantity}
          onRemoveItem={handleRemoveFromSale}
          onConfirmSale={handleConfirmSale}
          isProcessingSale={isProcessingSale}
        />
      )}
    </div>
  );
}

