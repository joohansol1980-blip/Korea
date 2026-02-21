export interface Patient {
  id: string;
  name: string;
  treatment: string;
  status: 'waiting' | 'in-progress' | 'done';
  created_at: string;
}

export interface AppSettings {
  supabaseUrl: string;
  supabaseKey: string;
  geminiApiKey: string;
  useSupabase: boolean;
  enableSystemNotifications: boolean;
}

export enum ViewMode {
  DESK = 'DESK',
  BOARD = 'BOARD'
}