# Scoreboard + Supabase

A minimal Next.js app that tests a Supabase connection by reading from a single `scoreboards` table (it now holds the scores themselves). The home page shows a green box when it can read from Supabase (and prints the latest scoreboard), or a red box when something is misconfigured.

## Quick start

1) Install deps (uses pnpm by default): `pnpm install`
2) Create `.env.local` and fill in your Supabase credentials (see Environment section below).
3) Configure Supabase (table, policy, optional seed) with the SQL below.
4) Run the app: `pnpm dev` then open http://localhost:3000.

Key pages:
- `/` splash/landing
- `/auth` sign in/sign up + forgot password
- `/dashboard` authenticated view (redirects to `/auth` if signed out)

## Environment Variables

Create a `.env.local` file in the root directory (this file is gitignored) with the following variables:

```bash
# Required: Supabase Configuration
# Get these from your Supabase project dashboard at https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Optional: Splash image padding (for fine-tuning the hero image position)
NEXT_PUBLIC_SPLASH_IMAGE_PADDING_TOP=0px
```

You can find both under Supabase Dashboard → Project Settings → API → API Keys (use **Publishable key**, not secret).

## Supabase schema and policy

Run this in the Supabase SQL editor to create the table the app expects:

```sql
create table if not exists public.scoreboards (
  id uuid primary key default gen_random_uuid(),
  name text,
  share_token text unique,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  a_side text not null default 'A',
  b_side text not null default 'B',
  a_score int not null default 0,
  b_score int not null default 0
);
```

Optional: seed one row so the UI has data to print:

```sql
-- Replace the UUIDs/token below with real values from your project
insert into public.scoreboards (id, name, owner_id, share_token, a_side, b_side, a_score, b_score)
values (
  gen_random_uuid(),
  'Demo board',
  '00000000-0000-0000-0000-000000000000',
  'demo-share-token',
  'Player A',
  'Player B',
  12,
  8
);
```

If you want realtime updates later, go to Replication → Realtime in Supabase and enable `scoreboards` so score/name changes stream to the dashboard and shared view.

### Row level security

Enable RLS and owner-scoped policies (plus a read-only policy for shared links):

```sql
alter table public.scoreboards enable row level security;

create policy "Owners can select their scoreboards"
on public.scoreboards
for select
using (auth.uid() = owner_id);

create policy "Owners can update their scoreboards"
on public.scoreboards
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owners can insert their scoreboards"
on public.scoreboards
for insert
with check (auth.uid() = owner_id);

create policy "Owners can delete their scoreboards"
on public.scoreboards
for delete
using (auth.uid() = owner_id);

-- Allow read-only access to boards that have a share token set
create policy "Public select via share_token"
on public.scoreboards
for select
using (share_token is not null);
```

If the table already exists, add the policies above. The app filters by `owner_id` for mutations, and shared links rely on the `share_token` to allow read-only access.

## Email/password auth

1) Ensure `.env.local` has your publishable key + URL.
2) In Supabase Dashboard → Authentication → Providers → Email, leave defaults on (email + password enabled, email confirmations on).
3) Add `http://localhost:3000/auth/update-password` to Auth → URL Configuration → Redirect URLs (used for password resets).
4) Visit http://localhost:3000/auth to sign up or sign in. Confirmation emails go to the address you enter (use a real inbox).
5) To reset a password, enter your email in the “Forgot password?” section. The link will land on `/auth/update-password`, where you can set a new password.
6) The current user email is displayed once signed in; “Sign out” clears it.

## Google + Discord sign-in

The `/auth` page now surfaces branded Google and Discord buttons that call `supabase.auth.signInWithOAuth`. To make them live:

1. Auth → URL Configuration  
   - Set **Site URL** to your dev/prod host (e.g. `http://localhost:3000` while testing).  
   - Keep the `/auth/update-password` redirect from the email/password setup step. No extra redirect is required for OAuth because the app asks Supabase to send users back to `/dashboard`.
2. Auth → Providers → **Google**  
   - Create Google OAuth “Web application” credentials in the Google Cloud Console.  
   - Authorized redirect URI must be `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`.  
   - Paste the client ID/secret into Supabase and toggle Google on.
3. Auth → Providers → **Discord**  
   - Create a Discord application at https://discord.com/developers.  
   - Under OAuth2, add the same redirect URI `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`.  
   - Copy the client ID/secret into Supabase and enable the provider.

Once those providers are toggled on, clicking either button in the UI will redirect users through the provider, land them back on `/dashboard`, and keep your session handling unchanged. If a provider is disabled, the form surfaces the Supabase error so nothing silently fails.

## What to expect

- If the env vars are set and the policy allows reads, the page shows **Supabase Connection SUCCESS** with the latest row (most recent `updated_at`).
- If the table is empty, you still get a green success state with a note that no records were returned.
- If env vars or policies are wrong, you get a red error box that includes the underlying Supabase error.

## Troubleshooting

- Double-check `.env.local` matches your Supabase API settings and restart the dev server after editing it.
- Ensure the RLS policy above exists and Realtime is enabled if you later add subscriptions.
- If you see “JWT invalid” errors, rotate the anon key in Supabase and update `.env.local`.
