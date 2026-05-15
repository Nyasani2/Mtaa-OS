create or replace function increment_room_count(room_id_input uuid)
returns void as $$

begin

  update public.hookup_rooms
  set current_participants =
    current_participants + 1
  where id = room_id_input;

end;

$$ language plpgsql;
