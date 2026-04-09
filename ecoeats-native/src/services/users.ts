// src/services/users.ts
import { supabase } from './supabase';
import type { User, ImpactStats, DietaryTag, UserRole } from '@/types/models';
import type { UserRow } from '@/types/database';

function normalizeUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url,
    role: row.role as UserRole,
    dietaryPrefs: (row.dietary_prefs || []) as DietaryTag[],
    hostBuilding: '',
    impactStats: row.impact_stats || { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputationScore: row.reputation_score || 100,
    lastSeen: new Date(row.last_seen),
    createdAt: new Date(row.created_at),
  };
}

export async function getUserProfile(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return normalizeUser(data);
}

export async function updateUserProfile(
  id: string,
  data: {
    name?: string;
    avatar?: string | null;
    dietaryPrefs?: DietaryTag[];
    role?: UserRole;
  }
): Promise<void> {
  const update: Record<string, unknown> = {};

  if (data.name !== undefined) update.name = data.name;
  if (data.avatar !== undefined) update.avatar_url = data.avatar;
  if (data.dietaryPrefs !== undefined) update.dietary_prefs = data.dietaryPrefs;
  if (data.role !== undefined) update.role = data.role;

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

export async function incrementUserImpactStats(
  userId: string,
  quantity: number
): Promise<void> {
  const { data } = await supabase
    .from('users')
    .select('impact_stats')
    .eq('id', userId)
    .single();

  const current: ImpactStats = data?.impact_stats || {
    mealsRescued: 0,
    co2Saved: 0,
    pointsEarned: 0,
  };

  const POINTS_PER_MEAL = 10;

  const { error } = await supabase
    .from('users')
    .update({
      impact_stats: {
        mealsRescued: current.mealsRescued + quantity,
        co2Saved: current.co2Saved + quantity * 0.5,
        pointsEarned: current.pointsEarned + quantity * POINTS_PER_MEAL,
      },
    })
    .eq('id', userId);

  if (error) console.warn('Failed to update impact stats:', error.message);
}

export async function createUserProfile(
  id: string,
  data: {
    name: string;
    email: string;
    avatar?: string | null;
    role?: UserRole;
    dietaryPrefs?: DietaryTag[];
  }
): Promise<void> {
  const { error } = await supabase.from('users').insert({
    id,
    name: data.name,
    email: data.email,
    avatar_url: data.avatar,
    role: data.role || 'student',
    dietary_prefs: data.dietaryPrefs || [],
    impact_stats: { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputation_score: 100,
  });

  if (error) throw error;
}
