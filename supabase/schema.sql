-- Nine Men's Morris Game Sessions Schema

-- Create the Game Sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  game_state JSONB NOT NULL,
  player1_id TEXT,
  player2_id TEXT
);

-- Enable Row Level Security
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Add comment to the table
COMMENT ON TABLE public.game_sessions IS 'Stores the game state for Nine Men''s Morris games';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON public.game_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_last_activity ON public.game_sessions(last_activity);

-- Create a policy that allows anyone to select from the game_sessions table
CREATE POLICY select_game_sessions ON public.game_sessions
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert into the game_sessions table
CREATE POLICY insert_game_sessions ON public.game_sessions
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to update the game_sessions table
CREATE POLICY update_game_sessions ON public.game_sessions
  FOR UPDATE USING (true);

-- Set up a function for cleaning up old game sessions
CREATE OR REPLACE FUNCTION cleanup_old_game_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.game_sessions
  WHERE last_activity < NOW() - INTERVAL '7 days';
END;
$$;

-- Function to update last_activity timestamp when game state is updated
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to update last_activity on game state update
CREATE TRIGGER update_game_session_last_activity
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  WHEN (OLD.game_state IS DISTINCT FROM NEW.game_state)
  EXECUTE FUNCTION update_last_activity();

-- Enable realtime for game_sessions table
DO $$
BEGIN
  -- Check if the publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add the table to the existing publication
    ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
  ELSE
    -- Create the publication if it doesn't exist
    CREATE PUBLICATION supabase_realtime FOR TABLE game_sessions;
  END IF;
END
$$;
