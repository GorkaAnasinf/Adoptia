-- Corrige escalada de privilegios: el trigger de alta aceptaba cualquier
-- user_role de la metadata del signup (p. ej. 'admin' vía API directa).
-- Ahora solo se admiten 'adopter' y 'shelter'; cualquier otro valor cae a 'adopter'.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol_solicitado text := new.raw_user_meta_data ->> 'role';
  rol_final public.user_role;
begin
  if rol_solicitado in ('adopter', 'shelter') then
    rol_final := rol_solicitado::public.user_role;
  else
    rol_final := 'adopter';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    rol_final,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
