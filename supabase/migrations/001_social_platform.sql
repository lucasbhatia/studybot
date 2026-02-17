-- StudyBot Social Platform Schema
-- Handles users, friendships, study sets, class groups, and activity feed

-- Users table (synced from Canvas OAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_user_id TEXT UNIQUE NOT NULL,
  canvas_url TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CONSTRAINT different_users CHECK (user_id != friend_id)
);

-- Study Sets table (shareable study materials)
CREATE TABLE IF NOT EXISTS study_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  course_id TEXT,  -- Canvas course ID
  course_name TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('flashcards', 'quiz', 'notes', 'summary', 'mixed')),
  content JSONB NOT NULL,  -- Actual study content
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,  -- Short code for shareable link
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Study Set Collaborators (for shared editing)
CREATE TABLE IF NOT EXISTS study_set_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'owner')),
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(study_set_id, user_id)
);

-- Class Groups (auto-created from Canvas courses)
CREATE TABLE IF NOT EXISTS class_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_course_id TEXT NOT NULL,
  canvas_url TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_code TEXT,
  term TEXT,
  description TEXT,
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(canvas_course_id, canvas_url)
);

-- Class Group Members
CREATE TABLE IF NOT EXISTS class_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Activity Feed (for social features)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created_set', 'shared_set', 'joined_group', 'added_friend', 'updated_set', 'liked_set')),
  target_id UUID,  -- study_set_id or group_id or friend_id
  metadata JSONB,  -- Additional context
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Study Set Likes
CREATE TABLE IF NOT EXISTS study_set_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(study_set_id, user_id)
);

-- Study Set Comments
CREATE TABLE IF NOT EXISTS study_set_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shared Study Sets (tracks sharing between users)
CREATE TABLE IF NOT EXISTS shared_study_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  shared_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_canvas_id ON users(canvas_user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_study_sets_creator ON study_sets(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_public ON study_sets(is_public);
CREATE INDEX IF NOT EXISTS idx_study_sets_share_code ON study_sets(share_code);
CREATE INDEX IF NOT EXISTS idx_study_set_collaborators_set ON study_set_collaborators(study_set_id);
CREATE INDEX IF NOT EXISTS idx_study_set_collaborators_user ON study_set_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_class_groups_canvas ON class_groups(canvas_course_id);
CREATE INDEX IF NOT EXISTS idx_class_group_members_group ON class_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_class_group_members_user ON class_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_set_likes_set ON study_set_likes(study_set_id);
CREATE INDEX IF NOT EXISTS idx_study_set_likes_user ON study_set_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_study_set_comments_set ON study_set_comments(study_set_id);
CREATE INDEX IF NOT EXISTS idx_shared_study_sets_set ON shared_study_sets(study_set_id);
CREATE INDEX IF NOT EXISTS idx_shared_study_sets_shared_by ON shared_study_sets(shared_by_id);
CREATE INDEX IF NOT EXISTS idx_shared_study_sets_shared_with ON shared_study_sets(shared_with_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_set_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_set_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_set_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_study_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "users_select_own_or_public" ON users
  FOR SELECT
  USING (auth.uid() = id OR TRUE);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for Friendships
CREATE POLICY "friendships_select_own" ON friendships
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_insert_own" ON friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friendships_update_own" ON friendships
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for Study Sets
CREATE POLICY "study_sets_select_public_or_own" ON study_sets
  FOR SELECT
  USING (is_public = true OR auth.uid() = creator_id OR auth.uid() IN (
    SELECT user_id FROM study_set_collaborators WHERE study_set_id = id
  ));

CREATE POLICY "study_sets_insert_own" ON study_sets
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "study_sets_update_own_or_collaborator" ON study_sets
  FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() IN (
    SELECT user_id FROM study_set_collaborators WHERE study_set_id = id AND role IN ('editor', 'owner')
  ));

-- RLS Policies for Study Set Collaborators
CREATE POLICY "study_set_collaborators_select_own" ON study_set_collaborators
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = (
    SELECT creator_id FROM study_sets WHERE id = study_set_id
  ));

-- RLS Policies for Class Groups (public read, authenticated write)
CREATE POLICY "class_groups_select_all" ON class_groups
  FOR SELECT
  USING (true);

CREATE POLICY "class_group_members_select_all" ON class_group_members
  FOR SELECT
  USING (true);

CREATE POLICY "class_group_members_insert_own" ON class_group_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Activities
CREATE POLICY "activities_select_feed" ON activities
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT friend_id FROM friendships WHERE user_id = activities.user_id AND status = 'accepted'
    )
  );

-- RLS Policies for Study Set Likes
CREATE POLICY "study_set_likes_select_all" ON study_set_likes
  FOR SELECT
  USING (true);

CREATE POLICY "study_set_likes_insert_own" ON study_set_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_set_likes_delete_own" ON study_set_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Study Set Comments
CREATE POLICY "study_set_comments_select_all" ON study_set_comments
  FOR SELECT
  USING (true);

CREATE POLICY "study_set_comments_insert_own" ON study_set_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_set_comments_update_own" ON study_set_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for Shared Study Sets
CREATE POLICY "shared_study_sets_select_own" ON shared_study_sets
  FOR SELECT
  USING (auth.uid() = shared_by_id OR auth.uid() = shared_with_id);

CREATE POLICY "shared_study_sets_insert_own" ON shared_study_sets
  FOR INSERT
  WITH CHECK (auth.uid() = shared_by_id);

-- Grant default permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
