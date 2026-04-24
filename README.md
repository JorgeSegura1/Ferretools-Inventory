# 🛠️ Ferretools Inventory - Smart Logistics & IoT

**Ferretools** es una plataforma avanzada de gestión de inventarios y logística para ferreterías industriales, diseñada bajo el paradigma de la **Industria 4.0**. Integra inteligencia artificial para la generación de activos visuales, telemetría IoT simulada y un sistema de control de roles para socios y administradores.

![Ferretools Preview](https://picsum.photos/seed/ferretools/1200/600)

## 🚀 Características Principales

### 💎 Experiencia de Usuario Premium
- **Interfaz Dark Mode**: Diseño elegante con efectos de *glassmorphism* y gradientes dinámicos.
- **Navegación Intuitiva**: Colecciones destacadas y navegación por oficio con scroll horizontal fluido.
- **Mobile First**: Totalmente responsivo y optimizado para dispositivos móviles.

### 🧠 Inteligencia Artificial (Genkit)
- **Generación de Imágenes**: Los administradores pueden generar imágenes realistas para nuevos productos mediante IA si no cuentan con una URL, optimizando el catálogo visual.

### 📶 Logística e IoT Integrada
- **Monitoreo IoT**: Cada producto incluye metadatos de sensores (estado online/offline) y eficiencia energética.
- **Seguimiento en Tiempo Real**: Los pedidos de los usuarios cuentan con estados logísticos actualizados mediante telemetría simulada.

### 📊 Gestión y Analítica (Solo Admins)
- **Monitor de Ventas**: Gráficos interactivos de tendencias de ventas de los últimos 7 días.
- **Control de Inventario**: Gestión completa (CRUD) de suministros con alertas de stock crítico.
- **Gestión de Roles**: Panel maestro para promover o degradar usuarios entre los rangos de *Socio* y *Administrador*.

### 🛒 Flujo de Compra Moderno
- **Carrito Inteligente**: Selección rápida de productos con revisión en hoja lateral.
- **Simulación de Pagos**: Integración visual con métodos de pago populares como Nequi y pagos contra entrega.

## 🛠️ Stack Tecnológico

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 18](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/).
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/) (Iconos).
- **Backend as a Service**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage).
- **IA**: [Genkit](https://firebase.google.com/docs/genkit) con Google Gemini.
- **Gráficos**: [Recharts](https://recharts.org/).

## 📋 Requisitos Previos

Asegúrate de tener configuradas las siguientes variables de entorno en tu archivo `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_ADMIN_EMAIL=admin@ferretools.com
GEMINI_API_KEY=tu_clave_de_google_ai
```

## 🛠️ Instalación y Desarrollo

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---
Desarrollado con ❤️ para el futuro de la logística industrial.