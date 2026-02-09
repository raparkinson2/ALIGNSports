-- Teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  opponent TEXT NOT NULL,
  game_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  home_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player game stats table
CREATE TABLE player_game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  minutes_played INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all access to teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all access to players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all access to games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all access to player_game_stats" ON player_game_stats FOR ALL USING (true);
