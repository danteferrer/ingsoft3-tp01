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
