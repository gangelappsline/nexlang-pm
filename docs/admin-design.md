# Panel administrativo · Rediseño NexLang

## Alcance

- Shell administrativo compartido: barra lateral azul marino, navegación activa, modo compacto y menú móvil.
- Dashboard con métricas reales del proyecto y agenda semanal/mensual por **fecha de entrega**.
- Filtros de estado locales, navegación por periodos, botón Hoy, actualización manual y resumen de tarea en un diálogo.
- Tareas sin fecha en una sección independiente; estados de carga, error, proyecto vacío y periodo sin entregas.
- Buscador de proyectos con `Ctrl/Cmd + K`, selector de proyecto y acceso al perfil existente.
- Las vistas existentes de proyectos, lista/board/timeline de tareas, recursos y sus modales conservan sus operaciones.

No se modificaron `src/api`, `src/services`, `src/hooks`, autenticación, contratos del backend ni mutaciones existentes. El dashboard mantiene la misma consulta `getTasks(selectedProject.id)`, su clave de caché y `staleTime`. La búsqueda y el filtrado de la agenda operan sobre datos ya cargados, sin endpoints adicionales. No se incluyeron datos ficticios ni bypass de autenticación en la aplicación.

## Diseño

Los seis colores solicitados se definen en `:root` en `src/admin.css`. Los estilos administrativos se cargan desde `src/main.jsx`; el diseño de login no se modifica. El shell utiliza tonos derivados azules para superficies y estados; los colores semánticos de las vistas existentes se conservan.

Las animaciones de entrada, hover, carga y menús respetan `prefers-reduced-motion`. La agenda permite desplazamiento horizontal dentro del calendario en móvil sin desbordar el documento. Los diálogos de resumen utilizan `<dialog>` nativo para el foco, el bloqueo del fondo y Escape.

Las fechas API `YYYY-MM-DD` se interpretan como fechas locales, evitando que una entrega aparezca en el día anterior por conversión UTC. Los valores inválidos se muestran como tareas sin fecha.

## Verificación

```sh
npm ci
npm run build
node --test tests/calendar.test.js
```

Las pruebas del calendario cubren zonas horarias, meses completos (incluido año bisiesto), semanas de lunes a domingo, cruces de año, fechas inválidas y etiquetas de estado.

Se verificaron en navegador con respuestas de API simuladas (sin credenciales ni escrituras al backend):

- Dashboard a 1440 × 1000 y 390 × 844, sin desbordamiento horizontal del documento.
- Agenda semanal/mensual, filtro de estado, navegación de periodos y retorno a Hoy.
- Resumen de tarea y cierre mediante Escape.
- Búsqueda de proyectos, contracción de barra lateral, menú móvil y apertura de perfil.
- Navegación a tareas, proyectos y recursos usando el shell compartido.
- Estados sin tareas, sin proyectos y fallo de la consulta de tareas.

`npm run lint` tiene errores preexistentes en otros componentes, el contexto y servicios. Los nuevos componentes `AdminLayout`, `Header`, `Dashboard` y las utilidades del calendario pasan ESLint de forma aislada. Las pruebas visuales no sustituyen una validación de integración con el backend real.
