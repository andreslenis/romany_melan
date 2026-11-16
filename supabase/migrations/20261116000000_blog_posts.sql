-- Gestor de Blog: entradas editables desde /admin
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumen text not null,
  contenido text not null,
  portada text,
  portada_alt text,
  cta_texto text,
  cta_url text,
  categoria text,
  publicado boolean not null default false,
  fecha_publicacion date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists blog_posts_publicado_idx
  on blog_posts (publicado, fecha_publicacion desc);

alter table blog_posts enable row level security;

-- Lectura pública: solo entradas publicadas.
drop policy if exists "anon_read_blog_publicado" on blog_posts;
create policy "anon_read_blog_publicado"
  on blog_posts
  for select
  to anon
  using (publicado = true);

-- Escritura total para el rol autenticado (panel admin).
drop policy if exists "auth_all_blog_posts" on blog_posts;
create policy "auth_all_blog_posts"
  on blog_posts
  for all
  to authenticated
  using (true)
  with check (true);

-- Bucket público para portadas del blog.
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

do $$ begin
  create policy "auth_storage_blog" on storage.objects
    for all to authenticated
    using (bucket_id = 'blog')
    with check (bucket_id = 'blog');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon_read_blog" on storage.objects
    for select to anon
    using (bucket_id = 'blog');
exception when duplicate_object then null;
end $$;

-- Seed: artículo existente (respaldo en content/blog/).
insert into blog_posts (
  slug, titulo, resumen, contenido, portada, portada_alt,
  cta_texto, cta_url, categoria, publicado, fecha_publicacion
)
values (
  'significado-espiritual-propiedades-amatista-joyeria-autor',
  'El Significado Espiritual y las Propiedades de la Amatista en la Joyería de Autor',
  'Descubre el significado espiritual de la amatista, sus propiedades y cómo la integramos en la Colección Soberbia de Romany Melan: joyería de autor en micro macramé y metales nobles.',
  $md$En el universo de la joyería artesanal, pocas gemas poseen la profundidad mística y la elegancia magnética de la amatista. Con su característico tono que va desde un lila sutil hasta un morado profundo, esta piedra preciosa ha sido venerada durante milenios no solo por su belleza estética, sino por la energía de transformación y calma que transmite a quien la lleva.

En Romany Melan, entendemos que una joya no es un simple accesorio; es un amuleto personal, una extensión de la historia de quien la viste. Por eso, hemos integrado la amatista como el alma de nuestra Colección Soberbia, una línea diseñada para quienes buscan expresar su poder interior a través del arte textil del micro macramé y los metales nobles.

## ¿Qué es la Amatista y cuál es su simbolismo ancestral?

La amatista es una variedad macrocristalina del cuarzo. Su nombre proviene del griego *amethystos*, que significa "no intoxicado", ya que en la antigüedad se creía que protegía a su portador de los excesos y aportaba claridad mental.

Más allá de la mística antigua, en el diseño de joyería contemporánea de autor, la amatista representa:

- **Equilibrio y Calma:** su energía está profundamente conectada con la tranquilidad espiritual, ayudando a disipar el estrés de la vida urbana moderna.
- **Transformación y Autenticidad:** representa la elevación del espíritu y la confianza en uno mismo, pilares fundamentales del concepto detrás de nuestra colección.
- **Exclusividad Natural:** al ser una piedra de origen natural, no existen dos cristales iguales. Cada pieza tallada cuenta con vetas y matices únicos que garantizan que tu joya sea irrepetible.

## La Fusión del Arte: Micro Macramé, Metales Nobles y Mineralogía

Crear una pieza de joyería de autor en Colombia requiere un dominio absoluto de la técnica y un respeto profundo por los materiales. En Romany Melan, combinamos la amatista natural con:

### Metales Nobles

Estructuras en oro laminado y plata que aportan brillo, durabilidad y un contraste sofisticado con el tono morado de la gema.

### El Arte del Micro Macramé

Hilos de alta resistencia tejidos a mano milímetro a milímetro mediante nudos complejos. Esta técnica ancestral abraza la piedra sin necesidad de adhesivos químicos, logrando una pieza orgánica, ligera y eterna.

## Lleva la Energía de la Colección Soberbia contigo

Si buscas una joya que combine la sofisticación del diseño hecho a mano con el simbolismo ancestral de las piedras naturales, te invitamos a descubrir la Colección Soberbia. Cada collar, anillo o pieza de esta serie ha sido tejido exclusivamente para reflejar elegancia, carácter y distinción.

¿Lista para conectar con la energía de la amatista? Explora las piezas exclusivas disponibles en nuestra tienda y lleva una historia tejida a mano en tu piel.$md$,
  'https://ztmlhbatqlizozmlcyqm.supabase.co/storage/v1/object/public/productos/1794506437152-5zo15bcqpab-zoom_collar_amatista_pura_1.jpg',
  'Collar artesanal con amatista natural de la Colección Soberbia de Romany Melan',
  'Ver la Colección Soberbia',
  '/coleccion/soberbia',
  'Mineralogía',
  true,
  '2026-11-15'
)
on conflict (slug) do nothing;