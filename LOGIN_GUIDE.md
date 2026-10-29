## Guía de Login y Navegación al Panel Administrativo

### ✅ Cambios Realizados

1. **Mock de Autenticación** ([src/api/mock-auth.js](src/api/mock-auth.js))
   - Simula el servidor de autenticación en desarrollo
   - Incluye credenciales de prueba predefinidas

2. **Actualización de Autenticación** ([src/api/auth.js](src/api/auth.js))
   - Utiliza mock en modo desarrollo (`import.meta.env.DEV`)
   - Fallback al servidor real en producción

3. **Manejo de Errores Mejorado** ([src/pages/auth/Login.jsx](src/pages/auth/Login.jsx))
   - Validación de campos vacíos
   - Manejo de errores con mensajes claros
   - Guardado automático en localStorage con las keys:
     - `translation_user_token`
     - `translation_user_data`
   - Navegación automática a `/admin` tras login exitoso
   - Credenciales de prueba mostradas en la interfaz

4. **Protección de Rutas** ([src/App.jsx](src/App.jsx))
   - RouteGuard `RequireAuth` valida la existencia del token
   - Redirige a `/` si no hay sesión

### 🧪 Cómo Testear

#### Opción 1: Con Credenciales de Prueba (Recomendado)
```
Email: admin@translation.com
Contraseña: admin123
```

#### Opción 2: Si tienes un servidor backend
1. Configura `VITE_API_BASE_URL` en `.env` con la URL correcta
2. El sistema usará automáticamente el servidor real
3. Asegúrate que el endpoint `/auth/login` devuelva:
   ```json
   {
     "token": "your-token",
     "user": {
       "id": "user-id",
       "email": "user@example.com",
       "name": "User Name"
     }
   }
   ```

### 🔍 Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. Se valida que no estén vacías
   ↓
3. Se llama a loginUser() (mock o real)
   ↓
4. Si es exitoso:
   - Se guarda token en localStorage (translation_user_token)
   - Se guarda datos del usuario en localStorage (translation_user_data)
   - Se navega automáticamente a /admin
   ↓
5. En /admin:
   - Se verifica que exista token
   - Si no existe, se redirige a /
```

### 📦 LocalStorage Keys
- **translation_user_token**: Token JWT/Bearer del usuario
- **translation_user_data**: JSON con datos del usuario (id, email, name, role)

### ⚠️ Notas Importantes
- El mock solo funciona en desarrollo
- En producción solo funcionará si el servidor real está operativo
- Los datos se persisten en localStorage, así que la sesión se mantiene al recargar
