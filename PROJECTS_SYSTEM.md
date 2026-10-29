# Sistema de Gestión de Proyectos

## Descripción General

El sistema de gestión de proyectos ha sido implementado con las siguientes características:

### Funcionalidades Principales

1. **Selección de Proyecto Global**
   - Siempre hay un proyecto seleccionado cuando hay proyectos disponibles
   - La selección se persiste en `sessionStorage`
   - Selector visual en el header del panel admin

2. **Estados del Sistema**
   - **Cargando**: Muestra spinner mientras se cargan los proyectos
   - **Sin proyectos**: Muestra pantalla con botón para crear el primer proyecto
   - **Error**: Muestra mensaje de error con opciones para reintentar o crear proyecto
   - **Con proyectos**: Muestra interfaz completa con proyecto seleccionado

3. **Operaciones CRUD**
   - **Crear**: Modal con formulario completo, hace POST a `/projects`
   - **Editar**: Mismo modal con datos precargados, hace PUT a `/projects/:id`
   - **Eliminar**: Confirmación y DELETE a `/projects/:id`
   - **Listar**: GET a `/projects` al cargar la página

### Arquitectura

#### API Layer (`src/api/projects.js`)
```javascript
- getProjects()      // GET /projects
- createProject()    // POST /projects
- updateProject()    // PUT /projects/:id
- deleteProject()    // DELETE /projects/:id
```

#### Context Layer (`src/contexts/ProjectContext.jsx`)
- Maneja el estado global de proyectos
- Persiste la selección en sessionStorage
- Provee funciones para manipular proyectos
- Maneja estados de carga y error

#### UI Components

**Header** (`src/components/Header.jsx`)
- Dropdown elegante para seleccionar proyecto
- Muestra proyecto actual
- Integrado con ProjectContext

**Admin Page** (`src/pages/admin/Admin.jsx`)
- Maneja todas las operaciones CRUD
- Muestra estados de carga, error y vacío
- Integrado con ProjectContext

**ProjectModal** (`src/components/projects/ProjectModal.jsx`)
- Formulario para crear/editar proyectos
- Muestra errores de API
- Deshabilita controles durante guardado

### Flujo de Trabajo

#### Primer Acceso (Sin Proyectos)
1. Se hace GET a `/projects`
2. Si responde con array vacío:
   - Muestra pantalla "No hay proyectos"
   - Botón prominente para crear proyecto
3. Usuario crea proyecto:
   - Se abre modal
   - Usuario llena formulario
   - POST a `/projects`
   - Proyecto se agrega y auto-selecciona

#### Acceso Normal (Con Proyectos)
1. Se hace GET a `/projects`
2. Se selecciona automáticamente:
   - Proyecto guardado en sessionStorage, O
   - Primer proyecto de la lista
3. Usuario puede:
   - Cambiar proyecto desde header
   - Crear, editar, eliminar proyectos
   - Ver y gestionar tareas del proyecto seleccionado

#### Manejo de Errores
1. **Error al cargar proyectos**:
   - Muestra mensaje de error
   - Opción para reintentar
   - Opción para crear proyecto (intenta POST)

2. **Error al crear/editar**:
   - Muestra error en el modal
   - Modal permanece abierto
   - Usuario puede corregir y reintentar

3. **Error al eliminar**:
   - Muestra alerta con error
   - Proyecto no se elimina localmente

### Integración con Tareas

- Todas las tareas se relacionan con el proyecto seleccionado
- Al crear tarea: `projectId = selectedProject.id`
- Al eliminar proyecto: se eliminan sus tareas
- Al cambiar proyecto: se filtran tareas correspondientes

### Persistencia

- **sessionStorage**: ID del proyecto seleccionado
- **API**: Fuente de verdad para todos los proyectos
- **Sincronización**: Después de crear proyecto, se refresca lista desde API

### Notas Técnicas

- Usa `async/await` para todas las operaciones API
- Maneja loading states para mejor UX
- Validación de formularios en el cliente
- Confirmación antes de eliminar
- Auto-selección inteligente de proyectos

## Uso

### Backend Requirements

El backend debe implementar los siguientes endpoints:

```
GET    /projects           - Listar proyectos
POST   /projects           - Crear proyecto
PUT    /projects/:id       - Actualizar proyecto
DELETE /projects/:id       - Eliminar proyecto
```

### Response Format

**GET /projects**
```json
[
  {
    "id": 1,
    "name": "Proyecto Demo",
    "code": "DEMO-001",
    "dept": "Legal",
    "status": "In Progress",
    "priority": "HIGH",
    "dueDate": "2024-12-31",
    "progress": 50,
    "wordCount": 1000,
    "assignees": ["JD", "SC"],
    "health": "on-track"
  }
]
```

**POST /projects** - Acepta y retorna el mismo formato
**PUT /projects/:id** - Acepta y retorna el mismo formato
**DELETE /projects/:id** - Retorna 204 No Content

### Environment Variables

```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Testing

1. **Sin backend**: La app mostrará error y permitirá crear proyectos (que fallarán)
2. **Con backend mock**: Implementar endpoints que retornen datos de prueba
3. **Con backend real**: Todo debe funcionar automáticamente

## Estado Actual

✅ API module implementado
✅ Context implementado
✅ Header con selector implementado
✅ Estados de carga/error/vacío implementados
✅ Modal de proyecto implementado
✅ Integración completa en Admin page
✅ Manejo de errores robusto
✅ Persistencia de selección

El sistema está completamente funcional y listo para integrarse con el backend.
