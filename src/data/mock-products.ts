import type { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Martillo de Carpintero',
    description: 'Martillo de acero forjado con mango de fibra de vidrio.',
    price: 12.99,
    quantity: 25,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Herramientas Manuales',
  },
  {
    id: '2',
    name: 'Destornillador Phillips #2',
    description: 'Punta magnética, mango ergonómico bimaterial.',
    price: 5.49,
    quantity: 50,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Herramientas Manuales',
  },
  {
    id: '3',
    name: 'Cinta Métrica 5m',
    description: 'Cinta métrica retráctil con carcasa resistente.',
    price: 8.75,
    quantity: 0, // Out of stock
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Medición',
  },
  {
    id: '4',
    name: 'Taladro Percutor Inalámbrico 18V',
    description: 'Incluye 2 baterías de litio y cargador rápido.',
    price: 129.99,
    quantity: 10,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Herramientas Eléctricas',
  },
  {
    id: '5',
    name: 'Pintura Blanca Látex Interior 1 Galón',
    description: 'Pintura lavable de alta cubrición, acabado mate.',
    price: 25.00,
    quantity: 30,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Pinturas',
  },
  {
    id: '6',
    name: 'Juego de Brocas (10 piezas)',
    description: 'Brocas de titanio para metal, madera y plástico.',
    price: 15.99,
    quantity: 15,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Accesorios Herramientas',
  },
];
