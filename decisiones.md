# Decisiones — TP1

## 1. Por qué Git no pudo resolver el conflicto solo

Las ramas `feature/titulo-a` y `feature/titulo-b` nacieron las dos desde `main`, sin
enterarse una de la otra, y cambiaron la misma línea del `README.md` (el título del
proyecto): una la dejó como "versión A" y la otra como "versión B". Git fusiona
automáticamente cuando los cambios tocan partes distintas del archivo, pero cuando
dos ramas modifican la misma línea no tiene forma de saber cuál de las dos versiones
es "la correcta" — eso es una decisión de contenido, no algo que se pueda resolver
con una regla mecánica. Por eso delega la decisión: marca el archivo con los
marcadores de conflicto y espera a que una persona elija qué queda.

Para que esto no hubiera pasado, alguna de las dos ramas tendría que haber integrado
los cambios de la otra antes de abrir su propio PR (por ejemplo, actualizándose
contra `main` después de que A se mergeó), o directamente no tocar la misma línea.

## 2. Problemas que encontré y cómo los solucioné

- **Pegar el `.gitignore` directo en la terminal en vez de en un archivo.** Al crear
  el archivo con `touch .gitignore` intenté pegar el contenido en la terminal en
  lugar de abrirlo en un editor, y zsh interpretó cada línea como un comando,
  tirando errores como `command not found`. Lo solucioné abriendo el archivo con
  `open -e .gitignore` (TextEdit) y pegando el contenido ahí adentro.

- **Las capturas no se dejaban subir desde la web de GitHub** (error "Something
  went really wrong, and we can't process that file"). En vez de seguir insistiendo
  con el uploader web, las subí por consola: creé una carpeta `img/` en el repo y
  usé `cp` para copiarlas ahí antes de hacer `git add`.

- **`cp` no encontraba los archivos aunque el nombre parecía correcto.** Al escribir
  el nombre completo de las capturas (con comillas o con `\` escapando los espacios),
  `cp` devolvía "No such file or directory" a pesar de que `ls -la` mostraba el
  archivo ahí. Probablemente algún carácter de espacio no coincidía exactamente al
  tipearlo. Lo resolví usando comodines (`Screenshot*4.37.01*.png`) para no depender
  de escribir el nombre completo a mano.

## 3. Declaración de uso de IA

Usé Claude como guía durante todo el TP: para que me explicara paso a paso cada
sección de la consigna, me ayudara a interpretar mensajes de error de la terminal
(el del `.gitignore`, el de "Something went really wrong" al subir capturas, y el
de `cp` no encontrando archivos), y me sugiriera los comandos a correr en cada
etapa. La ejecución de todos los comandos la hice yo en mi terminal, y verifiqué
cada paso mirando el resultado real: el estado del repo en GitHub después de cada
push, el contenido de los archivos con `cat`, y el listado de `img/` con `ls` antes
de commitear. Las decisiones de contenido (qué versión del conflicto dejar, cómo
nombrar las ramas y los archivos) las tomé yo.

## TP2 — Contenedores

### App elegida y por qué

Elegí armar un gestor de colección de autos (**AutoColección**) desde cero, en vez de
adaptar un proyecto open-source. Contra los criterios de la guía:

- **¿Buildea y corre localmente hoy, sin magia?** Sí — es chico a propósito: dos
  entidades (`Auto` y `Marca`) con una relación 1-a-muchos, CRUD completo. Lo probé local
  (sin Docker) antes de dockerizar nada.
- **¿Tengo o puedo escribirle tests?** Sí, la superficie es chica y bien delimitada
  (endpoints REST simples), así que en TP5 va a ser manejable agregarle tests.
- **¿Entiendo el código lo suficiente como para modificarlo?** Totalmente — lo escribí
  guiando a Claude Code paso a paso, revisando cada archivo antes de aceptarlo, no lo
  generé de una sola vez sin mirar.
- **Tamaño**: CRUD + 2-3 pantallas (listado con filtro, formulario de alta/edición,
  confirmación de borrado). Elegí no sumar autenticación ni funcionalidades extra a
  propósito, siguiendo el criterio de "más grande no suma nota, solo suma fricción".

### Decisiones de contenerización

**Stack:** Node/Express + Sequelize para el backend, React + Vite para el frontend,
PostgreSQL como base de datos.

**Imágenes base elegidas:**
- Backend: `node:22-alpine` en ambas etapas del multi-stage (no hace falta una imagen
  de runtime distinta como en .NET, porque Node no tiene una separación SDK/runtime tan
  marcada).
- Frontend: `node:22-alpine` para la etapa de build, `nginx:alpine` para servir los
  estáticos ya compilados.
- Base de datos: `postgres:16-alpine`.

**Estructura multi-stage:**
- **Backend**: una etapa `build` que instala todas las dependencias con `npm ci`, copia
  el código, y poda las devDependencies con `npm prune --omit=dev`. La etapa final copia
  desde ahí `package.json`, `node_modules` ya podado, y `src/`. Elegí podar en vez de
  hacer un segundo `npm ci` sin devDependencies en la etapa final porque evita instalar
  las dependencias de producción dos veces — se instalan una sola vez (con todo incluido)
  y se recorta lo que sobra, en vez de reinstalar desde cero.
- **Frontend**: etapa `build` que corre `npm ci && npm run build` (deja los estáticos
  compilados en `dist/`), etapa final que solo copia `dist/` dentro de una imagen de
  `nginx:alpine` limpia — el SDK de Node completo nunca llega a la imagen que corre en
  producción.

**Comparación de tamaño (imagen final vs. imagen base):**

En Node, a diferencia de .NET, la imagen base (`node:22-alpine`) ya es liviana de por sí
(229MB de disco / 58.5MB de contenido), así que la ganancia del multi-stage **no se ve
como una reducción de tamaño respecto a la base** —mi imagen final (`mi-backend:dev`)
pesa 265MB/62.1MB, un poco más que la base sola—. La ganancia real está en **qué no
viaja**: las devDependencies (`nodemon` y sus dependencias, usadas solo para desarrollo)
nunca llegan a la imagen que corre en producción, gracias al `npm prune --omit=dev` en
la etapa de build. Es una diferencia distinta a la de un lenguaje compilado como .NET,
donde el ahorro sí es notorio en tamaño (el SDK completo vs. solo el runtime).

**Qué persiste y qué no:**

Los contenedores son efímeros por diseño — se pueden recrear sin perder nada, **excepto**
lo que vive en el volumen nombrado `db_data`, montado en
`/var/lib/postgresql/data` dentro del contenedor de la base. Verifiqué explícitamente
esta separación con una prueba de tres pasos:
1. Creé un auto, hice `docker compose down` (sin `-v`) y `up` de nuevo → el auto seguía
   en la base.
2. Repetí, esta vez con `docker compose down -v` → el auto desapareció, porque `-v`
   también borra el volumen.

Esto confirma que el estado real de la aplicación vive únicamente en el volumen de
Postgres, no en los contenedores de `backend` o `frontend`, que pueden destruirse y
recrearse en cualquier momento sin pérdida de datos.

**Comunicación entre servicios:**

`backend` y `frontend` se comunican con `db` por nombre de servicio (`Host=db` en la
connection string del backend), aprovechando el DNS interno que crea `docker compose`.
El `frontend` no le habla directamente al `backend` desde el navegador — el navegador
solo conoce rutas relativas (`/api/...`); es **nginx**, corriendo dentro del contenedor
del frontend, quien traduce esas rutas hacia `http://backend:8080` mediante un proxy
inverso. Elegí específicamente resolver el nombre `backend` con una **variable en el
`proxy_pass`** más un `resolver 127.0.0.11` (el DNS embebido de Docker), en vez de
escribir `backend:8080` directo en el `proxy_pass`. La diferencia importa: con el nombre
fijo, nginx resuelve el DNS **una sola vez, al arrancar**, y si el contenedor `backend`
todavía no existe en ese momento, nginx se niega a levantar. Con la variable, la
resolución queda diferida a cada request — así el contenedor del `frontend` puede
levantar solo, sin depender de que `backend` ya exista. Lo comprobé explícitamente:
corrí el contenedor del frontend suelto, sin ningún backend en la red, y levantó sin
quejarse (mostrando la interfaz, aunque el listado fallara por falta de datos, como se
esperaba).

### Problemas encontrados y cómo los resolví

1. **Pérdida de trabajo por confusión de carpetas de trabajo.** En un momento del TP, el
   repositorio terminó clonado en dos rutas distintas de mi máquina sin que me diera
   cuenta (una que usaba yo en la terminal, otra donde estaba trabajando Claude Code).
   Un tramo entero de código del backend (modelos, controladores, rutas) se escribió en
   disco pero nunca llegó a commitearse, y se perdió al no coincidir las carpetas.
   Lo detecté comparando `git log --stat` de un commit contra lo que realmente había en
   el disco (`find backend/src -type f` no devolvía nada, a pesar de que el mensaje del
   commit decía "inicializa backend... modelos Auto/Marca"). Lo resolví identificando la
   carpeta correcta con `pwd` y `git remote -v` desde ambos lados, y rehaciendo el
   trabajo perdido — esta vez separándolo en **commits chicos después de cada tarea**, en
   vez de acumular varias tareas sin guardar, justamente para que un percance similar no
   volviera a costar tanto.
2. **Puerto ocupado al probar el contenedor del backend.** El primer `docker run` del
   backend falló con `address already in use`, porque el servidor en modo desarrollo
   (dejado corriendo en background durante las pruebas anteriores) todavía ocupaba el
   puerto 8080. Lo resolví liberando el puerto con `kill $(lsof -ti:8080 -sTCP:LISTEN)`
   antes de correr el contenedor.
3. **El `.env` desapareció sin avisar.** En algún punto, al validar la sintaxis de un
   archivo de compose, el `.env` real se borró por accidente (probablemente al limpiar
   un `.env` temporal usado solo para esa validación). Docker no falló de forma ruidosa:
   solo mostró un warning (`The "DB_PASSWORD" variable is not set`) y siguió con la
   contraseña vacía. El síntoma real apareció recién después, como una conexión
   rechazada entre el backend y la base.
4. **PostgreSQL fija la contraseña la primera vez que inicializa su volumen.** Como
   consecuencia directa del problema anterior: una vez que el volumen de la base se creó
   con la contraseña vacía, simplemente arreglar el `.env` y reiniciar (`down` sin `-v`)
   no alcanzó — Postgres ignora la variable de entorno después de la primera
   inicialización. Tuve que borrar el volumen con `down -v` para que se recreara desde
   cero con la contraseña correcta, perdiendo los datos de prueba que tenía cargados
   (aceptable, porque eran datos descartables).
5. **Falsos negativos por timing al probar con `curl`.** Más de una vez, un `curl`
   corrido justo después de levantar un contenedor devolvió "Connection reset by peer",
   a pesar de que los logs del contenedor mostraban que el servidor había arrancado sin
   errores. En ambos casos, esperar unos segundos y reintentar confirmó que el sistema
   funcionaba bien — el contenedor solo necesitaba un instante más para terminar de abrir
   el socket de escucha.
6. **Mensajes de error genéricos de Sequelize.** Al validar la restricción de patente
   única, el backend devolvía el mensaje genérico "Validation error" en vez de algo
   entendible desde el formulario. Lo resolví agregando una función `mensajeError()` en
   los controladores, que arma un mensaje legible a partir del array `error.errors` que
   expone Sequelize (por ejemplo, "patente must be unique"), en vez de mostrar
   `error.message` a secas.
7. **Colisión de nombre de proyecto al probar el `README.md` en una carpeta temporal.**
   Al clonar el repo en una carpeta separada para probar el arranque desde cero (como
   pide la guía), la nueva carpeta tenía el mismo nombre (`ingsoft3-tp01`) que la
   carpeta de trabajo real. Docker Compose deriva el nombre del stack del nombre de la
   carpeta, así que el `docker compose up` de la prueba **reemplazó** los contenedores
   que ya tenía corriendo en mi carpeta principal, en vez de crear un stack
   independiente. No hubo pérdida de datos (el volumen de la base se reusó, no se
   recreó), pero fue una buena lección sobre cómo Compose nombra sus recursos: conviene
   clonar pruebas de este tipo en una carpeta con nombre distinto, o usar la opción
   `-p <nombre>` de compose para fijar explícitamente el nombre del proyecto.

### Declaración de uso de IA

Usé Claude (en el chat) y Claude Code (en el editor) durante todo el TP, de dos formas
distintas y complementarias:

- **Claude (chat):** para entender los conceptos de la guía antes de aplicarlos
  (multi-stage builds, healthchecks, volúmenes, el resolver de nginx), para coordinar
  conmigo los pasos que necesitaban ejecución manual de mi parte (levantar Postgres,
  correr `docker build`/`docker run`, probar con `curl`), y para diagnosticar los
  problemas de la lista anterior a medida que aparecían.
- **Claude Code:** para escribir el código del backend, el frontend, los Dockerfiles y
  el `docker-compose.yml`, siempre en tareas chicas y confirmadas una por una — nunca le
  pedí que avanzara varias fases de una sin que yo revisara el resultado intermedio.

Verifiqué el trabajo de dos formas: (1) revisando cada archivo generado antes de
aceptarlo, entendiendo qué hacía cada parte antes de seguir a la siguiente tarea, y
(2) probando todo con comandos reales (`curl`, `docker ps`, `docker logs`,
`docker compose ps`) en vez de confiar en que "compila" o en el resumen que reportaba
Claude Code — varios de los problemas de la sección anterior los encontré
justamente porque insistí en probar de verdad antes de dar una tarea por cerrada.
