# Evidencias — TP1

## 1. Push directo a main rechazado
![push rechazado](img/push-rechazado.png)
GitHub rechaza el push porque main está protegida y la regla alcanza también al dueño del repo.

## 2. Aviso de conflicto en el PR
![conflicto](img/conflicto.png)
El PR de la rama B no se puede mergear automáticamente porque toca la misma línea que ya mergeó la rama A.

## 3. Marcadores del conflicto
![marcadores](img/marcadores.png)
El editor de conflictos de GitHub mostrando los marcadores de conflicto en README.md.

## 4. Release v1.0.0 publicada
![release](img/release.png)
La release v1.0.0 publicada sobre el tag correspondiente.

# Evidencias — TP2 (Contenedores)

## 1. `docker compose up -d --build` desde cero, sistema funcionando end-to-end

![arranque desde cero](img/tp2-up-desde-cero.webp)
`docker compose up -d --build` construyendo ambas imágenes, levantando `db`
(healthy), `backend` y `frontend`, y `docker compose ps` mostrando los tres
servicios arriba.

## 2. Prueba de persistencia (`down` vs. `down -v`)

![prueba de persistencia](img/tp2-persistencia.webp)
Ciclo completo: cargo una marca (`Toyota`) → `docker compose down` (sin `-v`) →
`up` → `curl /api/marcas` sigue devolviendo la marca → `docker compose down -v`
→ `up` → `curl /api/marcas` devuelve `[]`. Confirma que el estado real de la
aplicación vive únicamente en el volumen nombrado `db_data` — los contenedores
de `backend` y `frontend` son descartables y recreables sin pérdida de datos;
el de `db` también lo es, siempre que no se borre el volumen con `-v`.

![detalle: falso negativo por timing](img/tp2-persistencia-detalle.webp)
Durante esta misma prueba me crucé con el problema descrito en `decisiones.md`
("Falsos negativos por timing al probar con `curl`"): justo después de un
`up`, un `curl` devolvió `Connection reset by peer` a pesar de que los
contenedores ya figuraban como `Started`/`Healthy` — el servidor todavía no
había terminado de abrir el socket. Reintentar unos segundos después confirmó
que el sistema funcionaba bien.

## 3. Comparación de tamaño: imagen SDK vs. imagen final

![comparación de tamaños](img/tp2-comparacion-tamanos.webp)
`docker images` filtrado a las imágenes relevantes: `mi-backend:v0.1.0`
(265MB), `mi-frontend:v0.1.0` (93.1MB) y `node:22-alpine` (229MB), la imagen
SDK usada en la etapa `build` de ambos Dockerfiles.

- **Frontend**: la imagen final (93.1MB) es prácticamente igual a `nginx:alpine`
  solo (93.6MB, verificado aparte con `docker pull nginx:alpine`). El SDK
  completo de Node (229MB), usado en la etapa `build` para correr
  `npm run build`, nunca llega a la imagen final — solo viajan los estáticos ya
  compilados de `dist/` (unos pocos KB).
- **Backend**: la imagen final (265MB) es más grande que `node:22-alpine` solo
  (229MB), a diferencia del frontend, porque el backend sí necesita el runtime de
  Node más `node_modules` de producción para correr. Acá la ganancia del
  multi-stage no es de tamaño sino de contenido: gracias a
  `npm prune --omit=dev` en la etapa de build, las devDependencies (`nodemon`)
  nunca llegan a la imagen final. Es la diferencia frente a un lenguaje
  compilado como .NET, donde el ahorro de tamaño entre SDK y runtime sí es
  notorio.

## 4. Imágenes publicadas en el registry, verificadas públicas

```
$ docker logout ghcr.io
Removing login credentials for ghcr.io

$ docker rmi ghcr.io/danteferrer/mi-backend:v0.1.0
$ docker pull ghcr.io/danteferrer/mi-backend:v0.1.0
v0.1.0: Pulling from danteferrer/mi-backend
Status: Downloaded newer image for ghcr.io/danteferrer/mi-backend:v0.1.0

$ docker rmi ghcr.io/danteferrer/mi-frontend:v0.1.0
$ docker pull ghcr.io/danteferrer/mi-frontend:v0.1.0
v0.1.0: Pulling from danteferrer/mi-frontend
Status: Downloaded newer image for ghcr.io/danteferrer/mi-frontend:v0.1.0
```

Ambas imágenes se descargaron sin estar logueado en `ghcr.io`, confirmando que
los packages `mi-backend` y `mi-frontend` son públicos.
