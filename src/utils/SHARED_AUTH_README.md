# Shared Auth Storage for Microfrontend

Módulo centralizado para gestionar autenticación entre múltiples proyectos en una arquitectura microfrontend.

## Características

- **Token compartido**: Todos los microfrontends usan `translation_user_token`
- **Datos de usuario**: Almacenados en `translation_user_data` (JSON)
- **Sincronización entre tabs**: El hook `subscribeToAuthChanges` escucha cambios en otros tabs
- **API-agnostic**: Compatible con cualquier backend

## Uso en tu CRM

### En el Login
```jsx
import { getAuthToken, setAuthUser, clearAuthToken } from "../../utils/auth-storage";

const token = getAuthToken();
const { data: currentUser } = useQuery({
  queryKey: ["auth", "me", token],
  queryFn: () => fetchCurrentUser(token),
  enabled: Boolean(token),
});

if (currentUser) setAuthUser(currentUser);
```

### En otros proyectos
```jsx
import { getAuthToken, getAuthUser, hasAuthSession } from "@shared/auth-storage";

const token = getAuthToken();
const user = getAuthUser();
const isLoggedIn = hasAuthSession();
```

### Escuchar cambios desde otros tabs
```jsx
import { subscribeToAuthChanges } from "@shared/auth-storage";

useEffect(() => {
  const unsubscribe = subscribeToAuthChanges(({ token, user }) => {
    console.log("Sesión actualizada desde otro tab:", user);
  });
  
  return unsubscribe;
}, []);
```

## Próximos pasos

1. **Crear paquete compartido**: Mover `auth-storage.js` a un paquete npm privado o monorepo
2. **Sincronizar otros proyectos**: Importar desde el paquete compartido
3. **Configurar CORS**: Asegurar que el shared localStorage funcione en todos los dominios
