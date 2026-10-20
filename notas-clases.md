# Notas de clases (P2)

Apuntes míos para repasar antes de la defensa. No se sube al repo, es solo
para mí.

## TP5 — Testing y cobertura

- Pirámide de testing: muchos unitarios (ms, aislados), algunos de
  integración (piezas reales colaborando), pocos e2e (lentos, caros). Si
  se invierte ("cono de helado") la suite queda lenta y frágil, y cuando
  falla no dice dónde.
- Hoy toca: tests unitarios (integración y e2e son del TP7). AAA como
  guía, no como regla fija — si no hay nada que armar, no hay Arrange.
- Nombrar el test por lo que protege, no por el método ("patente inválida
  se rechaza", no "test2").
- Parametrizado = mismo test, varios datos (`it.each`). Cuenta como **1**
  método aunque tenga 4 casos — ojo con contar mal.
- Para el mock hay que poder inyectar la dependencia (constructor/parámetro),
  no que la cree ella misma con `new`/`fetch` adentro. Si no se puede,
  refactorizar primero y anotarlo en decisiones.md.
- Cobertura: instalar la versión de coverage que coincida con la de
  Vitest instalada (no "la última" sin mirar). El número global no dice
  nada si incluye código sin lógica — mirar archivo por archivo.
- El threshold se pone en `vitest.config.js` (`coverage.thresholds`) y
  frena el comando si no llega. Decir siempre sobre qué métrica (líneas
  y/o ramas).
- Ojo con el truco silencioso: si el `include` no matchea ningún archivo
  real, mide 0 y el umbral nunca falla — queda todo verde sin que sirva
  de nada. Hay que mirar que el reporte liste archivos de verdad.
- Lo que falta cubrir: elegir una rama sin testear del reporte, decir qué
  entrada la recorre, y decidir si se agrega el test o no (con motivo).
- Cobertura mide que se ejecutó, no que se verificó — un test sin
  `expect` sube el número igual. Prueba real: mutar el código (`>` por
  `>=`) y ver si algún test se pone rojo.
- Demo obligatoria: agregar código sin testear → sube el PR → el pipeline
  da rojo por cobertura (no por tests rotos) → agregar los tests que
  faltan (el propio reporte dice cuáles) → verde → merge. Dos PRs: uno
  completo, uno chico que queda **abierto y rojo** hasta la defensa.
- Docker: una etapa `test` entre `build` y la final, con `ENTRYPOINT`
  (no `RUN`, si no el reporte se pierde en una capa intermedia).
- decisiones.md: threshold elegido + por qué, con links reales de
  Actions/PRs, nunca capturas.
- CodeQL/ESLint (análisis estático) se nombran en la clase como el 4to
  guardián de `main`, pero la propia diapositiva aclara **"esto no se
  pide en el TP5"** — es concepto para más adelante (CodeQL llega en
  TP9), no un entregable de hoy.
- Cierre: tag `v5.0.0` + release.

## TP6 — CD, entornos y aprobación

- Continuous Integration ≠ Continuous Delivery: CI verifica y deja el
  artefacto ahí sin ir a ningún lado. CD (hoy) lo hace llegar hasta
  producción, pero con un humano aprobando el último paso. Continuous
  Deployment saca al humano — necesita mucha confianza en tests y
  monitoreo, hoy no la tenemos.
- El pipeline, al final del job que ya corre los tests, publica la
  imagen a `ghcr.io` con tag `sha-<commit>` (nunca `:latest`). Solo en
  push a `main`. Como publicar es el último paso del mismo job, si los
  tests fallan nunca se llega ahí — no hace falta ningún `if`.
- Cuentas nuevas: Render (corre la app) y Neon (Postgres, porque el de
  Render expira a los 30 días). Las bases nacen vacías — crear las tablas
  a mano en las dos (`app_qa` y `app_prod`) o el error aparece recién en
  el smoke test sin decir "falta la tabla".
- nginx del frontend: la URL del backend pasa de hardcodeada a variable
  de entorno (`BACKEND_URL`), con `resolver` + plantilla. Así la misma
  imagen sirve en QA y PROD.
- GitHub Environments: `qa` sin protección, `production` con required
  reviewer. Los secrets viven ahí, no en el repo — un job de QA no puede
  leer el secret de PROD. "Prevent self-review" tiene que quedar
  destildado si trabajás solo (GitHub no deja aprobar tus PRs, pero sí
  tus deployments).
- Cadena: build → deploy QA automático → smoke con reintentos → espera
  aprobación → deploy PROD + smoke.
- El `curl` al hook lleva `&ref=$GITHUB_SHA` — sin eso, Render despliega
  la punta de main en el momento del click, no el commit que se aprobó.
- Smoke test solo pregunta "¿contesta?", no "¿qué versión contesta?" —
  mientras Render reconstruye, sigue sirviendo la vieja y el smoke da
  verde igual. Límite real, documentado como tal.
- Hay que rechazar un deploy al menos una vez, con motivo escrito (no
  solo aprobaciones) — si el gate nunca dice que no, no se sabe si
  funciona.
- Deployment patterns para justificar en decisiones.md: recreate (con
  downtime), rolling (gradual), blue-green (2 infra completas, rollback
  en segundos), canary (necesita métricas, si no es apuesta), feature
  flags (deploy ≠ release). Yo elegí blue-green para esta app.
- Release: tag sobre el commit que está en Deployments, no la punta de
  main (puede haber algo sin aprobar en el medio):
  ```
  SH=$(gh api repos/:owner/:repo/deployments -f environment=production --jq '.[0].sha')
  git tag v6.0.0 $SH && git push origin v6.0.0
  gh release create v6.0.0 --generate-notes --verify-tag
  ```
- Rollback: mismo hook, con el SHA del deploy bueno anterior. El código
  vuelve, los datos no (una migración que borró algo sigue borrado).
- Free tier: Render duerme a los 15 min sin tráfico, 750hs/mes
  compartidas entre TODOS los servicios — nunca hacer ping para evitar
  el sleep.

## TP7 — Build once, deploy many + integración + e2e

- Problema que cierra este TP: Render reconstruía la imagen en cada
  deploy en vez de correr la que se publicó — mismo commit, imagen
  distinta posible (ej. `nginx:alpine` bajó otra versión entre dos
  builds).
- Solución: el pipeline construye **una vez**, los 4 servicios de Render
  pasan a ejecutar esa imagen (Settings → Build → Source → Existing
  Image), no reconstruyen más. Cambiar la fuente no dispara deploy solo
  — probar con el hook una vez.
- El `curl` al hook cambia de `&ref=<commit>` a `&imgURL=<imagen
  completa con el tag sha->` — Render ya no construye, solo baja esa
  imagen puntual.
- Se confirma en pestaña **Events** de Render: tiene que decir "via
  deploy hook" y la etiqueta real — el smoke test no alcanza para
  confirmarlo (mismo límite de TP6).
- Integración: Playwright en modo `request` (sin navegador, corre en
  segundos), contra la API ya desplegada en QA. Mínimo 3 tests: crear →
  no confiar en la respuesta del POST → GET y comprobar que está de
  verdad → borrar.
- E2E: Playwright con Chromium real, contra la URL pública de QA.
  Mínimo 3 flujos (creación, error, uno elegido tipo "si no anda te
  escriben los usuarios" — ej. que persista al recargar). Buscar
  elementos por label/rol, no por clase CSS. Nada de `sleep` fijo.
- Cadena: deploy-qa → integración → e2e → deploy-prod. Si e2e falla,
  deploy-prod queda gris, ni pide aprobación.
- Demo obligatoria: romper el front de verdad (ej. mandar `title` en vez
  de `titulo`), mergear. Resultado: integración verde (la API está
  sana) + e2e roja (la única que usa la pantalla) = el problema es el
  front, no la API. Las dos juntas dan diagnóstico, una sola es solo
  alarma.
- `concurrency: deploy-prod` para que no se acumulen corridas viejas
  esperando aprobación.
- Release v7.0.0 igual que TP6, pero ahora el rollback no reconstruye
  nada: la imagen de ese commit ya está en el registry.

## TP8 — Infraestructura como código (Terraform)

- Hasta ahora los servicios de Render/Neon se crearon clickeando — nada
  reproducible. Terraform los declara en archivos.
- Imperativo (decís los pasos, falla si lo corrés dos veces) vs
  declarativo (decís cómo tiene que quedar, la herramienta calcula qué
  falta). Idempotencia: aplicar 2 veces da lo mismo que aplicar 1 vez —
  la segunda dice "no changes".
- 4 comandos: `init` (baja providers), `plan` (muestra sin tocar nada),
  `apply` (lo hace), `destroy` (lo deshace).
- Regla de oro: **nunca tocar QA/PROD**. Todo esto crea un entorno nuevo,
  `preprod`, que no existe hasta el primer apply.
- `neon_role`/`neon_database` necesitan `branch_id =
  neon_project.x.default_branch_id` (no hay `branch_id` directo en el
  project).
- `history_retention_seconds = 21600` obligatorio (el default de 86400s
  excede el límite del free tier de Neon).
- Mi cuenta de Neon pedía `org_id` en `neon_project` — no estaba en la
  guía, lo encontré con el error 400 real.
- Render: `image_url` y `tag` van separados en `runtime_source.image`
  (si los concatenás, error). `region` tiene una lista fija de valores.
- Render free tier: **no se puede modificar in-place**, cualquier update
  falla — para cambiar algo hay que `destroy` + `apply` o `-replace`.
- `prevent_destroy` en el lifecycle de un recurso bloquea el destroy real
  (nombra el recurso y la línea). Sacarlo para poder destruir después.
- Orden de destroy = inverso al de creación, calculado por las
  dependencias entre recursos, no por el orden del archivo.
- Terminé la sesión con un `terraform destroy` de preprod — nunca dejarlo
  vivo, las 750hs de Render son compartidas con QA/PROD.
- `.terraform.lock.hcl` sí se commitea, `*.tfstate` nunca (tiene
  passwords en texto plano).

## TP9 — DevSecOps + Observabilidad

- Shift-left: revisar seguridad en cada cambio (como el CI del TP4), no
  al final. A eso se le llama DevSecOps.
- 3 protecciones de GitHub, todas gratis en repo público:
  1. **Push protection** (secretos): ya viene activa, solo hay que
     verificarla. Bloquea el push si encuentra una clave con formato
     conocido — no entra ni al historial.
  2. **Dependabot** (dependencias): `.github/dependabot.yml` (npm para
     backend y frontend, github-actions para el pipeline). Abre PRs de
     actualización que pasan por el mismo CI de siempre. Hay que
     mergear al menos uno, analizado (qué actualiza, SemVer, breaking
     changes, pipeline verde).
  3. **CodeQL** (código propio): Settings → Advanced Security → Setup →
     Default. Lee el código sin ejecutarlo. A mí me marcó "Workflow does
     not contain permissions" en 4 jobs — se arregla con
     `permissions: contents: read`.
- Monitor externo (UptimeRobot): HTTP check sobre `/health` de PROD cada
  5 min, alerta por mail. Tiene que ser externo (si no, se cae junto con
  lo que vigila). Ojo: usa HEAD, no GET — verificar con `curl -I` antes.
- Probé la caída de verdad: suspendí `api-prod`, el mail de Down tardó
  **5 minutos**, lo reanudé y volvió en total 5m05s. Pausar el monitor
  al terminar (no hace falta por cuota acá, pero la guía lo pide).
- Sentry (back y front): contesta 3 preguntas — qué falla (Issues), qué
  tarda (P95 en Backend Overview), qué se usa (TPM). El DSN del front va
  escrito en el código a propósito, no es secreto (solo sirve para
  mandar datos). El DSN del back va por variable de entorno.
- Armé un endpoint `/api/falla` solo para generar un error de prueba, lo
  saqué después de verlo en Sentry.
- A mí Sentry no me nombró las transacciones por ruta (solo agrupó por
  método HTTP) — probablemente por Express 5, muy nuevo.
- Con un dato real de Sentry (la operación más lenta) abrí una tarjeta en
  el tablero del TP3.
- Postmortem blameless: la pregunta útil después de un incidente es "qué
  permitió que pasara" (arreglás el sistema), no "quién fue" (la próxima
  vez esconden lo que pasó).
- DORA (clase 1) ahora se calcula con datos reales del propio repo:
  frecuencia de deploy, lead time, change failure rate, tiempo de
  recuperación.
- Cierre: `v9.0.0`. Evaluación de TP8 y TP9: 25% técnico / 75% defensa
  en vivo (distinto del resto que es 25/25/50).
