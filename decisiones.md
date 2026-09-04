# Decisiones — TP1

## TP1

### 1. Por qué Git no pudo resolver el conflicto solo

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

### 2. Problemas que encontré y cómo los solucioné

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

### 3. Declaración de uso de IA

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

**`healthcheck` vs. `depends_on`:**

Son dos cosas distintas que se complementan. `depends_on` solo controla el **orden de
arranque** de los contenedores — sin nada más, `docker compose up` levantaría `db` y
`backend` casi al mismo tiempo, y `backend` fallaría al conectarse porque Postgres
todavía no terminó de inicializar (el proceso de Postgres arranca mucho antes de que
esté listo para aceptar conexiones). `healthcheck` es lo que define **qué significa
"estar listo"** para un contenedor — en este caso, `pg_isready` corriendo cada 5
segundos dentro de `db`. La combinación que realmente resuelve el problema es
`depends_on: db: condition: service_healthy`: eso hace que `backend` no arranque
recién cuando el contenedor de `db` existe, sino cuando su `healthcheck` ya dio OK.
Sin el `healthcheck`, `depends_on` a secas solo garantiza orden, no que el servicio
del que dependés ya pueda responder.

**Dónde viven los secretos:**

Lo único realmente secreto de este proyecto es `DB_PASSWORD`. Vive en `backend/.env`
y en el `.env` de la raíz (los dos gitignored), y llega al compose y al backend como
variable de entorno (`${DB_PASSWORD}`). Lo que sí se commitea es `.env.example`, con
un valor de ejemplo (`super-secreto-local`) que documenta qué variable hace falta,
sin exponer ninguna contraseña real. El resto de la configuración de conexión
(`DB_NAME`, `DB_USER`, `DB_HOST`, `DB_PORT`) no es secreta, así que queda fija
directamente en el compose — no tiene sentido esconder algo que no compromete nada
si se ve.

Por qué importa tanto: mi repo es público (requisito de la materia), así que
cualquier valor commiteado ahí queda expuesto para siempre, aunque lo borre en un
commit posterior — sigue en el historial de Git, navegable por cualquiera. Hay bots
recorriendo GitHub 24/7 buscando exactamente ese patrón (credenciales committeadas
por error); no es un riesgo teórico. La disciplina de no commitear `.env` empieza
acá y sigue: en TP4 estos secretos se mudan a la configuración cifrada de GitHub
Actions (para cuando el pipeline necesite hablar con un servicio externo), y en TP9
se agrega un scanner que directamente bloquea el push si detecta un secreto.

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

## TP3 — Planificación y trazabilidad

### Duración del sprint

Elegí un sprint de **1 semana (28/8 al 4/9)**, alineado exactamente con la ventana
hasta la defensa P1 (que cubre TP1 a TP4). No tiene sentido medir avance de un sprint
más largo si para el 4/9 ya tengo que llegar con TP3 y TP4 terminados y defendibles —
y uno más corto (de un par de días) no alcanza para trabajo real entre sesiones. La
fecha límite de la materia terminó siendo, en este caso, el límite natural del sprint.

### Límite de WIP

Configuré el límite de la columna "In Progress" en **2**, siguiendo la recomendación
base de la guía (cantidad de personas + 1; trabajando solo, eso da 2). La razón para
no dejarlo más alto: trabajo solo, así que si tengo más de dos cosas "en curso" a la
vez es porque en realidad las estoy dejando a medias para arrancar otra — el límite
fuerza a cerrar lo que ya empecé antes de abrir algo nuevo (por ejemplo, no arrancar
una segunda tarea de la historia de CI sin haber mergeado la primera). Si en la
práctica nunca llego a ocupar las dos columnas, es señal de que el límite quedó alto
y lo bajaría a 1.

### Diagnóstico de una historia mal escrita

El ejemplo típico ("Como desarrollador quiero crear tabla usuarios") está mal escrita
porque es una tarea técnica disfrazada de historia: el "usuario" ahí es quien
programa, no quien recibe valor de negocio, y no tiene un beneficio verificable más
allá de la implementación en sí misma. Se corrige reformulándola desde el valor que
recibe alguien real — por ejemplo: "Como usuario de AutoColección quiero que mis
autos queden guardados de forma persistente, para no perder la información si se
reinicia el sistema" — ahí sí hay un rol que recibe beneficio, una capacidad
concreta, y un resultado medible (los datos siguen ahí después de un reinicio).

### Estructura armada

- **Épica** #13 — "Pipeline DevOps completo para mi app", sin criterios de aceptación propios.
- **Historia** #14 — "CI: build y tests automáticos en cada PR", con 5 criterios de aceptación verificables, vinculada a la épica como sub-issue nativo de GitHub.
- **Tareas** #15 y #16 — derivadas de la historia, vinculadas como sub-issues de la historia.
- **Bug** #17 — documentado y cerrado al costado de la jerarquía (no colgado de la historia): el mensaje genérico `"Validation error"` de Sequelize que ya habíamos encontrado y arreglado en TP2, referenciando el commit real que lo corrigió.
- **Sprint** "Sprint 1" (28/8–4/9), con la historia y sus dos tareas asignadas.
- **Tablero**: columnas Todo / In Progress / Done, con la automatización nativa de GitHub Projects que mueve un ítem a Done cuando se cierra su issue (verificado con el bug #17: se cerró y pasó a Done solo, sin tocar nada a mano).

### Trazabilidad: tarea → PR → commit → historia → épica

Implementé la tarea #15 (escribir el workflow de CI) en un PR real (#18), con
`Closes #15` en la descripción. Al mergearlo:
- la tarea #15 quedó cerrada, con el PR #18 referenciado como lo que la cerró,
- el PR trae el commit que agrega `.github/workflows/ci.yml`,
- desde la tarea se navega a la historia #14, y desde ahí a la épica #13.

La segunda tarea (#16, el badge del README) queda abierta a propósito — la historia
sigue viva, el trabajo continúa en TP4.

### Problemas encontrados y cómo los resolví

1. **Push rechazado por falta de scope `workflow` en el token de `gh`.** Al intentar
   pushear la rama con el nuevo `.github/workflows/ci.yml`, GitHub rechazó el push:
   "refusing to allow a Personal Access Token to create or update workflow ... without
   `workflow` scope". El login inicial de `gh` solo pedía `repo` y `project`. Lo
   resolví con `gh auth refresh --scopes "repo,project,workflow"`.
2. **Git seguía usando el token viejo después del refresh.** Aun con el scope nuevo
   ya emitido, el push seguía fallando con el mismo error, porque el credential
   helper de Git (`osxkeychain`) tenía cacheada la credencial anterior. Lo resolví
   invalidándola con `git credential reject` y corriendo `gh auth setup-git` para que
   Git tomara la credencial actualizada.
3. **La API de iteraciones de Projects exige un `title` no documentado a simple
   vista.** Al crear el campo "Sprint" (tipo `ITERATION`) por GraphQL, la primera
   llamada falló pidiendo un campo `title` dentro de cada iteración — no alcanza con
   `startDate` y `duration`. El mensaje de error de la propia API fue lo que lo dejó
   claro.
4. **El límite de WIP y las automatizaciones del tablero no tienen mutación pública
   en la API de Projects.** Confirmé por introspección de GraphQL que solo existe
   `deleteProjectV2Workflow`, sin `create`/`update` equivalente — esa configuración
   específica (el número del límite en la columna "In Progress") hay que dejarla para
   la interfaz web, no se puede automatizar por completo.

### Declaración de uso de IA

Usé Claude Code para: escribir el contenido de la épica, la historia (con sus
criterios de aceptación siguiendo INVEST), las dos tareas y el bug; crear todo eso en
GitHub vía `gh` y la API de GraphQL (issues, labels, sub-issues nativos, el Project,
el campo de Sprint, la asignación de ítems); y escribir el workflow de CI de la tarea
#15, junto con el PR que la cierra.

Verifiqué cada pieza con comandos reales, no dándola por hecha: confirmé la jerarquía
de sub-issues consultando la API, confirmé que la automatización "cerrado → Done"
funcionaba de verdad cerrando el bug #17 y mirando que el tablero lo reflejara solo, y
confirmé que el PR #18 quedó en verde (`gh pr checks`) antes de mergearlo. Las
decisiones de contenido (qué bug documentar, cómo redactar la historia para que
cumpliera INVEST, la duración del sprint y el número de WIP) las tomé yo, con la
justificación de cada una escrita arriba.

## TP4 — CI: Pipelines as Code

### Por qué esos jobs, y por qué en paralelo

Dos jobs, uno por Dockerfile: `build-backend` y `build-frontend`. No inventé un
tercer job ni until forzado a compartir uno solo — cada imagen tiene su propio
contexto de build, sus propias dependencias y su propio Dockerfile, así que tiene
sentido que cada uno viva en su propia máquina de CI. Al no declarar una dependencia
entre ellos (`needs:`), GitHub Actions los corre en paralelo por defecto: no hay
ninguna razón para que el build del frontend espere a que termine el del backend, o
viceversa — son artefactos independientes. Correr en paralelo también acorta el
tiempo total del pipeline a la mitad, aproximadamente (ambos tardan ~20-50s cada
uno, corriendo al mismo tiempo en vez de uno detrás del otro).

Lo que **no** comparten entre sí: el filesystem del runner (cada job arranca en una
máquina limpia y hace su propio `checkout`), y el cache de capas de Docker — cada
uno usa su propio `scope` (`backend` / `frontend`) precisamente para no pisarse.

**Por qué dos triggers (`pull_request` y `push`), no uno solo:**

Cada uno cumple un propósito distinto y ninguno reemplaza al otro. `pull_request`
corre **antes** del merge, sobre un merge de prueba que arma GitHub al vuelo (mi
rama combinada con `main`) — es el que realmente frena algo, ataja el error antes
de que contamine `main`. `push` a `main` corre **después**, cuando ya es tarde
para frenar nada, pero cumple dos funciones distintas: alimenta el badge (que
siempre lee la última corrida de `main`), y deja el cache de capas guardado en
`main` para que lo aprovechen todos los PRs que arranquen desde ahí después — un
PR solo puede leer el cache de su propia rama y el de la rama a la que apunta, así
que si `main` nunca corriera con `push`, ningún PR nuevo tendría cache de dónde
partir.

### Qué cachea, y qué pasa si el cache desaparece

Cachea las capas de la imagen Docker de cada etapa del build (`cache-from`/
`cache-to` con `type=gha`), no el código fuente ni `node_modules` directamente —
eso ya lo cachean las capas del propio Dockerfile (la capa de `COPY package*.json`
+ `RUN npm ci` solo se reinstala si cambia el `package.json`). El cache es puramente
una optimización de velocidad: si desaparece (por ejemplo, si GitHub lo purga por
antigüedad, o es la primera corrida), el pipeline no se rompe — Buildx simplemente
reconstruye todas las capas desde cero, tarda más, pero el resultado es idéntico.
Lo verifiqué de forma indirecta: la primera corrida del workflow (sin cache previo)
y las siguientes (con cache) dieron el mismo resultado, solo que las siguientes
corren más rápido.

Esas dos líneas de cache no alcanzan solas: necesitan `docker/setup-buildx-action`
un paso antes. El constructor de Docker que viene de fábrica guarda las capas
puertas adentro del propio runner y no sabe exportarlas a ningún lado — como el
runner se destruye al terminar la corrida, guardarlas ahí no serviría de nada.
Buildx es el que sabe mandar las capas al almacén de GitHub Actions (`type=gha`)
y traerlas de vuelta. Si falta ese paso, el build ni arranca: falla con un error
que dice explícitamente que el constructor de fábrica no sabe exportar cache —
uno de los pocos errores que te dicen exactamente qué falta, en vez de dejarte
adivinando.

### Por qué construye con el Dockerfile en vez de compilar directo

Porque así el pipeline verifica exactamente el mismo artefacto que después se
publica y se corre en producción — el mismo `Dockerfile` que ya usamos en TP2 y
TP3 para levantar el sistema. Si en cambio el workflow corriera `npm run build`
suelto (como hacía la primera versión del pipeline, la de TP3), podría pasar que el
build "a mano" funcionara pero el `Dockerfile` tuviera un problema propio (una
etapa mal armada, una dependencia que falta en la imagen final) que solo se
detectaría recién al invocar `docker build` — más tarde y en otro lugar. Construir
con el Dockerfile en CI hace que ese sea el único camino de verdad, sin dos formas
de "compilar" que puedan divergir entre sí.

### El gate en acción: rojo → bloqueado → fix → verde

Configuré `required_status_checks` en la protección de `main` exigiendo
`build-backend` y `build-frontend`, con `strict: true` (la rama del PR tiene que
estar actualizada contra `main` para poder mergear). Lo demostré en el
[PR #21](https://github.com/danteferrer/ingsoft3-tp01/pull/21): rompí a propósito
un import en `App.jsx` (`import x from './no-existe'`, el mismo ejemplo del
enunciado) → `build-frontend` falló y GitHub marcó el PR como `BLOCKED`
(confirmado con `gh pr view --json mergeStateStatus`, no solo mirando la UI) →
un commit siguiente revirtió el import → los dos checks pasaron, el estado pasó a
`CLEAN` → mergeé. El historial de las dos corridas (la que falló y la que pasó)
queda visible en la pestaña Actions y en el propio PR.

**Por qué rompí el frontend y no el backend:** no es arbitrario — depende de si el
stack tiene un paso de compilación/empaquetado real. El frontend (React + Vite)
sí lo tiene: `npm run build` falla en el momento si hay un import roto, así que
ese error aparece justo cuando `docker build` corre esa capa. El backend
(Node/Express plano, sin bundler) no tiene ese paso — un `require`/`import` a un
módulo inexistente ahí no rompe la imagen al construirla, porque nada la
"compila" de verdad; recién fallaría al **ejecutar** el contenedor
(`docker run`), que es un momento distinto y no lo que el gate de CI verifica.
Por eso el ejemplo del enunciado (un import roto) solo sirve como demostración
de gate en un stack con paso de build real, y en mi proyecto eso significaba
romperlo específicamente en el frontend.

**`strict: true` demostrado con dos PRs en paralelo:** además del PR #21, abrí
dos PRs al mismo tiempo desde el mismo commit de `main`
([#27](https://github.com/danteferrer/ingsoft3-tp01/pull/27) y
[#28](https://github.com/danteferrer/ingsoft3-tp01/pull/28)) para mostrar el
otro caso que cubre `strict`. Los dos llegaron a `CLEAN`. Mergeé el #27 →
`main` cambió. El #28, que ya tenía sus checks en verde, pasó a
`mergeable: CONFLICTING` — no solo "desactualizado": las dos ramas habían
tocado el final del mismo archivo (`README.md`), así que además del chequeo
vencido apareció un conflicto de merge real, con marcadores y todo (lo mismo
que en TP1). Lo resolví igual que entonces: traje `main` a la rama del PR
(`git merge origin/main`), edité el archivo para que quedaran las dos líneas
en vez de una, y comiteé la resolución. Recién ahí el pipeline volvió a correr
sobre la combinación real de las dos ramas, dio verde, el estado pasó a
`CLEAN` de nuevo, y mergeé. La verificación vieja del #28 no valía nada apenas
`main` cambió — tuvo que volver a probarse contra el `main` real antes de
poder entrar.

### Problemas encontrados y cómo los resolví

1. **El primer pipeline (de TP3) no era el pipeline de TP4.** Lo que había armado
   en TP3 solo corría `npm ci` y `npm run build`/chequeo de sintaxis — verificaba
   que el código de Node compilara, pero nunca construía la imagen Docker. TP4 pide
   específicamente que el pipeline construya con `docker/build-push-action`. Lo
   resolví reescribiendo el workflow entero en vez de parchear el anterior.
2. **`required_status_checks` no se podía actualizar con PATCH.** Al intentar
   activar los checks obligatorios con un PATCH directo al endpoint de
   `required_status_checks`, la API respondió 404 ("Required status checks not
   enabled") porque esa protección específica nunca había estado activada. Lo
   resolví mandando un PUT con la configuración completa de protección de rama
   (preservando lo que ya había: cero aprobaciones, `enforce_admins`, sin force
   push ni borrado), en vez de intentar parchear una pieza que todavía no existía.
3. **El badge, si se escribe mal, no navega a ningún lado útil.** El formato
   correcto es un link de dos partes: `[![CI](...badge.svg)](...actions/workflows/ci.yml)`
   — la imagen sola sin el link exterior se ve igual mirando el README, pero al
   clickearla no lleva al historial del workflow. Lo armé con las dos partes desde
   el principio, usando la URL real del repo.

### Declaración de uso de IA

Usé Claude Code para escribir el workflow de CI (ambas versiones: la de TP3 y la
reescritura real de TP4), configurar la protección de rama con los checks
obligatorios vía la API de GitHub, y armar la demostración del gate (romper el
import, abrir el PR, confirmar el bloqueo, arreglarlo, confirmar el desbloqueo y
mergear).

Verifiqué cada paso con comandos reales, no mirando solo la interfaz: confirmé que
el check fallara de verdad con `gh pr checks`, confirmé que el merge estuviera
bloqueado con `gh pr view --json mergeStateStatus` (no asumí que "se ve rojo" fuera
lo mismo que "está bloqueado"), y confirmé que la corrida en `main` después de
mergear terminara en verde con `gh run view`. La decisión de qué import romper y
dónde (el ejemplo textual del enunciado, en el frontend) y la de reescribir el
pipeline entero en vez de agregarle un tercer job al de TP3 las tomé yo.
