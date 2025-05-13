import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with better error handling
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },    global: {
      fetch: (...args) => {
        return fetch(...args).catch((error) => {
          console.error('Supabase fetch error:', error);
          throw error;
        });
      },
    },
  }
);

// Type definitions for the game sessions table
export type GameSession = {
  id: string;
  created_at: string;
  game_state: any; // This includes the game state and metadata
  last_activity: string;
};

// Helper functions for game sessions
export const createGameSession = async (gameState: any): Promise<string | null> => {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert([{ game_state: gameState }])
    .select();
  
  if (error) {
    console.error('Error creating game session:', error);
    return null;
  }
  
  return data?.[0]?.id;
};

export const getGameSession = async (sessionId: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (error) {
    console.error('Error fetching game session:', error);
    return null;
  }
  
  return data;
};

export const updateGameSession = async (sessionId: string, gameState: any): Promise<boolean> => {
  const { error } = await supabase
    .from('game_sessions')
    .update({ 
      game_state: gameState,
      last_activity: new Date().toISOString()
    })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Error updating game session:', error);
    return false;
  }
  
  return true;
};

// Subscribe to game session changes with improved error handling and fallback polling
export const subscribeToGameSession = (
  sessionId: string,
  callback: (payload: any) => void
) => {
  // First check if the session exists to prevent subscription to non-existent sessions
  getGameSession(sessionId).catch(err => console.error('Error checking session before subscribe:', err));
  
  // Store the last state to compare changes
  let lastState: any = null;
  let pollingInterval: NodeJS.Timeout | null = null;
  let subscriptionFailed = false;
  
  try {
    const channel = supabase
      .channel(`game_session_${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          console.log('Received realtime update:', payload);
          callback(payload);
          // Update lastState with the new state
          if (payload.new) {
            lastState = payload.new;
          }
        }
      )      .subscribe((status: any) => {
        console.log(`Subscription status for game ${sessionId}:`, status);
        
        // If subscription failed or has error status, start polling as fallback
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime updates');
        } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log('Subscription failed with status:', status);
          subscriptionFailed = true;
          startPolling();
        }
      });
      
    // Add event handlers for connection status
    channel
      .on('system', 'error', (error: Error) => {
        console.error('Realtime subscription error:', error);
        subscriptionFailed = true;
        // Start polling as fallback if subscription fails
        startPolling();
      });
      // Declare the function first so it's available throughout the scope
    function startPolling() {
      // Only start polling if not already polling
      if (!pollingInterval && subscriptionFailed) {
        console.log('Starting polling fallback for session updates');
        pollingInterval = setInterval(async () => {
          try {
            const session = await getGameSession(sessionId);
            // Only trigger callback if data changed
            if (session && (!lastState || 
                JSON.stringify(session.game_state) !== JSON.stringify(lastState?.game_state))) {
              console.log('Detected change via polling');
              const oldState = lastState;
              lastState = session;
              // Mimic the realtime payload structure
              callback({
                new: session,
                old: oldState,
                eventType: 'UPDATE',
                table: 'game_sessions'
              });
            }
          } catch (err) {
            console.error('Error polling for updates:', err);
          }
        }, 2000); // Poll every 2 seconds
      }
    }
      
    return {
      ...channel,
      unsubscribe: () => {
        // Clear polling interval if it exists
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        // Unsubscribe from channel
        channel.unsubscribe();
      }
    };
  } catch (error) {
    console.error('Error setting up realtime subscription:', error);
    // Start polling as fallback
    if (!pollingInterval) {
      startPollingFallback();
    }
    return {
      unsubscribe: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        console.log('No active subscription to unsubscribe from');
      }
    };
  }
    // Standalone polling function for the catch block
  function startPollingFallback() {
    console.log('Starting polling fallback after subscription error');
    pollingInterval = setInterval(async () => {
      try {
        const session = await getGameSession(sessionId);
        if (session && (!lastState || 
            JSON.stringify(session.game_state) !== JSON.stringify(lastState?.game_state))) {
          console.log('Detected change via polling fallback');
          const oldState = lastState;
          lastState = session;
          callback({
            new: session,
            old: oldState,
            eventType: 'UPDATE',
            table: 'game_sessions'
          });
        }
      } catch (err) {
        console.error('Error in fallback polling:', err);
      }
    }, 2000);
  }
};
