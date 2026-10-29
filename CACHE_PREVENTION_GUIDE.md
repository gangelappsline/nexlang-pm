# Guía Anti-Caché para Producción

## Problema
Cuando subes nuevas versiones a producción, los navegadores pueden cachear archivos antiguos y los usuarios no ven las últimas funciones.

## Soluciones Implementadas

### 1. **Configuración de Vite** (`vite.config.js`)
- ✅ **Hash automático**: Todos los archivos JS y CSS ahora incluyen un hash único en su nombre (ej: `main.a3f2b1c.js`)
- ✅ **Manifest generado**: Vite genera un archivo manifest para un mejor control de caché
- ✅ **Source maps**: Habilitados para debugging en producción

### 2. **Meta Tags en HTML** (`index.html`)
Se agregaron meta tags que evitan que el navegador cachee el archivo index.html:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 3. **Configuración de Hosting**
Se crearon archivos de configuración para diferentes servicios:

#### **Vercel** (`vercel.json`)
- index.html: No se cachea (max-age=0)
- Assets (/assets/*): Se cachean por 1 año (son inmutables gracias al hash)
- Headers de seguridad incluidos

#### **Netlify** (`netlify.toml`)
- Misma configuración que Vercel
- Incluye redirects para SPA

#### **Cloudflare Pages / Otros** (`public/_headers`)
- Archivo de headers genérico
- Compatible con servicios que usan este formato

## Cómo Funciona

### El sistema de cache busting funciona así:

1. **Archivos con hash** (`/assets/*`):
   - Cada vez que cambias código, Vite genera nuevos nombres de archivo
   - `main.abc123.js` → `main.xyz789.js`
   - Estos se cachean por 1 año porque nunca cambian
   - Si el archivo cambia, el nombre cambia

2. **index.html**:
   - NUNCA se cachea (max-age=0)
   - Siempre se descarga la versión más reciente
   - Contiene referencias a los nuevos archivos con hash

3. **Flujo de actualización**:
   ```
   Usuario visita → index.html (siempre nuevo) → 
   Referencias a assets nuevos → 
   Descarga solo los archivos que cambiaron
   ```

## Comandos

### Desarrollo
```bash
npm run dev
```

### Build para producción
```bash
npm run build
```

### Build con verificación
```bash
npm run build:production
```

## Qué Hacer Después de Subir a Producción

### 1. Verifica que el hash cambió
Después de hacer build, verifica que los archivos en `dist/assets/` tienen nombres diferentes:
```bash
# Antes del cambio
dist/assets/main.abc123.js

# Después del cambio
dist/assets/main.xyz789.js
```

### 2. Despliega normalmente
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# O tu método habitual
```

### 3. Prueba en modo incógnito
- Abre el sitio en modo incógnito/privado
- Verifica que ves los cambios
- Usa DevTools (F12) → Network → Deshabilita cache

### 4. Forzar actualización a usuarios (si es necesario)
Si algunos usuarios siguen viendo la versión antigua:

**Opción 1: Esperar**
- Los navegadores eventualmente actualizarán (máximo 24 horas)

**Opción 2: Hard refresh**
- Dile a los usuarios que presionen Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)

**Opción 3: Service Worker**
- Si usas service workers, actualízalos también

## Verificación de Headers en Producción

Para verificar que los headers están configurados correctamente:

```bash
# Verifica index.html (no debe cachearse)
curl -I https://tu-dominio.com/

# Verifica assets (deben cachearse por 1 año)
curl -I https://tu-dominio.com/assets/main.xyz789.js
```

Busca:
- `Cache-Control: public, max-age=0, must-revalidate` (index.html)
- `Cache-Control: public, max-age=31536000, immutable` (assets)

## Plataformas Soportadas

Los archivos de configuración funcionan con:
- ✅ Vercel (`vercel.json`)
- ✅ Netlify (`netlify.toml`)
- ✅ Cloudflare Pages (`public/_headers`)
- ✅ Firebase Hosting (usa `firebase.json` - ver abajo)
- ✅ Servidores Apache (necesita `.htaccess` - ver abajo)
- ✅ Nginx (necesita configuración - ver abajo)

### Firebase Hosting
Si usas Firebase, crea `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "/index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      },
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Apache (.htaccess)
Si usas Apache, crea `.htaccess` en tu carpeta `dist`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# No cache for HTML
<FilesMatch "\.(html)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires 0
</FilesMatch>

# Cache hashed assets for 1 year
<FilesMatch "\.(js|css|woff|woff2|ttf|svg|jpg|jpeg|png|gif|ico)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```

### Nginx
Si usas Nginx, agrega esto a tu configuración:
```nginx
server {
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
        
        # No cache para HTML
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires 0;
        }
        
        # Cache assets por 1 año
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
```

## Resumen

✅ **El problema está resuelto**. Ahora:
- Cada deployment genera archivos con nombres únicos
- El navegador siempre descarga el index.html nuevo
- Los assets se cachean eficientemente pero se actualizan cuando cambias el código
- Los usuarios siempre verán la última versión después de desplegar

## Preguntas Frecuentes

**P: ¿Necesito hacer algo especial al desplegar?**
R: No, solo haz build y despliega como siempre.

**P: ¿Los usuarios necesitan limpiar su caché?**
R: No, el sistema funciona automáticamente.

**P: ¿Esto ralentizará mi sitio?**
R: No, al contrario. Los assets se cachean más tiempo, haciendo el sitio más rápido.

**P: ¿Funciona con mi hosting?**
R: Sí, funciona con cualquier hosting. Usa el archivo de configuración apropiado para tu plataforma.

**P: ¿Qué pasa si no uso Vercel/Netlify/Cloudflare?**
R: El hash en los archivos funciona en cualquier plataforma. Los archivos de configuración son opcionales pero recomendados.
