# Fix: Sincronización de Estado de Tareas en Producción

## Problema Identificado

En producción, cuando se actualizaba el estado de una tarea (cambiando su status o moviéndola entre columnas en el tablero), el cambio no se visualizaba correctamente. Esto se debía a problemas de sincronización entre:

1. **Estado local duplicado**: TaskBoardView mantenía un estado optimista local (`optimisticUpdates`) que se desincronizaba con el cache de React Query
2. **Refetch frecuentes**: El `staleTime` de 5 segundos causaba refetch constantes que sobreescribían cambios optimistas
3. **Sin rollback automático**: Si una actualización fallaba, el estado optimista no se revertía correctamente
4. **Invalidación incorrecta de queries**: Las mutaciones no invalidaban las queries correctamente

## Solución Implementada

### 1. **Optimistic Updates en React Query** ([ProjectTasks.jsx](src/pages/admin/ProjectTasks.jsx))

Se implementaron **actualizaciones optimistas robustas** directamente en las mutaciones de React Query con:

#### a. Update Task Mutation con `onMutate`
```javascript
onMutate: async ({ taskId, taskData }) => {
  // 1. Cancelar queries en vuelo
  await queryClient.cancelQueries({ queryKey: ['tasks', selectedProject.id] });
  
  // 2. Guardar snapshot del estado actual
  const previousTasks = queryClient.getQueryData(['tasks', selectedProject.id, appliedFilters]);
  
  // 3. Actualizar optimísticamente el cache
  queryClient.setQueryData(['tasks', selectedProject.id, appliedFilters], (oldData) => {
    // Actualizar la tarea inmediatamente
  });
  
  // 4. Retornar contexto para rollback
  return { previousTasks };
}
```

#### b. Rollback Automático en caso de error
```javascript
onError: (error, variables, context) => {
  // Restaurar el estado anterior si falla
  if (context?.previousTasks) {
    queryClient.setQueryData(
      ['tasks', selectedProject.id, appliedFilters],
      context.previousTasks
    );
  }
  throw error; // Propagar para manejo en componentes
}
```

#### c. Sincronización con el servidor
```javascript
onSuccess: (response, { taskId }) => {
  // Actualizar con la respuesta real del servidor
  const updatedTask = response.data;
  queryClient.setQueryData(['tasks', selectedProject.id, appliedFilters], (oldData) => {
    // Reemplazar con datos reales del servidor
  });
}
```

### 2. **Configuración Mejorada de React Query**

```javascript
const { data: tasksResponse, isLoading, error, refetch } = useQuery({
  queryKey: ['tasks', selectedProject?.id, appliedFilters],
  queryFn: () => getTasks(selectedProject.id, appliedFilters),
  enabled: !!selectedProject?.id,
  staleTime: 30000, // 30 segundos (antes: 5 segundos)
  cacheTime: 1000 * 60 * 5, // 5 minutos en cache
  refetchOnWindowFocus: false, // Evitar refetch al cambiar de ventana
});
```

**Beneficios**:
- Menos refetch automáticos que interfieren con cambios optimistas
- Cache más duradero para mejor rendimiento
- Control explícito de cuándo refetch

### 3. **Simplificación de TaskBoardView** ([TaskBoardView.jsx](src/components/tasks/TaskBoardView.jsx))

Se eliminó la **gestión de estado local duplicada**:

#### Antes ❌
```javascript
const [loadingTasks, setLoadingTasks] = useState(new Set());
const [optimisticUpdates, setOptimisticUpdates] = useState({});

// Estado duplicado causaba desincronización
const getTasksByStatus = (status) => {
  return tasks.filter((t) => {
    if (optimisticUpdates[taskId]) {
      return optimisticUpdates[taskId] === status; // Estado local
    }
    return normalizeStatus(t.status) === status; // Estado React Query
  });
};
```

#### Después ✅
```javascript
// Una única fuente de verdad: React Query
const getTasksByStatus = (status) => {
  return tasks.filter((t) => normalizeStatus(t.status) === status);
};
```

#### Handle Drop simplificado
```javascript
const handleDrop = async (e, columnId) => {
  e.preventDefault();
  setDragOverColumn(null);
  
  if (draggedTask && normalizeStatus(draggedTask.status) !== columnId) {
    try {
      // React Query maneja todo automáticamente
      await onStatusChange(draggedTask.id, columnId);
      setToast({ type: 'success', message: 'Task updated successfully!' });
    } catch (error) {
      // React Query ya hizo rollback
      setToast({ type: 'error', message: 'Failed to update task.' });
    }
  }
  setDraggedTask(null);
};
```

### 4. **Invalidación Correcta de Queries**

Todas las mutaciones ahora invalidan queries correctamente:

```javascript
onSettled: () => {
  // Marcar queries como stale sin refetch inmediato
  queryClient.invalidateQueries({ 
    queryKey: ['tasks', selectedProject.id],
    refetchType: 'none' // No refetch automático
  });
}
```

Esto asegura que:
- Los datos se consideran "stale" para el próximo acceso
- No se hace refetch innecesario inmediatamente
- El cache sigue siendo la fuente de verdad hasta el próximo refetch

## Flujo de Actualización (Con los cambios)

### Escenario: Usuario arrastra tarea de "Pending" a "In Progress"

1. **Usuario suelta la tarea** → `handleDrop` llamado
2. **React Query `onMutate`** → Cache actualizado instantáneamente
3. **UI se actualiza** → Tarea aparece en nueva columna inmediatamente
4. **Request al servidor** → API procesa la actualización
5. **Casos**:
   - ✅ **Éxito**: `onSuccess` actualiza con datos reales del servidor
   - ❌ **Error**: `onError` revierte al estado anterior (rollback)
   - ✅ **Toast mostrado** al usuario con el resultado

### Ventajas del nuevo flujo:

- ✅ **Inmediatez**: Usuario ve cambios instantáneamente
- ✅ **Fiabilidad**: Rollback automático si falla
- ✅ **Una fuente de verdad**: Solo React Query maneja el estado
- ✅ **Sincronización**: Cache siempre refleja el estado correcto
- ✅ **Feedback claro**: Toast indica éxito/error

## Cambios en handleStatusChange

```javascript
// Antes
const handleStatusChange = async (taskId, newStatus) => {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    await updateTaskMutation.mutateAsync({ 
      taskId, 
      taskData: { ...task, status: newStatus } // Enviaba toda la tarea
    });
  }
};

// Después
const handleStatusChange = async (taskId, newStatus) => {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    try {
      await updateTaskMutation.mutateAsync({ 
        taskId, 
        taskData: { status: newStatus } // Solo envía el campo que cambia
      });
    } catch (error) {
      throw error; // Propaga el error para manejo en TaskBoardView
    }
  }
};
```

**Beneficios**:
- Menos datos en el request (solo lo que cambia)
- Manejo explícito de errores
- Mejor integración con optimistic updates

## Testing en Producción

### Para verificar que funciona correctamente:

1. **Test básico**:
   - Abre el tablero de tareas
   - Arrastra una tarea a otra columna
   - Verifica que se mueve instantáneamente
   - Verifica que el toast de éxito aparece

2. **Test con conexión lenta**:
   - Abre DevTools → Network → Throttling → Slow 3G
   - Arrastra una tarea
   - Debe moverse instantáneamente (optimistic update)
   - Espera respuesta del servidor
   - Verifica que la tarea permanece en la nueva columna

3. **Test de error**:
   - Desconecta internet temporalmente
   - Arrastra una tarea
   - Debe moverse instantáneamente
   - Al fallar el request, debe volver a su columna original
   - Toast de error aparece

4. **Test de sincronización**:
   - Abre la app en dos ventanas/pestañas diferentes
   - Cambia una tarea en la primera ventana
   - Refresca la segunda ventana (F5)
   - Debe mostrar el estado actualizado

## Archivos Modificados

1. **[src/pages/admin/ProjectTasks.jsx](src/pages/admin/ProjectTasks.jsx)**
   - Configuración mejorada de `useQuery` (staleTime, cacheTime, refetchOnWindowFocus)
   - `createTaskMutation` con invalidación correcta
   - `updateTaskMutation` con optimistic updates completos
   - `deleteTaskMutation` con invalidación correcta
   - `handleStatusChange` simplificado y con manejo de errores

2. **[src/components/tasks/TaskBoardView.jsx](src/components/tasks/TaskBoardView.jsx)**
   - Eliminado estado local `loadingTasks`
   - Eliminado estado local `optimisticUpdates`
   - Simplificado `getTasksByStatus` (una fuente de verdad)
   - Simplificado `handleDrop` (confía en React Query)
   - Limpieza de estilos CSS innecesarios

## Mejoras de Rendimiento

### Antes:
- Refetch cada 5 segundos
- Estado duplicado en múltiples lugares
- Animaciones pesadas de shimmer/skeleton
- Sincronizaciones manuales propensas a errores

### Después:
- Refetch cada 30 segundos (solo cuando es necesario)
- Una única fuente de verdad (React Query cache)
- Animaciones ligeras solo para drag & drop
- Sincronización automática y fiable con optimistic updates

## Próximos Pasos (Opcionales)

Si se necesitan mejoras adicionales:

1. **Websockets/Polling**: Para actualizaciones en tiempo real de múltiples usuarios
2. **Service Worker**: Para mejor manejo de offline/online
3. **Persistencia local**: Guardar cambios pendientes en localStorage si falla el server
4. **Undo/Redo**: Stack de operaciones para deshacer cambios

## Resumen

✅ **Problema resuelto**: Las actualizaciones de estado ahora se visualizan correctamente en producción
✅ **Optimistic updates**: Los cambios se ven instantáneamente
✅ **Rollback automático**: Si falla, se revierte al estado anterior
✅ **Una fuente de verdad**: React Query maneja todo el estado de tareas
✅ **Mejor rendimiento**: Menos refetch, menos estado duplicado
✅ **Feedback claro**: Toast indica el resultado de cada operación

El sistema ahora es más robusto, mantenible y proporciona una mejor experiencia de usuario.
