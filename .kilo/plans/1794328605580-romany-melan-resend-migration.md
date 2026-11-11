# Plan: Migrar Email de Bienvenida de Supabase Auth Templates a Resend

## Contexto Actual
- `ProfileContext.registrar()` usa `supabase.auth.signUp()` con `emailRedirectTo: "/mi-perfil"`
- Supabase envía email de confirmación automático (configurable en Dashboard > Email Templates)
- Usuario quiere usar **Resend** para email de bienvenida personalizado con el texto específico proporcionado

## Decisiones Confirmadas
1. **Enfoque**: Opción A - Supabase maneja verificación de email (security), Resend envía email de bienvenida (UX)
2. **Dominio**: Tienen dominio verificado en Resend (ej: `romanymelan.com`), usar `noreply@romanymelan.com` como FROM
3. **Error handling**: Solo log y continuar (no rollback del usuario si falla email)
4. **Rate limiting**: No necesario inicialmente (endpoint solo se llama tras signup exitoso)

## Cambios Requeridos

### 1. Dependencias
- Agregar `resend` a `package.json`
- `npm install resend`

### 2. Variables de Entorno (`.env.local`)
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@romanymelan.com
```

### 3. API Route: `src/app/api/auth/welcome-email/route.ts`
- POST endpoint que recibe `{ email, nombre }`
- Valida que venga de cliente autenticado (opcional: verificar session Supabase)
- Usa `resend.emails.send()` con template HTML
- Retorna `{ success: true }` o error 500 con log

### 4. Template HTML: `src/lib/email/welcome-template.ts`
- Función `generateWelcomeEmail(nombre: string): string`
- HTML con estilos inline (compatibilidad email clients)
- Variables: `{{nombre}}` → nombre del cliente
- Texto completo del requirement (asunto + cuerpo)

### 5. Modificar `ProfileContext.registrar()` (`src/context/ProfileContext.tsx`)
- Después de `supabase.auth.signUp()` exitoso y `data.user` existe
- Hacer `fetch("/api/auth/welcome-email", { method: "POST", body: JSON.stringify({ email: datos.email, nombre: datos.nombre }) })`
- No await bloqueante (fire-and-forget) o await con try/catch que solo loggea
- No lanzar error si falla el email

### 6. Supabase Dashboard (Configuración Manual)
- Authentication > Email Templates > "Confirm signup": mantener template simple (solo `{{ .ConfirmationURL }}`)
- NO deshabilitar - Supabase debe seguir enviando email de verificación

### 7. Documentación
- Actualizar `.env.example` con nuevas variables

## Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `package.json` | Agregar `resend` dependency |
| `.env.local` | Agregar `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (usuario configura) |
| `.env.example` | Documentar variables nuevas |
| `src/app/api/auth/welcome-email/route.ts` | **Nuevo** - API endpoint POST |
| `src/lib/email/welcome-template.ts` | **Nuevo** - Template HTML generator |
| `src/context/ProfileContext.tsx` | Modificar `registrar()` para llamar API tras signup |

## Flujo Final
1. Usuario completa formulario en `/crear-perfil`
2. `ProfileContext.registrar()` llama `supabase.auth.signUp()`
3. Supabase crea usuario + envía email de verificación (link a `/mi-perfil`)
4. Si signup exitoso → `fetch("/api/auth/welcome-email", { email, nombre })`
5. Resend envía email de bienvenida HTML bonito
6. Usuario verifica email via link Supabase → accede a `/mi-perfil`

## Validación
- `npm run build` exitoso
- Probar flujo completo: crear perfil → recibe 2 emails (verificación Supabase + bienvenida Resend)
- Verificar que link confirmación Supabase redirige a `/mi-perfil`
- Verificar HTML email Resend se renderiza correctamente