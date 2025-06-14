
"use client";

import ProductList from '@/components/products/ProductList';
import { useProducts } from '@/context/ProductContext';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, ListTree, Tag } from 'lucide-react';

export default function HomePage() {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">Catálogo de Productos</h1>
        <p className="text-lg text-muted-foreground mt-2">Encuentra todo lo que necesitas para tus proyectos.</p>
      </header>
      <div className="mb-6 max-w-xl mx-auto">
        <Input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="mb-8 flex flex-wrap justify-center items-center gap-2 sm:gap-3 px-2">
        <Button variant="outline" size="sm" className="text-sm">
          <ListTree className="mr-2 h-3.5 w-3.5" />
          Categoría
        </Button>
        <Button variant="outline" size="sm" className="text-sm">
          <Tag className="mr-2 h-3.5 w-3.5" />
          Marca
        </Button>
        <Button variant="outline" size="sm" className="text-sm">
          <Filter className="mr-2 h-3.5 w-3.5" />
          Más Filtros
        </Button>
      </div>
      <ProductList products={filteredProducts} />
    </div>
  );
}
