import { supabase } from './supabaseClient';
import { UserRole } from './supabaseClient';

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole | null;
}

/**
 * Signs in a dev user with email and password
 */
export async function signInAsDev(email: string, password: string): Promise<AuthUser> {
  console.log('[AuthService] signInAsDev: Starting sign-in for', email);
  const signInStartTime = Date.now();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const signInElapsed = Date.now() - signInStartTime;
  console.log(`[AuthService] signInAsDev: Sign-in completed in ${signInElapsed}ms`);

  if (error) {
    console.error('[AuthService] signInAsDev: Sign-in error:', error);
    console.error('[AuthService] Error details:', {
      message: error.message,
      status: error.status
    });
    throw error;
  }

  if (!data.user) {
    console.error('[AuthService] signInAsDev: No user returned from sign in');
    throw new Error('No user returned from sign in');
  }

  const userId = data.user.id;
  const userEmail = data.user.email;
  console.log('[AuthService] signInAsDev: User ID:', userId);

  // Fetch the user's profile to get their role
  console.log('[AuthService] signInAsDev: Fetching profile...');
  const profileStartTime = Date.now();
  
  // Retry profile fetch once if it fails, as sometimes it takes a moment for the trigger to create it
  let profile = null;
  let profileError = null;
  
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (!error) {
      profile = profileData;
      break;
    }
    
    profileError = error;
    if (attempt === 0) {
      console.warn(`[AuthService] signInAsDev: Profile fetch attempt 1 failed, retrying in 500ms...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const profileElapsed = Date.now() - profileStartTime;
  console.log(`[AuthService] signInAsDev: Profile fetch completed in ${profileElapsed}ms (Success: ${!!profile})`);

  if (profileError && !profile) {
    console.error('[AuthService] signInAsDev: Error fetching profile:', profileError);
  }

  console.log('[AuthService] signInAsDev: Profile role:', profile?.role);

  return {
    id: userId,
    email: userEmail,
    role: profile?.role || null,
  };
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Gets the current authenticated user and their role
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  console.log('[AuthService] getCurrentUser: Checking session...');
  const sessionStartTime = Date.now();
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const sessionElapsed = Date.now() - sessionStartTime;
  console.log(`[AuthService] getCurrentUser: Session check completed in ${sessionElapsed}ms`);
  
  if (sessionError) {
    console.error('[AuthService] getCurrentUser: Session error:', sessionError);
    return null;
  }
  
  if (!session?.user) {
    console.log('[AuthService] getCurrentUser: No session found');
    return null;
  }

  console.log('[AuthService] getCurrentUser: Session found, user ID:', session.user.id);
  console.log('[AuthService] getCurrentUser: Fetching profile...');
  const profileStartTime = Date.now();

  // Fetch the user's profile to get their role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const profileElapsed = Date.now() - profileStartTime;
  console.log(`[AuthService] getCurrentUser: Profile fetch completed in ${profileElapsed}ms`);

  if (profileError) {
    console.error('[AuthService] getCurrentUser: Error fetching profile:', profileError);
    console.error('[AuthService] Profile error details:', {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint
    });
    // Return user without role rather than failing completely
    return {
      id: session.user.id,
      email: session.user.email,
      role: null,
    };
  }

  console.log('[AuthService] getCurrentUser: Profile role:', profile?.role);

  return {
    id: session.user.id,
    email: session.user.email,
    role: profile?.role || null,
  };
}

/**
 * Checks if the current user has the dev role
 */
export async function isDevRole(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'dev';
}

/**
 * Gets the current user's role
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}

/**
 * Listens to authentication state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  console.log('[AuthService] onAuthStateChange: Setting up listener...');
  
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[AuthService] onAuthStateChange: Event received:', event);
    console.log('[AuthService] onAuthStateChange: Session:', session ? {
      userId: session.user.id,
      email: session.user.email
    } : 'null');

    if (session?.user) {
      console.log('[AuthService] onAuthStateChange: Fetching profile for user:', session.user.id);
      const profileStartTime = Date.now();
      
      try {
        // Retry profile fetch once if it fails
        let profile = null;
        let profileError = null;

        for (let attempt = 0; attempt < 2; attempt++) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error) {
            profile = data;
            break;
          }
          profileError = error;
          if (attempt === 0) {
            console.warn(`[AuthService] onAuthStateChange: Profile fetch retry for user ${session.user.id}`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        const profileElapsed = Date.now() - profileStartTime;
        console.log(`[AuthService] onAuthStateChange: Profile fetch completed in ${profileElapsed}ms`);

        if (profileError && !profile) {
          console.error('[AuthService] onAuthStateChange: Error fetching profile after retries:', profileError);
          // Call callback with user but null role rather than failing silently
          callback({
            id: session.user.id,
            email: session.user.email,
            role: null,
          });
          return;
        }

        console.log('[AuthService] onAuthStateChange: Profile role:', profile?.role);
        callback({
          id: session.user.id,
          email: session.user.email,
          role: profile?.role || null,
        });
      } catch (error: any) {
        console.error('[AuthService] onAuthStateChange: Unexpected error:', error);
        // Still call callback with user info, but null role
        callback({
          id: session.user.id,
          email: session.user.email,
          role: null,
        });
      }
    } else {
      console.log('[AuthService] onAuthStateChange: No session, calling callback with null');
      callback(null);
    }
  });
}

