# Decisiones — TP1

## Enlaces de este TP (TP6)

- Paquetes públicos: [backend](https://github.com/danteferrer/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend), [frontend](https://github.com/danteferrer/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend)
- Cadena: [PR con el login a GHCR salteado](https://github.com/danteferrer/ingsoft3-tp01/actions/runs/39133330335) · [corrida de `main` con "publicar" como último paso](https://github.com/danteferrer/ingsoft3-tp01/actions/runs/39133423938)
- Entornos: [QA](https://front-qa-5udf.onrender.com) · [PROD](https://front-prod-pdou.onrender.com)

## TP1

### 1. Por qué Git no pudo resolver el conflicto solo

Dos ramas (`feature/titulo-a` y `feature/titulo-b`) salieron de `main` sin saber
una de la otra, y las dos cambiaron la misma línea del `README.md` (el título).
Git fusiona solo cuando los cambios tocan partes distintas del archivo; cuando
dos ramas tocan la misma línea, no puede decidir cuál versión vale, así que
marca el conflicto y espera que una persona elija.

Para evitarlo: alguna de las dos ramas debería haberse actualizado contra
`main` antes de abrir su PR, o directamente no tocar la misma línea.

### 2. Problemas que encontré y cómo los solucioné

- **Pegué el `.gitignore` en la terminal en vez de en un archivo.** zsh
  interpretó cada línea como comando. Lo resolví abriendo el archivo con
  `open -e .gitignore` y pegando ahí.
- **Las capturas no subían desde la web de GitHub.** Las subí por consola:
  las copié a una carpeta `img/` y las agregué con `git add`.
- **`cp` no encontraba archivos con nombres de captura.** Usé comodines
  (`Screenshot*4.37.01*.png`) en vez de tipear el nombre completo.

### 3. Declaración de uso de IA

Usé Claude como guía: me explicó la consigna y los errores de terminal, y me
sugirió los comandos. Los corrí yo y verifiqué cada paso (estado en GitHub,
`cat`, `ls`). Las decisiones de contenido las tomé yo.

## TP2 — Contenedores

### App elegida y por qué

Armé un gestor de colección de autos (**AutoColección**) desde cero: dos
entidades (`Auto` y `Marca`), relación 1-a-muchos, CRUD completo. Lo probé
local antes de dockerizar. Es chico a propósito — sin login ni funciones
extra, para no sumar fricción sin sumar nota.

### Decisiones de contenerización

**Stack:** Node/Express + Sequelize (backend), React + Vite (frontend),
PostgreSQL (base de datos).

**Imágenes base:** `node:22-alpine` para backend y para el build del
frontend, `nginx:alpine` para servir el frontend ya compilado,
`postgres:16-alpine` para la base.

**Multi-stage:**
- Backend: una etapa instala todo con `npm ci` y poda las devDependencies
  (`npm prune --omit=dev`); la etapa final solo copia `package.json`,
  `node_modules` ya podado y `src/`.
- Frontend: una etapa compila con `npm run build`; la etapa final copia
  solo `dist/` a un `nginx:alpine` limpio, sin el SDK de Node.

**Tamaño:** la imagen final del backend (265MB/62MB) no queda más chica que
la base (`node:22-alpine` ya es liviana), pero sí queda sin las
devDependencies de desarrollo — esa es la ganancia real, no el tamaño en sí.

**Qué persiste:** solo el volumen `db_data` (montado en Postgres). Lo probé:
creé un auto, `docker compose down` (sin `-v`) y `up` → seguía. Con `down -v`
→ desapareció. Backend y frontend son efímeros, la base no.

**Comunicación entre servicios:** backend y frontend hablan con `db` por
nombre de servicio (DNS interno de Docker). El navegador nunca le habla
directo al backend: nginx, adentro del contenedor del frontend, proxea
`/api/...` hacia `backend:8080`. Uso `resolver 127.0.0.11` + variable en el
`proxy_pass` en vez de poner `backend:8080` fijo, porque así nginx resuelve
el nombre en cada request y no al arrancar — el frontend puede levantar
aunque el backend todavía no exista. Lo probé corriendo el frontend solo,
sin backend en la red: levantó igual.

**`healthcheck` vs `depends_on`:** `depends_on` solo ordena el arranque de
los contenedores, no espera a que el servicio esté listo. `healthcheck`
define cuándo un contenedor está listo (acá, `pg_isready`). La combinación
`depends_on: db: condition: service_healthy` hace que el backend espere a
que Postgres pueda aceptar conexiones, no solo a que el contenedor exista.

**Secretos:** lo único secreto es `DB_PASSWORD`, en `backend/.env` y en el
`.env` de la raíz (ambos gitignored), pasado como variable de entorno. Se
commitea `.env.example` con un valor de ejemplo, para documentar qué
variable hace falta sin exponer nada real. El resto de la config de conexión
no es secreta y queda fija en el compose. Importa porque el repo es
público: cualquier secreto commiteado queda expuesto para siempre en el
historial, aunque se borre después.

### Problemas encontrados y cómo los resolví

1. **Perdí código por trabajar en dos carpetas distintas del repo sin darme
   cuenta.** Un tramo del backend se escribió en disco pero nunca se
   commiteó. Lo detecté comparando `git log --stat` contra lo que había
   realmente en disco. Lo rehice, esta vez con commits chicos después de
   cada tarea.
2. **Puerto ocupado al probar el backend.** El server de desarrollo seguía
   corriendo en background y ocupaba el 8080. Lo liberé con
   `kill $(lsof -ti:8080 -sTCP:LISTEN)`.
3. **El `.env` se borró sin avisar.** Docker solo tiró un warning
   (`DB_PASSWORD` no seteada) y siguió con la contraseña vacía; el síntoma
   real (conexión rechazada) apareció después.
4. **Postgres fija la contraseña la primera vez que crea su volumen.**
   Arreglar el `.env` y reiniciar no alcanzó — tuve que borrar el volumen
   (`down -v`) para que se recreara con la contraseña correcta.
5. **Falsos negativos de timing con `curl`.** Un `curl` justo después de
   levantar un contenedor a veces daba "Connection reset". Esperar unos
   segundos y reintentar confirmaba que andaba bien.
6. **Mensajes de error genéricos de Sequelize.** Agregué un helper
   `mensajeError()` que arma un mensaje legible desde `error.errors`, en vez
   de mostrar `error.message` a secas.
7. **Colisión de nombre de proyecto en Compose.** Cloné el repo en una
   carpeta de prueba con el mismo nombre que la carpeta real, y Compose
   (que nombra el stack por la carpeta) reemplazó los contenedores que ya
   tenía corriendo. No hubo pérdida de datos, pero aprendí a usar `-p` o
   nombres distintos para pruebas.
8. **Los contenedores corrían como root.** Ninguno de los dos Dockerfiles
   fijaba `USER`. En el backend alcanzó con `USER node`. En el frontend,
   `USER nginx` solo rompió en runtime (`Permission denied` en
   `/var/cache/nginx`), porque nginx necesita escribir ahí. Lo resolví
   cambiando el puerto a 8080 (no privilegiado) y agregando `chown` de esos
   directorios antes de bajar a `USER nginx`. Esto dejó desactualizadas las
   imágenes ya publicadas en `ghcr.io` (`v0.1.0`, todavía en el puerto 80
   viejo), así que publiqué `v0.1.1` y actualicé el compose de registry.

### Declaración de uso de IA

Usé Claude (chat) para entender los conceptos antes de aplicarlos y para
coordinar los pasos manuales, y Claude Code para escribir el backend, el
frontend, los Dockerfiles y el compose, en tareas chicas confirmadas una por
una. Verifiqué todo con comandos reales (`curl`, `docker ps`, `docker logs`)
en vez de asumir que "compila" significaba que andaba.

## TP3 — Planificación y trazabilidad

### Duración del sprint

Un sprint de 1 semana (28/8 al 4/9), alineado con la defensa de P1.

### Límite de WIP

Límite de 2 en "In Progress" (personas + 1, trabajando solo). Si nunca llego
a ocupar las dos columnas, lo bajaría a 1.

### Diagnóstico de una historia mal escrita

"Como desarrollador quiero crear tabla usuarios" es una tarea técnica
disfrazada de historia: no tiene un beneficio de negocio verificable. Mejor:
"Como usuario de AutoColección quiero que mis autos queden guardados de
forma persistente, para no perder la información si se reinicia el sistema."

### Estructura armada

- **Épica** #13 — "Pipeline DevOps completo para mi app".
- **Historia** #14 — "CI: build y tests automáticos en cada PR", con 5
  criterios de aceptación, sub-issue de la épica.
- **Tareas** #15 y #16 — sub-issues de la historia.
- **Bug** #17 — el mensaje genérico de Sequelize de TP2, documentado y
  cerrado al costado de la jerarquía.
- **Sprint** "Sprint 1" (28/8–4/9).
- **Tablero**: Todo / In Progress / Done, con automatización nativa
  cerrado→Done (verificada con el bug #17).

### Trazabilidad: tarea → PR → commit → historia → épica

La tarea #15 se implementó en el PR #18, con `Closes #15`. Al mergear: la
tarea se cerró, el PR quedó como lo que la cerró, y desde ahí se navega a la
historia #14 y a la épica #13. La tarea #16 queda abierta a propósito, para
TP4.

### Problemas encontrados y cómo los resolví

1. **Push rechazado por falta de scope `workflow` en el token de `gh`.** Lo
   resolví con `gh auth refresh --scopes "repo,project,workflow"`.
2. **Git seguía usando el token viejo después del refresh.** El credential
   helper tenía cacheada la credencial anterior. Lo resolví con
   `git credential reject` + `gh auth setup-git`.
3. **El campo Sprint (tipo `ITERATION`) exige un `title` por iteración**, no
   solo `startDate`/`duration` — lo indicó el propio error de la API.
4. **El límite de WIP no tiene mutación pública en la API de Projects.**
   Confirmé por introspección de GraphQL; esa parte se configura desde la
   interfaz web.

### Declaración de uso de IA

Usé Claude Code para redactar épica/historia/tareas/bug (siguiendo INVEST),
crearlos en GitHub vía `gh`/GraphQL, y escribir el workflow de CI de la
tarea #15. Verifiqué la jerarquía por API, la automatización cerrando el
bug #17 de verdad, y el PR #18 en verde antes de mergear.

## TP4 — CI: Pipelines as Code

### Por qué esos jobs, y por qué en paralelo

Dos jobs, `build-backend` y `build-frontend`, uno por Dockerfile — cada
imagen tiene su propio contexto y dependencias. Sin `needs:` entre ellos,
corren en paralelo por defecto, lo que además reduce el tiempo total del
pipeline a la mitad aproximadamente. No comparten filesystem del runner ni
cache (cada uno usa su propio `scope`).

**Por qué dos triggers (`pull_request` y `push`):** `pull_request` corre
antes del merge y es el que realmente frena algo. `push` a `main` corre
después, y sirve para el badge (que lee la última corrida de `main`) y para
dejar cache en `main`, que después aprovechan los PRs nuevos.

### Qué cachea, y qué pasa si el cache desaparece

Cachea las capas de Docker de cada build (`type=gha`), no el código fuente.
Si el cache desaparece, el pipeline no se rompe: Buildx reconstruye todo
desde cero, más lento pero con el mismo resultado. Necesita
`docker/setup-buildx-action` antes: el builder de fábrica no sabe exportar
cache a ningún lado (el runner se destruye al terminar), y sin ese paso el
build falla directamente.

### Por qué construye con el Dockerfile en vez de compilar directo

Así el pipeline verifica el mismo artefacto que después se publica y
corre, no un "build a mano" que podría divergir del `Dockerfile` real.

### El gate en acción: rojo → bloqueado → fix → verde

Configuré `required_status_checks` (backend + frontend) con `strict: true`
en `main`. Lo demostré en el
[PR #21](https://github.com/danteferrer/ingsoft3-tp01/pull/21): rompí un
import en `App.jsx` → `build-frontend` falló → PR bloqueado (confirmado con
`gh pr view --json mergeStateStatus`) → arreglé el import → los dos checks
pasaron → mergeé.

**Por qué rompí el frontend y no el backend:** el frontend tiene un paso de
build real (`npm run build`), así que un import roto falla ahí mismo. El
backend no tiene bundler — un import roto recién fallaría al ejecutar el
contenedor, no al construirlo, y eso no es lo que el gate de CI verifica.

**`strict: true` con dos PRs en paralelo:** abrí
[#27](https://github.com/danteferrer/ingsoft3-tp01/pull/27) y
[#28](https://github.com/danteferrer/ingsoft3-tp01/pull/28) desde el mismo
commit de `main`. Mergeé el #27 → `main` cambió. El #28 pasó a
`CONFLICTING`: las dos ramas tocaban el final del mismo `README.md`, así que
hubo conflicto real además del check vencido. Lo resolví igual que en TP1
(`git merge origin/main`, dejé las dos líneas, commit), el pipeline corrió
de nuevo sobre la combinación real, dio verde, y mergeé.

### Problemas encontrados y cómo los resolví

1. **El pipeline de TP3 no era el de TP4.** Solo corría `npm ci`/`npm run
   build`, nunca construía la imagen Docker. Reescribí el workflow entero.
2. **`required_status_checks` no se podía activar con PATCH** (404,
   "not enabled"). Lo resolví con un PUT con toda la config de protección
   de rama, no solo la pieza nueva.
3. **El badge sin el link exterior no navega a ningún lado.** El formato
   correcto es `[![CI](...badge.svg)](...actions/workflows/ci.yml)`.

### Declaración de uso de IA

Usé Claude Code para escribir el workflow de CI, configurar la protección
de rama, y armar la demo del gate. Verifiqué cada paso con comandos reales
(`gh pr checks`, `gh pr view --json mergeStateStatus`, `gh run view`), no
solo mirando la interfaz. Las decisiones de qué romper y dónde, y de
reescribir el pipeline en vez de parchearlo, las tomé yo.

## TP5 — Testing y calidad

**Qué testeo:** mi app no tenía reglas propias, así que agregué 3 al
backend: patente con formato válido, año en rango razonable, kilometraje no
negativo. Más la de patente duplicada (ya existía desde TP2), testeada con
un mock. Uso Vitest en los dos lados.

**Suite:** 8 tests en el backend (4 reglas), 9 en el frontend
(`formatearUltimoService` + `api/autos.js` con `fetch` mockeado). En los dos
lados hay un parametrizado, un caso de error y un mock.

**Umbral:** 80% líneas / 70% ramas, en los dos lados. Hoy mido más que eso
(backend 100/90, frontend 100/79), así que el umbral me frena si bajo, no es
un número copiado.

**Qué dejo afuera:** los controllers/API sin ninguna regla propia (solo
CRUD) — igual que se excluye el arranque de una app.

**Por qué cobertura alta no prueba nada:** un `validarKilometraje(5)` sin
`expect` sube el número igual y no comprueba nada.

**Rama sin cubrir:** `crearAuto` no testeaba el rechazo del backend. Entrada
que la cubre: una respuesta de error (ej. patente inválida). La agregué.

**PR bloqueado (la demostración):**
- Secuencia completa (rojo por cobertura → tests que faltaban → verde →
  merge): [PR #38](https://github.com/danteferrer/ingsoft3-tp01/pull/38).
- El freno vigente, abierto en rojo hasta la defensa:
  [PR #39](https://github.com/danteferrer/ingsoft3-tp01/pull/39).
- Corrida roja con el número exacto en el log:
  [run 38612976340](https://github.com/danteferrer/ingsoft3-tp01/actions/runs/38612976340)
  (`ERROR: Coverage for lines (72.72%) does not meet global threshold (80%)`).
- Resumen de cobertura visible + reporte descargable:
  [run 38611355829](https://github.com/danteferrer/ingsoft3-tp01/actions/runs/38611355829).

**Problemas que encontré:**
1. Mezclar `import` y `require` para el mismo módulo (`auto.js`) entre dos
   archivos de test partía la cobertura en dos instancias distintas — lo
   descubrí comparando correr un archivo solo vs. los dos juntos. Se
   resolvió usando `require` consistente en los dos.
2. `vi.mock` no interceptaba el modelo `Auto` en el controller → lo
   arreglé con `vi.spyOn` sobre el objeto real.
3. Montar el volumen justo en `coverage/` rompía el contenedor (Docker no
   deja borrar la raíz de un volumen) → el reporte va en una subcarpeta.
4. `marcasController`/`marcas.js` sin reglas hundían el número → los saqué
   de la cuenta.

**Uso de IA:** trabajé con Claude Code en todo el práctico. Yo decidí qué
reglas agregar y Claude escribió el código. Fui probando cada parte con
comandos reales antes de seguir, y de paso fuimos mirando las clases de la
cátedra para no desviarnos de lo que pedía la guía.

## TP6 — CD: environments, aprobaciones y deployment patterns

**El artefacto:** el pipeline publica las dos imágenes a `ghcr.io` solo en
push a `main`, con tag `sha-<commit>` (nunca `:latest`). No hay ningún
`if` que diga "si pasó, publicá": publicar es el último paso del mismo job
que testea, así que si los tests fallan, el job muere antes de llegar ahí.
Si se publicara igual (aunque fallen los tests), el registry dejaría de
significar "esto está verificado" — sería solo "esto compiló en algún
momento".

**Continuous Delivery, no Deployment:** todo cambio verificado llega solo
a QA, pero a producción solo con un click humano. Elegí Delivery porque mi
suite y mi monitoreo hoy no me dan la confianza para sacar al humano —
si algo rompe en producción sin que nadie mire antes, no tengo forma de
enterarme rápido.

**La cadena:** `build-backend`/`build-frontend` → `deploy-qa` (`needs` los
dos builds, `if` de rama `main`, `environment: qa`) → `deploy-prod`
(`needs: [deploy-qa]`, `environment: production`, sin `if` propio —lo
hereda de `deploy-qa`). Los secrets de cada entorno (`RENDER_HOOK_API_*`,
`RENDER_HOOK_FRONT_*`) viven en su `environment`, no en el repo: un job
que no declare `environment: production` ni siquiera puede leerlos.

**Qué mira mi aprobador antes de aprobar:** que QA esté verde de verdad
(abro la corrida, no solo miro el tilde), que el commit sea el esperado, y
si es buen momento para tocar producción.

**Letra chica del free tier:** Render duerme los servicios a los 15 min
sin tráfico — el primer pedido después tarda hasta 1 min. Por eso el smoke
reintenta (30 vueltas, 20s de espera) en vez de pedir una sola vez. Además,
las 750 horas/mes del plan gratis son por workspace, compartidas entre mis
4 servicios — si los dejara despiertos todo el tiempo (ej. con un ping para
evitar el sleep) se agotarían antes de fin de mes. El build de cada deploy
tarda unos minutos; no lo mide el pipeline, pero el smoke con reintentos
lo tolera sin romperse.

**Qué pierdo porque Render reconstruye en vez de correr mi imagen:**
la imagen publicada en `ghcr.io` no es la que corre en QA/PROD — Render
vuelve a construir el mismo commit desde el repo. Puede salir distinta de
la que publiqué y verifiqué. Es a propósito (TP7 lo resuelve); lo
documento como límite, no lo escondo.

**Qué prueba mi smoke test y qué no:** lo viví en vivo haciendo el
ejercicio de aprobación — aprobé un deploy, el smoke dio verde, y
`/health` siguió devolviendo la versión vieja varios segundos más
(Render todavía estaba construyendo). El smoke prueba que el entorno
**contesta**, no qué versión contesta: mientras Render reconstruye, sigue
sirviendo la anterior y el smoke no se entera.

**Pattern para una producción real + rollback:** elegiría **blue-green**
para esta app — es simple de razonar (dos entornos completos, un switch),
da rollback en segundos, y el costo extra (2x infraestructura) es barato
para una app chica como esta. Canary pediría métricas que hoy no tengo
(TP9), y feature flags es más trabajo del que esta app necesita por
ahora.

Mi plan de rollback actual: re-pegarle al mismo deploy hook con el SHA de
la release anterior (`&ref=<sha>`). Lo probé de verdad: disparé el
rollback a `v6.0.0` y medí con `curl` en loop cuánto tardaba `/health` en
dejar de mostrar la versión nueva — **≤15 segundos** (sondeado cada 15s;
salió tan rápido porque Render ya tenía esa build cacheada de un deploy
anterior reciente). El rollback de código no deshace datos: si hubiera
corrido una migración destructiva, esa parte no vuelve con esto.

**Problemas encontrados:**
1. Al cargar los secrets de los environments, se me cortó el `--env qa`
   del segundo comando dos veces seguidas (una vez en QA, otra en PROD) —
   el secret quedaba en el repo en vez del environment, donde el job no lo
   puede leer. Lo detecté con `gh secret list --env qa` (no aparecía) y lo
   resolví borrando y recargando con el flag completo.
2. Al primer intento, pegué el deploy hook de `api-prod` en el secret de
   `RENDER_HOOK_API_QA` por confundir de qué pestaña de Render estaba
   copiando — lo encontré porque pregunté antes de usarlo, no porque algo
   fallara solo. Lo resolví borrando el secret y recargándolo con cuidado
   de confirmar el nombre del servicio antes de copiar.
3. El environment `production` venía con "Allow administrators to bypass
   configured protection rules" tildado — como soy admin del repo, podría
   saltearme mi propia aprobación. Lo destildé para que el gate sea real.

**Uso de IA:** trabajé con Claude Code en todo el práctico. Yo creé las
cuentas de Neon y Render, cargué los secrets a mano (nunca se los pasé a
Claude — los pegué directo en la terminal) y aprobé/rechacé los deploys
reales. Claude escribió el `ci.yml`, el Dockerfile y la plantilla de
nginx, y verificó cada paso con comandos reales (`curl` contra las URLs
públicas, consultas a la API de GitHub) antes de seguir.
