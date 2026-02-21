import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Patient } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
  if (url && key) {
    try {
      supabase = createClient(url, key);
      return true;
    } catch (e) {
      console.error("Invalid Supabase Config", e);
      return false;
    }
  }
  return false;
};

export const getSupabaseClient = () => supabase;

// Fallback for local storage when Supabase is not configured
export const getLocalPatients = (): Patient[] => {
  const data = localStorage.getItem('local_patients');
  return data ? JSON.parse(data) : [];
};

export const saveLocalPatients = (patients: Patient[]) => {
  localStorage.setItem('local_patients', JSON.stringify(patients));
};