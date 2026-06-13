-- ============================================================
-- KENYA GOVERNANCE & VOTING ENGINE V2 — FIXED
-- Tables created FIRST, then profiles altered
-- ============================================================

-- ============================================================
-- STEP 1: CREATE ALL TABLES FIRST (in dependency order)
-- ============================================================

-- Constituencies (must exist before profiles references it)
CREATE TABLE IF NOT EXISTS public.constituencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    sub_county_id UUID,
    population INTEGER,
    registered_voters INTEGER DEFAULT 0,
    boundaries GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wards (must exist before profiles references it)
CREATE TABLE IF NOT EXISTS public.wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    constituency_id UUID NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    sub_county_id UUID,
    population INTEGER,
    registered_voters INTEGER DEFAULT 0,
    boundaries GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- County Assemblies
CREATE TABLE IF NOT EXISTS public.county_assemblies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID NOT NULL UNIQUE REFERENCES public.counties(id) ON DELETE CASCADE,
    assembly_name VARCHAR(100) NOT NULL,
    speaker_id UUID REFERENCES public.profiles(id),
    deputy_speaker_id UUID REFERENCES public.profiles(id),
    majority_leader_id UUID REFERENCES public.profiles(id),
    minority_leader_id UUID REFERENCES public.profiles(id),
    clerk_id UUID REFERENCES public.profiles(id),
    total_mcas INTEGER NOT NULL DEFAULT 0,
    term_start DATE NOT NULL,
    term_end DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dissolved', 'suspended')),
    standing_orders TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- County Committees
CREATE TABLE IF NOT EXISTS public.county_committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_assembly_id UUID NOT NULL REFERENCES public.county_assemblies(id) ON DELETE CASCADE,
    committee_name VARCHAR(100) NOT NULL,
    committee_type VARCHAR(30) NOT NULL CHECK (committee_type IN ('sectoral', 'select', 'adhoc', 'housekeeping')),
    sector VARCHAR(50),
    chair_id UUID REFERENCES public.profiles(id),
    vice_chair_id UUID REFERENCES public.profiles(id),
    member_ids UUID[] DEFAULT '{}',
    mandate TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dissolved', 'reconstituted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Parliament Sessions
CREATE TABLE IF NOT EXISTS public.parliament_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('senate', 'national_assembly', 'joint_sitting', 'special')),
    session_number VARCHAR(20) NOT NULL,
    parliament_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'adjourned', 'prorogued', 'dissolved')),
    speaker_id UUID REFERENCES public.profiles(id),
    deputy_speaker_id UUID REFERENCES public.profiles(id),
    majority_leader_id UUID REFERENCES public.profiles(id),
    minority_leader_id UUID REFERENCES public.profiles(id),
    quorum_required INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Governance Role Assignments
CREATE TABLE IF NOT EXISTS public.governance_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'senator', 'mp', 'speaker', 'deputy_speaker', 'majority_leader', 'minority_leader', 'whip',
        'mca', 'governor', 'deputy_governor', 'cec', 'county_secretary', 'chief_officer',
        'county_clerk', 'moderator', 'ward_admin'
    )),
    level VARCHAR(20) NOT NULL CHECK (level IN ('national', 'county', 'ward')),
    constituency_id UUID REFERENCES public.constituencies(id),
    ward_id UUID REFERENCES public.wards(id),
    county_id UUID REFERENCES public.counties(id),
    committee_id UUID REFERENCES public.county_committees(id),
    assigned_by UUID NOT NULL REFERENCES public.profiles(id),
    assigned_by_role VARCHAR(50) NOT NULL,
    assignment_reason TEXT,
    term_start DATE NOT NULL,
    term_end DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
    asis_onboarded BOOLEAN DEFAULT false,
    asis_onboarding_session_id UUID,
    asis_onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ASIS Onboarding Tracker
CREATE TABLE IF NOT EXISTS public.governance_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_assignment_id UUID NOT NULL REFERENCES public.governance_role_assignments(id) ON DELETE CASCADE,
    asis_session_id UUID,
    onboarding_type VARCHAR(50) NOT NULL CHECK (onboarding_type IN (
        'senator_onboarding', 'mp_onboarding', 'mca_onboarding',
        'governor_onboarding', 'cec_onboarding', 'county_clerk_onboarding',
        'speaker_onboarding', 'committee_chair_onboarding'
    )),
    steps_completed TEXT[] DEFAULT '{}',
    total_steps INTEGER DEFAULT 0,
    progress_percent INTEGER DEFAULT 0,
    id_verified BOOLEAN DEFAULT false,
    oath_taken BOOLEAN DEFAULT false,
    standing_orders_acknowledged BOOLEAN DEFAULT false,
    committee_briefing_completed BOOLEAN DEFAULT false,
    portal_training_completed BOOLEAN DEFAULT false,
    first_vote_practiced BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_asis_agent VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role_assignment_id)
);

-- Voting Sessions
CREATE TABLE IF NOT EXISTS public.voting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type VARCHAR(30) NOT NULL CHECK (session_type IN (
        'national_bill', 'national_motion', 'national_amendment', 'national_referendum',
        'county_bill', 'county_motion', 'county_budget', 'county_cfb', 'county_project',
        'ward_bursary', 'ward_project', 'ward_fee', 'ward_decision',
        'committee_vote', 'impeachment', 'confidence_vote'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(20) NOT NULL CHECK (level IN ('national', 'county', 'ward', 'committee')),
    county_id UUID REFERENCES public.counties(id),
    ward_id UUID REFERENCES public.wards(id),
    committee_id UUID REFERENCES public.county_committees(id),
    bill_number VARCHAR(50),
    sponsor_id UUID REFERENCES public.profiles(id),
    co_sponsors UUID[],
    voting_method VARCHAR(20) DEFAULT 'electronic' CHECK (voting_method IN ('electronic', 'roll_call', 'secret_ballot', 'voice_vote', 'division')),
    voting_type VARCHAR(20) DEFAULT 'simple_majority' CHECK (voting_type IN ('simple_majority', 'two_thirds', 'three_quarters', 'unanimous', 'weighted')),
    quorum_required INTEGER NOT NULL,
    introduced_date TIMESTAMP WITH TIME ZONE,
    first_reading TIMESTAMP WITH TIME ZONE,
    second_reading TIMESTAMP WITH TIME ZONE,
    public_participation_start TIMESTAMP WITH TIME ZONE,
    public_participation_end TIMESTAMP WITH TIME ZONE,
    committee_stage TIMESTAMP WITH TIME ZONE,
    third_reading TIMESTAMP WITH TIME ZONE,
    presidential_assent TIMESTAMP WITH TIME ZONE,
    effective_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
        'draft', 'introduced', 'first_reading', 'public_participation', 'committee_stage',
        'second_reading', 'third_reading', 'passed', 'rejected', 'presidential_assent',
        'returned', 'signed', 'gazetted', 'effective', 'lapsed', 'withdrawn'
    )),
    total_votes INTEGER DEFAULT 0,
    yes_votes INTEGER DEFAULT 0,
    no_votes INTEGER DEFAULT 0,
    abstain_votes INTEGER DEFAULT 0,
    absent_votes INTEGER DEFAULT 0,
    result VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Votes
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.profiles(id),
    voter_role VARCHAR(20) NOT NULL,
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('yes', 'no', 'abstain', 'absent')),
    vote_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    vote_reason TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(20),
    device_id VARCHAR(100),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(voting_session_id, voter_id)
);

-- Public Participation
CREATE TABLE IF NOT EXISTS public.public_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    participation_type VARCHAR(30) NOT NULL CHECK (participation_type IN (
        'vote', 'comment', 'petition', 'submission', 'hearing', 'survey', 'poll'
    )),
    vote VARCHAR(10) CHECK (vote IN ('support', 'oppose', 'neutral', 'abstain')),
    comment TEXT,
    submission_document VARCHAR(255),
    ward_id UUID REFERENCES public.wards(id),
    constituency_id UUID REFERENCES public.constituencies(id),
    county_id UUID REFERENCES public.counties(id),
    location GEOGRAPHY(POINT, 4326),
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(20),
    id_verified BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.public_participation_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participation_id UUID NOT NULL REFERENCES public.public_participation(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'reply', 'share')),
    reply_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(participation_id, citizen_id, reaction_type)
);

-- County Public Forums
CREATE TABLE IF NOT EXISTS public.county_public_forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES public.wards(id),
    forum_type VARCHAR(30) NOT NULL CHECK (forum_type IN (
        'budget_consultation', 'cfb_hearing', 'project_proposal', 'sectoral_review',
        'governor_qa', 'mca_accountability', 'development_plan', 'special_sitting'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 120,
    venue_name VARCHAR(200),
    venue_address TEXT,
    venue_location GEOGRAPHY(POINT, 4326),
    virtual_link VARCHAR(255),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'adjourned', 'completed', 'cancelled')),
    expected_attendees INTEGER,
    actual_attendees INTEGER DEFAULT 0,
    virtual_attendees INTEGER DEFAULT 0,
    questions_submitted INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    polls_conducted INTEGER DEFAULT 0,
    chair_id UUID REFERENCES public.profiles(id),
    moderator_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID NOT NULL REFERENCES public.county_public_forums(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    question TEXT NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'answered', 'escalated')),
    answer TEXT,
    answered_by UUID REFERENCES public.profiles(id),
    answered_at TIMESTAMP WITH TIME ZONE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID NOT NULL REFERENCES public.county_public_forums(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    poll_type VARCHAR(20) DEFAULT 'single_choice' CHECK (poll_type IN ('single_choice', 'multiple_choice', 'rating', 'open_ended')),
    is_live BOOLEAN DEFAULT false,
    opened_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 300,
    total_votes INTEGER DEFAULT 0,
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.forum_polls(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    selected_options TEXT[],
    rating INTEGER,
    open_response TEXT,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(poll_id, citizen_id)
);

-- National Public Participation
CREATE TABLE IF NOT EXISTS public.national_public_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID REFERENCES public.voting_sessions(id),
    bill_number VARCHAR(50),
    participation_type VARCHAR(30) NOT NULL CHECK (participation_type IN (
        'bill_comment', 'committee_submission', 'petition', 'survey', 'hearing', 'written_representation'
    )),
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    constituency_id UUID REFERENCES public.constituencies(id),
    county_id UUID REFERENCES public.counties(id),
    title VARCHAR(255),
    content TEXT NOT NULL,
    supporting_documents VARCHAR(255)[],
    topic VARCHAR(50),
    stance VARCHAR(20) CHECK (stance IN ('support', 'oppose', 'neutral', 'suggest_amendment')),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'forwarded_committee', 'incorporated', 'archived')),
    assigned_committee VARCHAR(100),
    reviewed_by UUID REFERENCES public.profiles(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Petitions
CREATE TABLE IF NOT EXISTS public.petitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('national', 'county', 'ward')),
    county_id UUID REFERENCES public.counties(id),
    ward_id UUID REFERENCES public.wards(id),
    petitioner_id UUID NOT NULL REFERENCES public.profiles(id),
    petitioner_type VARCHAR(20) DEFAULT 'individual' CHECK (petitioner_type IN ('individual', 'group', 'organization', 'mcas')),
    co_petitioners UUID[],
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    grievance TEXT,
    requested_action TEXT NOT NULL,
    supporting_documents VARCHAR(255)[],
    category VARCHAR(50),
    signatures_required INTEGER DEFAULT 1000,
    signatures_collected INTEGER DEFAULT 0,
    signature_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'submitted', 'under_review', 'rejected', 'accepted', 'referred', 'resolved', 'withdrawn')),
    response TEXT,
    responded_by UUID REFERENCES public.profiles(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    escalated_to VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.petition_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    petition_id UUID NOT NULL REFERENCES public.petitions(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    signature_comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(20),
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(petition_id, citizen_id)
);

-- Budget & CFB
CREATE TABLE IF NOT EXISTS public.county_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(9) NOT NULL,
    budget_type VARCHAR(20) DEFAULT 'annual' CHECK (budget_type IN ('annual', 'supplementary', 'development', 'recurrent')),
    total_budget DECIMAL(15,2) NOT NULL,
    recurrent_expenditure DECIMAL(15,2) DEFAULT 0,
    development_expenditure DECIMAL(15,2) DEFAULT 0,
    revenue_projections DECIMAL(15,2) DEFAULT 0,
    deficit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'public_participation', 'assembly_review', 'approved', 'gazetted', 'implemented', 'audited')),
    public_participation_start TIMESTAMP WITH TIME ZONE,
    public_participation_end TIMESTAMP WITH TIME ZONE,
    assembly_approval_date TIMESTAMP WITH TIME ZONE,
    gazettement_date TIMESTAMP WITH TIME ZONE,
    budget_document VARCHAR(255),
    programme_based_budget VARCHAR(255),
    citizen_budget VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(county_id, fiscal_year, budget_type)
);

CREATE TABLE IF NOT EXISTS public.county_finance_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES public.county_budgets(id),
    bill_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    revenue_sources JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'public_participation', 'first_reading', 'committee', 'second_reading', 'third_reading', 'passed', 'governor_assent', 'gazetted', 'effective')),
    introduced_date TIMESTAMP WITH TIME ZONE,
    public_participation_start TIMESTAMP WITH TIME ZONE,
    public_participation_end TIMESTAMP WITH TIME ZONE,
    assembly_passed_date TIMESTAMP WITH TIME ZONE,
    governor_assent_date TIMESTAMP WITH TIME ZONE,
    effective_date TIMESTAMP WITH TIME ZONE,
    voting_session_id UUID REFERENCES public.voting_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ward Projects
CREATE TABLE IF NOT EXISTS public.ward_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN (
        'bursary', 'infrastructure', 'health', 'education', 'water', 'electricity', 'market', 'security', 'environment', 'other'
    )),
    description TEXT,
    estimated_cost DECIMAL(12,2),
    location_description TEXT,
    location_geo GEOGRAPHY(POINT, 4326),
    implementing_agency VARCHAR(100),
    contractor VARCHAR(100),
    start_date DATE,
    completion_date DATE,
    funding_source VARCHAR(50) CHECK (funding_source IN ('cdf', 'ward_development_fund', 'county', 'national', 'donor', 'community', 'mixed')),
    budget_allocated DECIMAL(12,2),
    budget_spent DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'tendering', 'ongoing', 'completed', 'abandoned', 'audited')),
    community_votes INTEGER DEFAULT 0,
    community_support DECIMAL(5,2) DEFAULT 0.00,
    project_images VARCHAR(255)[],
    completion_certificate VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ward_project_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.ward_projects(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id),
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('priority', 'support', 'oppose')),
    priority_rank INTEGER,
    vote_reason TEXT,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(project_id, citizen_id, vote_type)
);

-- Governance Audit Log
CREATE TABLE IF NOT EXISTS public.governance_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    performed_by_role VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    device_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- STEP 2: ALTER PROFILES (tables now exist)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'governance_role') THEN
        ALTER TABLE public.profiles ADD COLUMN governance_role VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'governance_level') THEN
        ALTER TABLE public.profiles ADD COLUMN governance_level VARCHAR(20) CHECK (governance_level IN ('national', 'county', 'ward'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'constituency_id') THEN
        ALTER TABLE public.profiles ADD COLUMN constituency_id UUID REFERENCES public.constituencies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ward_id') THEN
        ALTER TABLE public.profiles ADD COLUMN ward_id UUID REFERENCES public.wards(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'county_id') THEN
        ALTER TABLE public.profiles ADD COLUMN county_id UUID REFERENCES public.counties(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'party') THEN
        ALTER TABLE public.profiles ADD COLUMN party VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'party_position') THEN
        ALTER TABLE public.profiles ADD COLUMN party_position VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'oath_date') THEN
        ALTER TABLE public.profiles ADD COLUMN oath_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'term_start') THEN
        ALTER TABLE public.profiles ADD COLUMN term_start DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'term_end') THEN
        ALTER TABLE public.profiles ADD COLUMN term_end DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_governance_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_governance_active BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'attendance_rate') THEN
        ALTER TABLE public.profiles ADD COLUMN attendance_rate DECIMAL(5,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bills_sponsored') THEN
        ALTER TABLE public.profiles ADD COLUMN bills_sponsored INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'motions_tabled') THEN
        ALTER TABLE public.profiles ADD COLUMN motions_tabled INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'committee_ids') THEN
        ALTER TABLE public.profiles ADD COLUMN committee_ids UUID[] DEFAULT '{}';
    END IF;
END $$;

-- ============================================================
-- STEP 3: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_governance ON public.profiles(governance_role, governance_level, is_governance_active);
CREATE INDEX IF NOT EXISTS idx_profiles_county ON public.profiles(county_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON public.profiles(ward_id);
CREATE INDEX IF NOT EXISTS idx_profiles_constituency ON public.profiles(constituency_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON public.governance_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_status ON public.governance_role_assignments(status);
CREATE INDEX IF NOT EXISTS idx_role_assignments_county ON public.governance_role_assignments(county_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_ward ON public.governance_role_assignments(ward_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.governance_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.governance_onboarding(status);

CREATE INDEX IF NOT EXISTS idx_constituencies_county ON public.constituencies(county_id);
CREATE INDEX IF NOT EXISTS idx_wards_constituency ON public.wards(constituency_id);
CREATE INDEX IF NOT EXISTS idx_wards_county ON public.wards(county_id);

CREATE INDEX IF NOT EXISTS idx_voting_sessions_type ON public.voting_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_level ON public.voting_sessions(level);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_county ON public.voting_sessions(county_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_status ON public.voting_sessions(status);

CREATE INDEX IF NOT EXISTS idx_votes_session ON public.votes(voting_session_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_public_participation_session ON public.public_participation(voting_session_id);
CREATE INDEX IF NOT EXISTS idx_public_participation_citizen ON public.public_participation(citizen_id);
CREATE INDEX IF NOT EXISTS idx_public_participation_county ON public.public_participation(county_id);

CREATE INDEX IF NOT EXISTS idx_county_public_forums_county ON public.county_public_forums(county_id);
CREATE INDEX IF NOT EXISTS idx_county_public_forums_ward ON public.county_public_forums(ward_id);
CREATE INDEX IF NOT EXISTS idx_county_public_forums_status ON public.county_public_forums(status);
CREATE INDEX IF NOT EXISTS idx_county_public_forums_date ON public.county_public_forums(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_forum_questions_forum ON public.forum_questions(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_status ON public.forum_questions(status);

CREATE INDEX IF NOT EXISTS idx_petitions_level ON public.petitions(level);
CREATE INDEX IF NOT EXISTS idx_petitions_county ON public.petitions(county_id);
CREATE INDEX IF NOT EXISTS idx_petitions_status ON public.petitions(status);

CREATE INDEX IF NOT EXISTS idx_county_budgets_county ON public.county_budgets(county_id);
CREATE INDEX IF NOT EXISTS idx_county_budgets_year ON public.county_budgets(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_ward_projects_ward ON public.ward_projects(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_projects_status ON public.ward_projects(status);

-- ============================================================
-- STEP 4: RLS POLICIES
-- ============================================================

ALTER TABLE public.governance_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parliament_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.county_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.county_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_participation_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.county_public_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_public_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.county_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.county_finance_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_project_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "governance_read_all" ON public.governance_role_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.governance_onboarding FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.parliament_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.constituencies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.wards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.county_assemblies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.county_committees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.voting_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.public_participation FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.county_public_forums FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.forum_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.forum_polls FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.national_public_participation FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.petitions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.petition_signatures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.county_budgets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.county_finance_bills FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.ward_projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_read_all" ON public.ward_project_votes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "votes_own_or_aggregate" ON public.votes FOR SELECT 
USING (voter_id = auth.uid() OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE governance_role IN ('speaker', 'clerk', 'majority_leader', 'county_clerk')
));

CREATE POLICY "poll_votes_own" ON public.forum_poll_votes FOR SELECT USING (citizen_id = auth.uid());

CREATE POLICY "public_participation_insert_own" ON public.public_participation FOR INSERT WITH CHECK (citizen_id = auth.uid());
CREATE POLICY "public_participation_update_own" ON public.public_participation FOR UPDATE USING (citizen_id = auth.uid());

CREATE POLICY "petitions_insert_own" ON public.petitions FOR INSERT WITH CHECK (petitioner_id = auth.uid());
CREATE POLICY "petitions_update_own" ON public.petitions FOR UPDATE USING (petitioner_id = auth.uid());
CREATE POLICY "petition_signatures_insert_own" ON public.petition_signatures FOR INSERT WITH CHECK (citizen_id = auth.uid());

CREATE POLICY "ward_votes_insert_own" ON public.ward_project_votes FOR INSERT WITH CHECK (citizen_id = auth.uid());

-- ============================================================
-- STEP 5: TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parliament_sessions_updated_at BEFORE UPDATE ON public.parliament_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_county_assemblies_updated_at BEFORE UPDATE ON public.county_assemblies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_county_committees_updated_at BEFORE UPDATE ON public.county_committees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voting_sessions_updated_at BEFORE UPDATE ON public.voting_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_participation_updated_at BEFORE UPDATE ON public.public_participation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_county_public_forums_updated_at BEFORE UPDATE ON public.county_public_forums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_questions_updated_at BEFORE UPDATE ON public.forum_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_polls_updated_at BEFORE UPDATE ON public.forum_polls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_national_public_participation_updated_at BEFORE UPDATE ON public.national_public_participation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_petitions_updated_at BEFORE UPDATE ON public.petitions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_county_budgets_updated_at BEFORE UPDATE ON public.county_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_county_finance_bills_updated_at BEFORE UPDATE ON public.county_finance_bills
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ward_projects_updated_at BEFORE UPDATE ON public.ward_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_assignments_updated_at BEFORE UPDATE ON public.governance_role_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON public.governance_onboarding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_petition_signatures_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.petitions SET signatures_collected = signatures_collected + 1 WHERE id = NEW.petition_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.petitions SET signatures_collected = signatures_collected - 1 WHERE id = OLD.petition_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER petition_signatures_count_trigger AFTER INSERT OR DELETE ON public.petition_signatures
FOR EACH ROW EXECUTE FUNCTION public.update_petition_signatures_count();

CREATE OR REPLACE FUNCTION public.update_voting_session_results()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.voting_sessions SET
        total_votes = (SELECT COUNT(*) FROM public.votes WHERE voting_session_id = NEW.voting_session_id),
        yes_votes = (SELECT COUNT(*) FROM public.votes WHERE voting_session_id = NEW.voting_session_id AND vote = 'yes'),
        no_votes = (SELECT COUNT(*) FROM public.votes WHERE voting_session_id = NEW.voting_session_id AND vote = 'no'),
        abstain_votes = (SELECT COUNT(*) FROM public.votes WHERE voting_session_id = NEW.voting_session_id AND vote = 'abstain'),
        absent_votes = (SELECT COUNT(*) FROM public.votes WHERE voting_session_id = NEW.voting_session_id AND vote = 'absent')
    WHERE id = NEW.voting_session_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voting_results_trigger AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.update_voting_session_results();

-- ============================================================
-- STEP 6: VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.active_governance_members AS
SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.phone,
    p.email,
    p.governance_role,
    p.governance_level,
    p.party,
    p.party_position,
    p.county_id,
    c.name AS county_name,
    p.constituency_id,
    co.name AS constituency_name,
    p.ward_id,
    w.name AS ward_name,
    p.term_start,
    p.term_end,
    p.is_governance_active,
    p.attendance_rate,
    p.bills_sponsored,
    p.motions_tabled,
    p.committee_ids,
    p.oath_date,
    p.created_at
FROM public.profiles p
LEFT JOIN public.counties c ON p.county_id = c.id
LEFT JOIN public.constituencies co ON p.constituency_id = co.id
LEFT JOIN public.wards w ON p.ward_id = w.id
WHERE p.is_governance_active = true;

CREATE OR REPLACE VIEW public.voting_results_summary AS
SELECT 
    vs.id AS voting_session_id,
    vs.title,
    vs.session_type,
    vs.level,
    vs.status,
    vs.total_votes,
    vs.yes_votes,
    vs.no_votes,
    vs.abstain_votes,
    vs.absent_votes,
    CASE 
        WHEN vs.voting_type = 'simple_majority' AND vs.yes_votes > vs.no_votes THEN 'passed'
        WHEN vs.voting_type = 'two_thirds' AND (vs.yes_votes::float / NULLIF(vs.total_votes, 0)) >= 0.67 THEN 'passed'
        WHEN vs.voting_type = 'three_quarters' AND (vs.yes_votes::float / NULLIF(vs.total_votes, 0)) >= 0.75 THEN 'passed'
        WHEN vs.yes_votes > vs.no_votes THEN 'passed'
        ELSE 'rejected'
    END AS calculated_result,
    vs.quorum_required,
    (vs.yes_votes + vs.no_votes + vs.abstain_votes) AS present_votes,
    CASE WHEN (vs.yes_votes + vs.no_votes + vs.abstain_votes) >= vs.quorum_required THEN true ELSE false END AS quorum_met
FROM public.voting_sessions vs;

CREATE OR REPLACE VIEW public.public_participation_by_county AS
SELECT 
    pp.county_id,
    c.name AS county_name,
    COUNT(*) AS total_participations,
    COUNT(CASE WHEN pp.participation_type = 'vote' THEN 1 END) AS votes,
    COUNT(CASE WHEN pp.participation_type = 'comment' THEN 1 END) AS comments,
    COUNT(CASE WHEN pp.participation_type = 'petition' THEN 1 END) AS petitions,
    COUNT(CASE WHEN pp.vote = 'support' THEN 1 END) AS support_votes,
    COUNT(CASE WHEN pp.vote = 'oppose' THEN 1 END) AS oppose_votes,
    COUNT(DISTINCT pp.citizen_id) AS unique_citizens
FROM public.public_participation pp
LEFT JOIN public.counties c ON pp.county_id = c.id
WHERE pp.county_id IS NOT NULL
GROUP BY pp.county_id, c.name;

CREATE OR REPLACE VIEW public.ward_project_rankings AS
SELECT 
    wp.id AS project_id,
    wp.ward_id,
    w.name AS ward_name,
    wp.county_id,
    c.name AS county_name,
    wp.project_name,
    wp.project_type,
    wp.estimated_cost,
    wp.status,
    COUNT(wpv.id) AS total_votes,
    COUNT(CASE WHEN wpv.vote_type = 'priority' THEN 1 END) AS priority_votes,
    COUNT(CASE WHEN wpv.vote_type = 'support' THEN 1 END) AS support_votes,
    COUNT(CASE WHEN wpv.vote_type = 'oppose' THEN 1 END) AS oppose_votes,
    AVG(wpv.priority_rank) AS avg_priority_rank,
    RANK() OVER (PARTITION BY wp.ward_id ORDER BY COUNT(CASE WHEN wpv.vote_type = 'priority' THEN 1 END) DESC) AS ward_priority_rank
FROM public.ward_projects wp
JOIN public.wards w ON wp.ward_id = w.id
JOIN public.counties c ON wp.county_id = c.id
LEFT JOIN public.ward_project_votes wpv ON wp.id = wpv.project_id
WHERE wp.status IN ('proposed', 'approved')
GROUP BY wp.id, wp.ward_id, w.name, wp.county_id, c.name, wp.project_name, wp.project_type, wp.estimated_cost, wp.status;
