-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CONTACTS TABLE (WhatsApp Users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_id TEXT UNIQUE NOT NULL,                 -- Primary phone key (e.g. "9188619XXXXX")
    profile_name TEXT,                          -- Sender display name from WhatsApp
    is_opted_out BOOLEAN DEFAULT false,         -- Opt-out / Compliance flag
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. CAMPAIGNS TABLE (Bulk Blast Tracker)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- e.g., "Diwali Promo 2026"
    template_id UUID,                           -- Pointer to public.templates.id
    total_recipients INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. TEMPLATES TABLE (WhatsApp Cloud Templates)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_template_id TEXT,                      -- Meta's template ID
    name TEXT NOT NULL,                         -- e.g. "order_status_update"
    language TEXT NOT NULL DEFAULT 'en_US',
    category TEXT,                              -- UTILITY, MARKETING, AUTHENTICATION
    status TEXT NOT NULL DEFAULT 'PENDING',     -- PENDING, APPROVED, REJECTED, PAUSED
    rejection_reason TEXT,
    components JSONB,                           -- Header, body, footer metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_name_language UNIQUE (name, language)
);

-- ==========================================
-- 4. MEDIA TABLE (Supabase + Meta Sync)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT NOT NULL DEFAULT 'whatsapp-media', -- Supabase Storage Bucket name
    supabase_path TEXT NOT NULL,                     -- Storage path (e.g. 'inbound/9188619XXXXX/img.jpg')
    original_filename TEXT,                          -- Essential for WhatsApp Documents
    meta_media_id TEXT,                              -- Meta temporary asset ID
    mime_type TEXT NOT NULL,                         -- e.g. 'image/jpeg', 'application/pdf'
    file_size BIGINT,                                -- Bytes
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 5. MESSAGES TABLE (Flat Logs & Context)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wam_id TEXT UNIQUE,                         -- Meta Message ID (wamid.HBgL...)
    direction TEXT NOT NULL,                    -- 'INBOUND' or 'OUTBOUND'
    type TEXT NOT NULL DEFAULT 'text',          -- 'text', 'image', 'document', 'interactive', 'template'
    status TEXT NOT NULL DEFAULT 'queued',       -- 'queued', 'sent', 'delivered', 'read', 'failed'
    
    recipient_wa_id TEXT NOT NULL,              -- Plain phone number (No strict FK)
    body TEXT,                                  -- Text body or image caption
    
    -- Context & Tracking Pointers (No strict FKs for prototyping resilience)
    context_wam_id TEXT,                        -- Quoted/replied wam_id
    campaign_id UUID,                           -- Pointer to public.campaigns.id
    template_id UUID,                           -- Pointer to public.templates.id
    media_id UUID,                              -- Pointer to public.media.id
    interactive_response JSONB,                 -- Stores button or list clicks
    
    error_code INTEGER,
    error_details JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES FOR FAST QUERYING & WEBHOOK LOOKUPS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_contacts_wa_id ON public.contacts(wa_id);
CREATE INDEX IF NOT EXISTS idx_messages_wam_id ON public.messages(wam_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_wa_id ON public.messages(recipient_wa_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON public.messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_media_meta_id ON public.media(meta_media_id);
CREATE INDEX IF NOT EXISTS idx_media_supabase_path ON public.media(supabase_path);