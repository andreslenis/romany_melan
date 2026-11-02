# Plan: Corregir bloqueo de compra en Línea Origen y grid con un solo producto

## Contexto

### Problema 1: "Parece estar en línea singular" pero está guardado como ORIGEN
- En PDP (`src/app/producto/[slug]/page.tsx:114`) se hace `const esSingular = producto.linea === "singular";` con comparación estricta a minúsculas.
- En BD el `enum linea_enum` es `('ORIGEN','SINGULAR')` (mayúsculas). En admin se guarda como `form.linea === "singular" ? "SINGULAR" : "ORIGEN"`.
- `producto` puede venir de `varianteActual` (seleccionado por `colorHilo` entre variantes del mismo `grupo`) o de `productoBase`. Si `varianteActual` termina apuntando a una variante con `linea: 'SINGULAR'` (o con mayúsculas) o si hay alguna inconsistencia, la comparación falla.
- `setLineaActiva` normaliza a minúsculas al cargar pero `esSingular` usa directamente `producto.linea` sin normalizar.
- El bloqueo que exige login solo se aplica cuando `esSingular && !perfil`. Si la comparación es errónea, un producto ORIGEN puede mostrarse como singular.

### Problema 2: Grid ocupa todo el ancho con un solo producto
- En `/coleccion/soberbia` se usa `.products-grid` (SoberbiaClient.tsx:177). La clase `.products-grid` en `src/app/globals.css:797-801` tiene `grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));`.
- Con `auto-fit` y un solo elemento, la grilla estira la única tarjeta para ocupar todo el espacio disponible, en lugar de mantener un ancho similar al resto de tarjetas y dejar espacio vacío a los lados.
- Ocurre también en otras colecciones que usan la misma clase (CollectionClient.tsx:72).

## Causa probable

**1) Normalización de línea**
- Comparación case-sensitive en PDP.
- Posible selección de variante incorrecta: `varianteActual` busca por `colores_hilo` incluido, pero no filtra por línea/consistencia con la variante base. Si existen variantes de distinto línea bajo mismo `grupo` (o datos inconsistentes), se podría obtener una variante con línea distinta.

**2) CSS Grid**
- `auto-fit` con `minmax` flexible permite que 1 elemento se expanda al ancho completo. Para que se comporte como "varias columnas" con huecos, conviene usar `auto-fill` o limitar el número de columnas y alinear al inicio.

## Solución propuesta

### A) Corregir lógica de línea en PDP
1. **Normalizar línea siempre**:
   - Crear `const lineaNorm = String(producto?.linea || "").toLowerCase() as Linea;`
   - Usar `lineaNorm` para `esSingular` (`const esSingular = lineaNorm === "singular";`)
   - Derivar `lineaActiva` desde `lineaNorm` cuando corresponda.
2. **Hacer más robusta la selección de variante**:
   - Al encontrar `varianteActual`, preferir variantes que coincidan con `lineaActiva` si hay ambigüedad.
   - Si no hay match por color dentro de la línea activa, hacer fallback controlado.
3. **Defensiva en render**:
   - Mantener el guard `esSingular && !perfil` pero basado en `lineaNorm`.
   - Usar `lineaNorm` al pasar `lineaId` al carrito.

Archivos a modificar:
- `src/app/producto/[slug]/page.tsx`

### B) Corregir grid para /coleccion/soberbia (y resto)
1. **Ajustar CSS `.products-grid`**:
   - Cambiar a `grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));`
   - Añadir `justify-content: start;`
   - Añadir `.products-grid--single { grid-template-columns: minmax(260px, 320px); justify-content: start; }`
2. **Aplicar clase condicional**:
   - `src/app/coleccion/soberbia/SoberbiaClient.tsx`: añadir clase cuando `productosLinea.length === 1`
   - `src/app/coleccion/[slug]/CollectionClient.tsx`: añadir clase cuando `productosLinea.length === 1`

Archivos a modificar:
- `src/app/globals.css`
- `src/app/coleccion/soberbia/SoberbiaClient.tsx`
- `src/app/coleccion/[slug]/CollectionClient.tsx`

## Riesgos
- Normalización debe cubrir mayúsculas/minúsculas en todos los paths.
- Cambiar `auto-fit` a `auto-fill` deja huecos con pocos elementos (deseado aquí).
- CSS clase condicional es más compatible que `:has()`.

## Validación
- [ ] Producto con línea ORIGEN no solicita login en PDP
- [ ] Compra permitida sin sesión para línea ORIGEN
- [ ] `/coleccion/soberbia` con 1 producto muestra tarjeta compacta alineada a inicio
- [ ] `/coleccion/soberbia` con varios productos mantiene grid responsive
- [ ] Sin regresiones en otras colecciones

## Solicitud de permiso
¿Autorizas ejecutar estos cambios?
