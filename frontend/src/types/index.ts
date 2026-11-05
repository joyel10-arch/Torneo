// Torneo — TypeScript type definitions

export type UserRole = 'admin' | 'organizer' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TournamentFormat =
  | 'single_elimination'
  | 'round_robin'
  | 'league_then_knockout';

export interface Tournament {
  id: string;
  name: string;
  sport: string;
  description?: string;
  season?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  venue_group?: string;
  max_teams: number;
  format: TournamentFormat;
  status: TournamentStatus;
  team_count: number;
  total_matches: number;
  completed_matches: number;
  completion_pct: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  short_code?: string;
  sport: string;
  college?: string;
  coach?: string;
  contact_email?: string;
  logo_url?: string;
  created_at: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  team_id: string;
  team_name: string;
  short_code?: string;
  logo_url?: string;
  college?: string;
  seed?: number;
  rank?: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  points: number;
  registered_at: string;
}

export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'cancelled'
  | 'bye';

export interface Match {
  id: string;
  tournament_id: string;
  round_number: number;
  round_name?: string;
  match_number?: number;
  home_team_id?: string;
  away_team_id?: string;
  home_team_name?: string;
  away_team_name?: string;
  home_team_logo?: string;
  away_team_logo?: string;
  home_score?: number;
  away_score?: number;
  home_penalties?: number;
  away_penalties?: number;
  winner_id?: string;
  winner_name?: string;
  scheduled_at?: string;
  venue_id?: string;
  venue_name?: string;
  status: MatchStatus;
  notes?: string;
  is_bye: boolean;
  parent_match_id?: string;
  home_feeder_match_id?: string;
  away_feeder_match_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BracketRound {
  round_number: number;
  round_name: string;
  matches: Match[];
}

export interface Bracket {
  tournament_id: string;
  rounds: BracketRound[];
  total_matches: number;
}

export interface Venue {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  is_available: boolean;
  notes?: string;
  match_count: number;
  created_at: string;
}

export interface StandingEntry {
  team_id: string;
  team_name: string;
  short_code?: string;
  logo_url?: string;
  rank: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  points: number;
}

export interface Analytics {
  tournament_id: string;
  tournament_name: string;
  status: TournamentStatus;
  team_count: number;
  total_matches: number;
  completed_matches: number;
  upcoming_matches: number;
  completion_pct: number;
  total_goals: number;
  avg_goals_per_match: number;
  round_distribution: { round: string; count: number }[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  tournament_id?: string;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  event_type: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  user_id?: string;
}

// DSA Types
export interface BubbleSortStep {
  phase: string;
  array: string[];
  comparison_indices: number[];
  swapped: boolean;
  message: string;
}

export interface BubbleSortResult {
  sorted_teams: StandingEntry[];
  comparisons: number;
  swaps: number;
  steps: BubbleSortStep[];
  goal_differences: number[];
  complexity_info: {
    best_case: string;
    average_case: string;
    worst_case: string;
    space: string;
    actual_comparisons: number;
    actual_swaps: number;
    n: number;
    note: string;
  };
}

export interface BinarySearchStep {
  low: number;
  high: number;
  mid: number;
  mid_value?: string;
  search_key?: string;
  message: string;
}

export interface BinarySearchResult {
  found: boolean;
  index: number;
  comparisons: number;
  steps: BinarySearchStep[];
  result?: { team_id: string; team_name: string } | null;
  error?: string;
}

export interface TreeNode {
  match_id: string;
  round_number: number;
  round_name: string;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  winner?: string;
  status: string;
  is_bye: boolean;
  left_child_id?: string;
  right_child_id?: string;
  parent_id?: string;
}

export interface TournamentTreeData {
  root?: TreeNode;
  height: number;
  node_count: number;
  champion?: { winner: string; final_match_id: string; final_score: string } | null;
  preorder: TreeNode[];
  inorder: TreeNode[];
  postorder: TreeNode[];
  level_order: TreeNode[][];
}

export interface GraphData {
  vertices: string[];
  edges: Record<string, string[]>;
  vertex_count: number;
  edge_count: number;
  vertex_data: Record<string, Match>;
}

export interface TraversalResult {
  traversal: string[];
  steps: {
    action: string;
    vertex: string;
    queue?: string[];
    stack?: string[];
    visited: string[];
    message: string;
  }[];
  start: string;
  visited_count: number;
}
