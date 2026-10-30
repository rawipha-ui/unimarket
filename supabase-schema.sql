
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'สมาชิก UniMarket',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 90),
  price numeric(12,2) not null check (price >= 0),
  category text not null,
  description text default '',
  seller_contact text not null,
  image_url text,
  status text not null default 'active' check (status in ('active','sold','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists products_created_at_idx on public.products(created_at desc);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_seller_id_idx on public.products(seller_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.favorites enable row level security;

create policy "Profiles are viewable by everyone"
on public.profiles for select using (true);

create policy "Users can insert their own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

create policy "Active products are public"
on public.products for select
using (status = 'active' or auth.uid() = seller_id);

create policy "Signed-in users can create their own products"
on public.products for insert to authenticated
with check (auth.uid() = seller_id);

create policy "Sellers can update their own products"
on public.products for update to authenticated
using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

create policy "Sellers can delete their own products"
on public.products for delete to authenticated
using (auth.uid() = seller_id);

create policy "Users can view their own favorites"
on public.favorites for select to authenticated
using (auth.uid() = user_id);

create policy "Users can add their own favorites"
on public.favorites for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
on public.favorites for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'สมาชิก UniMarket')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy "Product images are publicly viewable"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Signed-in users upload to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete their own product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
