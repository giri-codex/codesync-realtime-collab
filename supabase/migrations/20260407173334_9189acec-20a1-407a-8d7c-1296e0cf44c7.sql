
-- Create SECURITY DEFINER helper to check room membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE user_id = _user_id AND room_id = _room_id
  )
$$;

-- Create helper to check room ownership
CREATE OR REPLACE FUNCTION public.is_room_owner(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = _room_id AND owner_id = _user_id
  )
$$;

-- Drop all existing recursive policies
DROP POLICY IF EXISTS "Room members and owner can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view rooms by code" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room members can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room owner can delete rooms" ON public.rooms;

DROP POLICY IF EXISTS "Members can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;

DROP POLICY IF EXISTS "Room members can view snapshots" ON public.code_snapshots;
DROP POLICY IF EXISTS "Authenticated users can create snapshots" ON public.code_snapshots;

-- Recreate rooms policies (no recursion)
CREATE POLICY "Anyone can view rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner or member can update rooms" ON public.rooms
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_room_member(auth.uid(), id));

CREATE POLICY "Owner can delete rooms" ON public.rooms
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Recreate room_members policies (no recursion)
CREATE POLICY "Anyone can view room members" ON public.room_members
  FOR SELECT TO authenticated
  USING (public.is_room_member(auth.uid(), room_id));

CREATE POLICY "Users can join rooms" ON public.room_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.room_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Recreate code_snapshots policies (no recursion)
CREATE POLICY "Members can view snapshots" ON public.code_snapshots
  FOR SELECT TO authenticated
  USING (public.is_room_member(auth.uid(), room_id));

CREATE POLICY "Users can create snapshots" ON public.code_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
