-- Checkpoint 6: delete your account from Settings (CLAUDE.md, Privacy and safety).
-- Deleting your sign-in (auth.users) also deletes your profile, check-ins and moons:
-- they're linked to it with "on delete cascade". The app removes your moon photos from
-- Storage first (lib/store.ts, deleteMyAccount).

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'solcraft:signed_out';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account from public, anon;
grant execute on function public.delete_my_account to authenticated;
