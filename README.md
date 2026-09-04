# AutoColección

[![CI](https://github.com/danteferrer/ingsoft3-tp01/actions/workflows/ci.yml/badge.svg)](https://github.com/danteferrer/ingsoft3-tp01/actions/workflows/ci.yml)

Gestor de colección personal de autos. CRUD simple de autos y marcas: backend en
Node/Express + Postgres, frontend en React + Vite, todo dockerizado (nginx sirve
los estáticos del frontend y hace de proxy hacia el backend).

## Arranque desde cero

Requiere Docker y Docker Compose. No hace falta instalar Node, Postgres ni nada
más en la máquina.

```bash
git clone https://github.com/danteferrer/ingsoft3-tp01.git
cd ingsoft3-tp01
cp .env.example .env
docker compose up -d --build
```

La app queda disponible en:

- Frontend: http://localhost:3000
- Backend (API): http://localhost:8080

## Variante: imágenes publicadas (sin construir nada)

Si preferís bajar las imágenes ya publicadas en GitHub Container Registry en vez
de construirlas localmente:

```bash
cp .env.example .env
docker compose -f docker-compose.registry.yml up -d
```

## Apagar

```bash
docker compose down       # apaga los contenedores, conserva los datos
docker compose down -v    # apaga los contenedores y borra el volumen de la base (datos incluidos)
```

## Estructura del proyecto

```
ingsoft3-tp01/
├── backend/                     # API REST (Node + Express + Sequelize)
│   ├── src/
│   │   ├── models/                  (Marca, Auto)
│   │   ├── routes/                  (autos.js, marcas.js)
│   │   ├── controllers/
│   │   ├── db.js
│   │   └── index.js
│   └── Dockerfile
├── frontend/                    # SPA (React + Vite)
│   ├── src/
│   │   ├── api/
│   │   └── components/              (ListaAutos, FormularioAuto, FiltroMarca)
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml           # build local de las imágenes
├── docker-compose.registry.yml  # usa las imágenes publicadas en ghcr.io
└── .env.example
```

## Endpoints de la API

| Método | Ruta            | Descripción                                    |
|--------|-----------------|-------------------------------------------------|
| GET    | /health         | Chequeo de salud, responde `{"status":"ok"}`     |
| GET    | /api/marcas     | Lista las marcas                                 |
| POST   | /api/marcas     | Crea una marca                                   |
| GET    | /api/autos      | Lista los autos (filtro opcional `?marcaId=`)    |
| GET    | /api/autos/:id  | Trae un auto puntual                             |
| POST   | /api/autos      | Crea un auto                                     |
| PUT    | /api/autos/:id  | Actualiza un auto                                |
| DELETE | /api/autos/:id  | Elimina un auto                                  |
<!-- demo strict: PR B -->
