
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  name TEXT NOT NULL DEFAULT 'Untitled Room',
  language TEXT NOT NULL DEFAULT 'javascript',
  code TEXT NOT NULL DEFAULT '// Welcome to CodeSync!
console.log("Hello, CodeSync!");',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_members table
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create code_snapshots table
CREATE TABLE public.code_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Snapshot',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Rooms policies
CREATE POLICY "Room members and owner can view rooms" ON public.rooms FOR SELECT USING (
  owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = rooms.id AND room_members.user_id = auth.uid())
);
CREATE POLICY "Anyone can view rooms by code" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Room members can update rooms" ON public.rooms FOR UPDATE USING (
  owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = rooms.id AND room_members.user_id = auth.uid())
);
CREATE POLICY "Room owner can delete rooms" ON public.rooms FOR DELETE USING (auth.uid() = owner_id);

-- Room members policies
CREATE POLICY "Members can view room members" ON public.room_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid())
);
CREATE POLICY "Authenticated users can join rooms" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_members FOR DELETE USING (auth.uid() = user_id);

-- Code snapshots policies
CREATE POLICY "Room members can view snapshots" ON public.code_snapshots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = code_snapshots.room_id AND room_members.user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create snapshots" ON public.code_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
