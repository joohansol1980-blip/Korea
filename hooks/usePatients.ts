import { useState, useEffect } from 'react';
import { Patient, AppSettings } from '../types';
import { initSupabase, getSupabaseClient, getLocalPatients, saveLocalPatients } from '../services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';

export const usePatients = (
  settings: AppSettings, 
  triggerNotification: (msg: string, type: 'info' | 'success' | 'alert') => void
) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const connectSupabase = async () => {
      if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
        const success = initSupabase(settings.supabaseUrl, settings.supabaseKey);
        setIsSupabaseConnected(success);

        if (success) {
          const supabase = getSupabaseClient();
          if (supabase) {
            // Fetch Initial Data
            const { data, error } = await supabase
              .from('patients')
              .select('*')
              .order('created_at', { ascending: true });
            
            if (!error && data) {
              setPatients(data as Patient[]);
            }

            // Realtime Subscription
            channel = supabase
              .channel('schema-db-changes')
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                (payload) => {
                  if (payload.eventType === 'INSERT') {
                    const newPatient = payload.new as Patient;
                    setPatients(prev => [...prev, newPatient]);
                    triggerNotification(`새 메모: ${newPatient.name}`, 'alert');
                  } else if (payload.eventType === 'UPDATE') {
                    const updatedPatient = payload.new as Patient;
                    setPatients(prev => prev.map(p => p.id === payload.new.id ? updatedPatient : p));
                    
                    if (updatedPatient.status === 'in-progress') {
                       triggerNotification(`확인 중: ${updatedPatient.name}`, 'success');
                    } else if (updatedPatient.status === 'waiting') {
                       triggerNotification(`대기 이동: ${updatedPatient.name}`, 'info');
                    }
                  } else if (payload.eventType === 'DELETE') {
                     setPatients(prev => prev.filter(p => p.id !== payload.old.id));
                  }
                }
              )
              .subscribe();
          }
        }
      } else {
        setIsSupabaseConnected(false);
        setPatients(getLocalPatients());
      }
    };

    connectSupabase();

    return () => {
      const supabase = getSupabaseClient();
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [settings.useSupabase, settings.supabaseUrl, settings.supabaseKey, triggerNotification]);

  const addPatient = async (name: string, treatment: string) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name,
      treatment,
      status: 'waiting',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').insert([
        { 
          name, 
          treatment, 
          status: 'waiting' 
        }
      ]);
      // Note: Realtime subscription will handle state update and notification
    } else {
      const updated = [...patients, newPatient];
      setPatients(updated);
      saveLocalPatients(updated);
      triggerNotification(`새 메모: ${name}`, 'alert');
    }
  };

  const updateStatus = async (id: string, status: Patient['status']) => {
    const patientName = patients.find(p => p.id === id)?.name || '';

    if (status === 'done' && !isSupabaseConnected) {
       deletePatient(id);
       return;
    }
    
    if (status === 'done' && isSupabaseConnected) {
        const supabase = getSupabaseClient();
        await supabase?.from('patients').delete().eq('id', id);
        return;
    }

    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').update({ status }).eq('id', id);
       // Realtime handles update
    } else {
      const updated = patients.map(p => p.id === id ? { ...p, status } : p);
      setPatients(updated);
      saveLocalPatients(updated);
      
      if (status === 'in-progress') {
        triggerNotification(`확인 중: ${patientName}`, 'success');
      } else {
        triggerNotification(`대기 이동: ${patientName}`, 'info');
      }
    }
  };

  const deletePatient = async (id: string) => {
    if (isSupabaseConnected) {
      const supabase = getSupabaseClient();
      await supabase?.from('patients').delete().eq('id', id);
    } else {
      const updated = patients.filter(p => p.id !== id);
      setPatients(updated);
      saveLocalPatients(updated);
    }
  };

  return {
    patients,
    isSupabaseConnected,
    addPatient,
    updateStatus,
    deletePatient
  };
};