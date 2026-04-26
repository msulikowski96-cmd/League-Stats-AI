export interface TournamentIds {
  tournament_id: string;
  tournament_stage_id: string;
  tournament_template_id: string;
  season_id: string;
  tournament_stages: { tournament_stage_id: string; name: string }[];
}

export interface TournamentDetails {
  tournament_id: string;
  tournament_stage_id: string;
  name: string;
  image_path?: string;
  country?: {
    name?: string;
    image_path?: string;
    small_image_path?: string;
  };
  start_year?: string;
  end_year?: string;
  is_current?: boolean;
  stage_start_date_timestamp?: number;
  stage_end_date_timestamp?: number;
  winner?: unknown[];
}

export interface TournamentCardTeam {
  position: number;
  name: string;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  form?: string[];
}
