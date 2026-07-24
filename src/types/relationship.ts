
export interface PersonProfile {
  name: string | null;
  dob: string | null;
  personality: string | null;
  meaning_text: string | null;
  likes: string | null; 
  dislikes: string | null; 
  best_moments: string | null;
  rating: number | null;
  rating_reason: string | null;
  boundaries: string | null;
}

export interface Relationship {
  id: string;
  creator_id: string;
  creator_name: string;
  other_person_name: string;
  other_person_email: string;
  other_user_id: string | null;
  relationship_type: string;
  meaning_text: string; 
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  harmony_score?: number;


  creator_dob?: string | null;
  creator_personality?: string | null;
  creator_likes?: string | null;
  creator_dislikes?: string | null;
  creator_best_moments?: string | null;
  creator_rating?: number | null;
  creator_rating_reason?: string | null;
  creator_boundaries?: string | null;

  other_person_dob?: string | null;
  other_person_personality?: string | null;
  other_person_likes?: string | null;
  other_person_dislikes?: string | null;
  other_person_best_moments?: string | null;
  other_person_rating?: number | null;
  other_person_rating_reason?: string | null;
  other_person_boundaries?: string | null;
}


export function resolvePersonProfile(
  relationship: Relationship | null,
  currentUserId: string | undefined,
  who: 'me' | 'partner',
): PersonProfile {
  const empty: PersonProfile = {
    name: null,
    dob: null,
    personality: null,
    meaning_text: null,
    likes: null,
    dislikes: null,
    best_moments: null,
    rating: null,
    rating_reason: null,
    boundaries: null,
  };

  if (!relationship) return empty;

  const isCreator = relationship.creator_id === currentUserId;

  const wantsCreatorSide = who === 'me' ? isCreator : !isCreator;

  if (wantsCreatorSide) {
    return {
      name: relationship.creator_name ?? null,
      dob: relationship.creator_dob ?? null,
      personality: relationship.creator_personality ?? null,
      meaning_text: relationship.meaning_text ?? null,
      likes: relationship.creator_likes ?? null,
      dislikes: relationship.creator_dislikes ?? null,
      best_moments: relationship.creator_best_moments ?? null,
      rating: relationship.creator_rating ?? null,
      rating_reason: relationship.creator_rating_reason ?? null,
      boundaries: relationship.creator_boundaries ?? null,
    };
  }

  return {
    name: relationship.other_person_name ?? null,
    dob: relationship.other_person_dob ?? null,
    personality: relationship.other_person_personality ?? null,
    meaning_text: null,
    likes: relationship.other_person_likes ?? null,
    dislikes: relationship.other_person_dislikes ?? null,
    best_moments: relationship.other_person_best_moments ?? null,
    rating: relationship.other_person_rating ?? null,
    rating_reason: relationship.other_person_rating_reason ?? null,
    boundaries: relationship.other_person_boundaries ?? null,
  };
}