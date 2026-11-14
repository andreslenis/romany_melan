# Login Google en Supabase (y limpieza del OAuth Server)

## Contexto

- El callback OAuth ya está corregido: `src/app/auth/callback/page.tsx` es una página cliente que
  deja que `supabase-js` procese el fragmento implícito (`getSession()` → `_initialize()` →
  `_getSessionFromURL('implicit')`) y, si aplica, ejecuta `exchangeCodeForSession(code)`.
  `src/app/api/auth/profile-sync/route.ts` crea el espejo en `perfiles` con `service_role`.
  El antiguo `src/app/auth/callback/route.ts` (servidor) fue eliminado.
- El usuario aplicó la migración y **activó "OAuth Server"** en el dashboard de Supabase. Eso es el
  **servidor de autorización OAuth 2.1** (para clientes MCP / asistentes de IA), **no** el login
  social. Sus endpoints (`/auth/v1/oauth/authorize`, `/auth/v1/oauth/token`, JWKS, OIDC discovery) y
  el "Preview Authorization URL" `http://localhost:3000/auth/callback/oauth/consent` no tienen
  relación con Google/Apple: el login social se configura en
  **Authentication → Sign In / Providers**.
- Estado real del proyecto: no hay proveedores configurados todavía, así que "Continuar con Google"
  y "Continuar con Apple" fallan al redirigir.

## Decisiones tomadas

1. **Deshabilitar el OAuth Server.** No se usará MCP; si queda activo sin ruta de consentimiento
   (`/auth/callback/oauth/consent` no existe en la app) queda configuración colgando y se habilita
   superficie de registro dinámico de clientes OAuth en el proyecto.
2. **Apple fuera por ahora.** No hay cuenta de Apple Developer (Services ID), y sin ella el botón
   lleva a un error. Se oculta con un flag de configuración, no se borra el método.
3. **Google es el único proveedor OAuth activo.**
4. **Dominio de producción:** `https://www.romanymelan.com` (usado en `src/app/producto/[slug]/page.tsx:18`
   y en `RESEND_FROM_EMAIL`).

## Tareas

### 1. Supabase Dashboard — desactivar OAuth Server

1. Authentication → OAuth Server → desactivar el servidor OAuth 2.1.
2. Verificar que "Allow Dynamic OAuth Apps" (registro dinámico de clientes) quede desactivado.
3. Confirmar que ya no se publicitan `/auth/v1/oauth/authorize` ni `/auth/v1/oauth/token`.

### 2. Supabase Dashboard — URLs de la app

1. Authentication → URL Configuration:
   - **Site URL:** `https://www.romanymelan.com`
   - **Redirect URLs** (allow list, exactas):
     - `http://localhost:3000/auth/callback`
     - `https://www.romanymelan.com/auth/callback`
2. Comprobar que `https://ztmlhbatqlizozmlcyqm.supabase.co/auth/v1/callback` **no** sea necesaria en
   la allow list: es la URL que Supabase registra en Google, no la que usa el navegador.

### 3. Google Cloud — credenciales OAuth

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → **Web application**.
2. **Authorized redirect URI:** `https://ztmlhbatqlizozmlcyqm.supabase.co/auth/v1/callback`
   (una sola, sin `/auth/v1/callback/` duplicado).
3. Copiar **Client ID** y **Client secret**.
4. Supabase → Authentication → Sign In / Providers → **Google**: pegar credenciales, habilitar y
   guardar. Dejar el resto por defecto.
5. Si Google muestra "Google hasn't verified this app": en el consent screen poner la app en modo
   *Testing* y añadir los correos de prueba; no bloquea el login.

### 4. Código — ocultar el botón de Apple

1. Crear `src/lib/auth-config.ts`:
   ```ts
   /** Proveedores OAuth habilitados en Supabase (Authentication > Sign In / Providers). */
   export const GOOGLE_LOGIN_ENABLED = true;
   export const APPLE_LOGIN_ENABLED = false;
   ```
2. `src/components/profile/CrearPerfil.tsx`: importar los flags y filtrar `PROVEEDORES` antes de
   renderizar (`PROVEEDORES.filter((p) => p.id === "google" || APPLE_LOGIN_ENABLED)`). Mantener el
   tipo `Proveedor = "google" | "apple"` y `signInWithApple` sin cambios.
3. `src/app/inicio-sesion/page.tsx`: renderizar el bloque del botón Apple solo si
   `APPLE_LOGIN_ENABLED`, e igual para Google con `GOOGLE_LOGIN_ENABLED`. Sin cambios en
   `authLoading`/`authError`.
4. No tocar `ProfileContext` (`signInWithGoogle`/`signInWithApple`/`signOut` quedan igual) ni el
   callback.

### 5. Verificación

1. `npx tsc --noEmit` (limpiar antes `.next/types/app/auth/callback` si queda el tipo generado del
   `route.ts` eliminado).
2. `npm run lint` — solo warnings preexistentes (`img`, `exhaustive-deps`).
3. `npm run build`.
4. Manual, en `http://localhost:3000`:
   - `Crear perfil` y `Iniciar sesión` muestran **un solo** botón (Google) y el formulario de correo.
   - Google → vuelve a `/auth/callback` → aterriza en `/mi-perfil` sin pantalla de error.
   - La URL final no conserva `#access_token=...`.
   - `perfiles` recibe una fila con `user_id`, `email`, `proveedor = "google"`, `miembro = true`
     (visible en Authentication → Users y en la tabla `perfiles`).
   - Recargar `/mi-perfil` mantiene la sesión; `Cerrar sesión` la borra.
   - Login con correo/contraseña sigue funcionando y no es pisado por el callback.
5. Manual, en producción (`https://www.romanymelan.com`): repetir el flujo de Google una vez.

## Riesgos y notas

- **Service role key:** si `SUPABASE_SERVICE_ROLE_KEY` no está definida en producción,
  `supabaseAdmin` cae al anon key y el espejo en `perfiles` falla en silencio (solo queda en logs).
  Verificar la variable antes de dar por cerrado el flujo.
- **Proveedor de Apple:** si más adelante se habilita, requiere Services ID + dominio verificado y
  añadir `https://www.romanymelan.com/auth/callback` a la allow list de Supabase.
- **Registro con correo:** `registrar()` no crea fila en `perfiles` (el alta la hace Wompi en
  postpago). **Fuera de alcance** de este plan; si se quiere, usar `POST /api/auth/profile-sync`
  tras `signUp`/`signInWithPassword`.
- No se requiere migración SQL nueva para este plan.