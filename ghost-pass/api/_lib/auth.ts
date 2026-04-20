import { VercelRequest, VercelResponse } from '@vercel/node';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase.js';

export interface ExtendedUser extends User {
  role: string;
  venue_id?: string | null;
  event_id?: string | null;
}

export const verifyToken = async (token: string) => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error('verifyToken error:', error.message);
      return null;
    }
    if (!data.user) {
      console.error('verifyToken: No user returned');
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('verifyToken unexpected error:', error);
    return null;
  }
};

export const getCurrentUser = async (req: VercelRequest): Promise<ExtendedUser | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('getCurrentUser: No Bearer token in Authorization header');
    return null;
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);

  if (!user) {
    console.error('getCurrentUser: verifyToken returned null');
    return null;
  }

  // Get user role and venue/event info from database
  try {
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role, venue_id, event_id')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.warn('getCurrentUser: Error fetching user profile from public.users', dbError.message);
    }

    return {
      ...user,
      role: userData?.role || 'USER',
      venue_id: userData?.venue_id || null,
      event_id: userData?.event_id || null
    };
  } catch (error) {
    console.error('getCurrentUser: Error in user sync catch block', error);
    return {
      ...user,
      role: 'USER',
      venue_id: null,
      event_id: null
    };
  }
};

export const requireAuth = async (req: VercelRequest, res: VercelResponse): Promise<ExtendedUser | null> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized', detail: 'Authentication required' });
    return null;
  }
  return user;
};

export const requireAdmin = async (req: VercelRequest, res: VercelResponse): Promise<ExtendedUser | null> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized', detail: 'Authentication required' });
    return null;
  }

  if (user.role !== 'ADMIN' && user.role !== 'VENUE_ADMIN') {
    res.status(403).json({ error: 'Forbidden', detail: 'Admin or Venue Admin access required' });
    return null;
  }

  return user;
};
