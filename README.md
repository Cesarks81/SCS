<div align="center">

# SCS — Sistema de Control de Suministros

**Plataforma full-stack de gestión de inventario y almacenes**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor%203.4+-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

[Demo en vivo](https://scs-foafjil5r-cesarks81-4647s-projects.vercel.app) · [Reportar un bug](https://github.com/Cesarks81/SCS/issues) · [Solicitar una función](https://github.com/Cesarks81/SCS/issues)

</div>

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Instalación y configuración](#instalación-y-configuración)
- [Variables de entorno](#variables-de-entorno)
- [Uso](#uso)
- [API Reference](#api-reference)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)

---

## Descripción

SCS es una aplicación web full-stack para la gestión integral de inventario y almacenes. Permite registrar productos, controlar niveles de stock, registrar movimientos de entrada y salida, administrar múltiples almacenes y generar reportes exportables en Excel y PDF — todo en tiempo real con una interfaz moderna y responsive.

---

## Características

### Inventario
- Alta, edición y baja de productos con atributos personalizados
- Dos tipos de producto: **individual** (con número de serie) y **contable** (a granel)
- Asignación de imagen y emoji por producto
- Estados de producto: `Óptimo`, `En reparación`, `Asignado`, `De baja`
- Control de stock mínimo, máximo y de seguridad

### Movimientos de stock
- Registro de entradas y salidas con motivo
- Validación en tiempo real (no permite retirar más del stock disponible)
- Historial completo de movimientos por producto

### Almacenes
- Creación y gestión de múltiples almacenes con ubicación
- Eliminación segura (bloquea si hay productos asignados)

### Estadísticas y reportes
- Dashboard con KPIs de inventario en tiempo real
- Visualización de movimientos y niveles de stock
- **Exportación a Excel (.xlsx)** con columnas formateadas
- **Exportación a PDF** con tablas y cabeceras

### Seguridad
- Autenticación con JWT (tokens de acceso)
- Contraseñas hasheadas con bcrypt
- Rutas protegidas en frontend
- Confirmación antes de cerrar sesión

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend framework | React | 19.x |
| Build tool | Vite | 8.x |
| Estilos | Tailwind CSS | 4.x |
| Routing frontend | React Router DOM | 7.x |
| Exportación PDF | jsPDF + jsPDF-autotable | 4.x / 5.x |
| Exportación Excel | XLSX (SheetJS) | 0.18.x |
| Backend framework | FastAPI | 0.115.x |
| Servidor ASGI | Uvicorn | 0.30.x |
| Base de datos | MongoDB (async) | — |
| Driver MongoDB | Motor | 3.4.x |
| Validación datos | Pydantic v2 | 2.7.x |
| Autenticación | python-jose + passlib | — |
| Despliegue | Vercel | — |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      Cliente (Browser)                  │
│              React 19 + Vite + Tailwind CSS             │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / REST API
┌───────────────────────▼─────────────────────────────────┐
│                 Backend (FastAPI + Uvicorn)              │
│   Módulos: auth | products | warehouses | movements     │
│   Patrón: Router → Service → Repository                 │
└───────────────────────┬─────────────────────────────────┘
                        │ Motor (async)
┌───────────────────────▼─────────────────────────────────┐
│                   MongoDB (Atlas / local)                │
│    Colecciones: users | products | warehouses | movements│
└─────────────────────────────────────────────────────────┘
```

El backend sigue un patrón de **módulos por dominio** (Router → Service → Repository), lo que desacopla la lógica de negocio del acceso a datos. Todas las operaciones de base de datos son **asíncronas** gracias a Motor.

---

## Requisitos previos

- **Node.js** ≥ 18.x y **npm** ≥ 9.x
- **Python** ≥ 3.10
- **MongoDB** — instancia local o [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud gratuito)

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Cesarks81/SCS.git
cd SCS
```

### 2. Configurar el backend

```bash
cd scs-backend

# Crear y activar entorno virtual
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo de variables de entorno (ver sección siguiente)
cp .env.example .env   # o crea .env manualmente

# Iniciar servidor en modo desarrollo
uvicorn main:app --reload
```

El backend queda disponible en `http://localhost:8000`.  
La documentación interactiva (Swagger UI) en `http://localhost:8000/docs`.

### 3. Configurar el frontend

```bash
cd ../scs-frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

---

## Variables de entorno

Crea el archivo `scs-backend/.env` con las siguientes variables:

```env
# Conexión a MongoDB
MONGODB_URL=mongodb+srv://<usuario>:<contraseña>@cluster.mongodb.net/
DB_NAME=scs_db

# JWT
SECRET_KEY=cambia_esto_por_una_clave_segura_y_larga
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> **Nota de seguridad:** Nunca subas el archivo `.env` al repositorio. Está incluido en `.gitignore`.

---

## Uso

### Registro e inicio de sesión

1. Accede a la aplicación y crea una cuenta con tu nombre, correo y contraseña.
2. Inicia sesión — recibirás un token JWT que se almacena en el cliente.

### Gestión de almacenes

Antes de crear productos, crea al menos un almacén desde el panel principal (icono de almacén en la barra lateral). Cada almacén tiene nombre y ubicación.

### Gestión de productos

- Haz clic en **"+"** para añadir un producto.
- Completa el formulario: modelo, categoría, tipo, almacén asignado, niveles de stock y atributos personalizados.
- Puedes subir una imagen o asignar un emoji al producto.

### Movimientos de stock

- Abre el detalle de un producto y usa los botones **Entrada** / **Salida**.
- Indica la cantidad y el motivo. El sistema validará que no haya stock insuficiente.

### Estadísticas y exportación

- Navega a la pestaña **Estadísticas** para ver KPIs y gráficos.
- Usa los botones **Exportar Excel** o **Exportar PDF** para descargar el reporte actual.

---

## API Reference

La API completa está documentada automáticamente por FastAPI en `/docs` (Swagger UI) y `/redoc`.

### Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registrar nuevo usuario |
| `POST` | `/api/auth/login` | Iniciar sesión, retorna JWT |

### Productos

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/products` | Listar productos (filtros: `category`, `warehouse_id`) |
| `GET` | `/api/products/{id}` | Obtener producto por ID |
| `POST` | `/api/products` | Crear producto |
| `PUT` | `/api/products/{id}` | Actualizar producto |
| `DELETE` | `/api/products/{id}` | Eliminar producto |

### Almacenes

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/warehouses` | Listar almacenes |
| `GET` | `/api/warehouses/{id}` | Obtener almacén por ID |
| `POST` | `/api/warehouses` | Crear almacén |
| `DELETE` | `/api/warehouses/{id}` | Eliminar almacén (eliminación segura) |

### Movimientos

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/movements` | Registrar movimiento (entrada/salida) |
| `GET` | `/api/movements/{product_id}` | Historial de movimientos de un producto |

### Sistema

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado de la conexión a MongoDB |
| `GET` | `/` | Información general de la API |

> Los endpoints protegidos requieren el header `Authorization: Bearer <token>`.

---

## Estructura del proyecto

```
SCS/
├── scs-backend/                 # API en Python / FastAPI
│   ├── core/
│   │   ├── config.py            # Configuración y variables de entorno
│   │   └── security.py          # JWT y hashing de contraseñas
│   ├── db/
│   │   └── mongodb.py           # Cliente MongoDB asíncrono
│   ├── modules/
│   │   ├── auth/                # Módulo de autenticación
│   │   ├── products/            # Módulo de productos
│   │   ├── warehouses/          # Módulo de almacenes
│   │   └── movements/           # Módulo de movimientos
│   ├── main.py                  # Entrada de la aplicación FastAPI
│   └── requirements.txt
│
├── scs-frontend/                # SPA en React / Vite
│   └── src/
│       ├── components/          # Componentes reutilizables (modales, imágenes)
│       ├── pages/               # Páginas (Login, Estadísticas)
│       ├── services/
│       │   └── api.js           # Cliente HTTP centralizado
│       ├── utils/
│       │   └── exportReport.js  # Exportación a Excel y PDF
│       └── App.jsx              # Vista principal de inventario
│
└── vercel.json                  # Configuración de despliegue en Vercel
```

---

## Despliegue

El proyecto está configurado para desplegarse en **Vercel** con un único `vercel.json` que gestiona tanto el frontend (build estático) como el backend (serverless Python).

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar desde la raíz del proyecto
vercel --prod
```

Asegúrate de configurar las [variables de entorno](#variables-de-entorno) en el dashboard de Vercel antes del primer despliegue.

---

<div align="center">

Desarrollado por [César Ramos Morón](https://github.com/Cesarks81)

</div>
