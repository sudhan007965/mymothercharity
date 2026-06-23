# Deployment Guide - MY MOTHER TRUST

This guide provides step-by-step instructions to set up your backend on **Supabase** and deploy the frontend to **Netlify** or **Vercel**.

---

## Part 1: Supabase Setup (Database & Storage)

Follow these steps to connect your website's dynamic photo gallery and admin upload dashboard to a live Supabase project.

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project** and select your organization.
3. Choose a project name (e.g., `My Mother Trust`), set a secure Database Password, and select the region nearest to you.
4. Wait for the project to finish initializing (typically takes 1-2 minutes).

### Step 2: Initialize the Database Table
1. In the Supabase Sidebar, navigate to **SQL Editor** (the terminal icon `>_`).
2. Click **New Query**.
3. Copy and paste the following SQL script to create the table and enable Row Level Security (RLS):

```sql
-- 1. Create table for gallery photos
create table gallery_photos (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  category text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table gallery_photos enable row level security;

-- 3. Create Policy: Allow public read access to photos
create policy "Allow public read access" on gallery_photos
  for select using (true);

-- 4. Create Policy: Allow authenticated users (logged-in admins) to insert new photos
create policy "Allow authenticated inserts" on gallery_photos
  for insert with check (auth.role() = 'authenticated');

-- 5. Create Policy: Allow authenticated users to delete photos
create policy "Allow authenticated deletes" on gallery_photos
  for delete using (auth.role() = 'authenticated');
```

4. Click **Run** at the bottom right. You should see a `Success` message.

### Step 3: Configure Storage (Image Bucket)
1. Go to the Sidebar and click on **Storage** (the bucket icon).
2. Click **New Bucket**.
3. Name the bucket exactly: `gallery-images`.
4. **IMPORTANT**: Toggle **Public Bucket** to **Enabled** (so visitors can read the images directly).
5. Click **Save**.
6. Set Storage policies:
   - Click **Policies** on the sidebar under Storage.
   - Look for the `gallery-images` bucket policies.
   - Click **New Policy** and choose **For full customization**.
   - **Read Policy**:
     - Name: `Public Read Access`
     - Allowed Operations: Checked `SELECT` only.
     - Target: `public` role.
   - **Upload/Delete Policy**:
     - Name: `Authenticated Upload & Delete`
     - Allowed Operations: Checked `INSERT`, `DELETE`.
     - Target: `authenticated` role (only logged-in admins).
     - Expression: `(role() = 'authenticated'::text)`

### Step 4: Add Authorized Admin Users
1. Go to the Sidebar and navigate to **Authentication** (the key icon).
2. Click **Add User** -> **Create User**.
3. Enter the email address and password of the admins you trust (e.g. your email).
4. Click **Save**. (They will now be able to log in to `/admin.html`).

### Step 5: Configure Credentials in the Code
1. In your Supabase Dashboard, go to **Project Settings** (the gear icon on the bottom of the sidebar) -> **API**.
2. Copy the **Project URL** and the **anon public API Key**.
3. Open `config.js` in your project folder and replace the values:

```javascript
const SUPABASE_CONFIG = {
  url: "https://your-supabase-project-url.supabase.co",
  anonKey: "your-anon-public-api-key"
};
```
4. Save the file. The website is now connected to your live database!

---

## Part 2: Deploying to Netlify (Drag and Drop)

Netlify is the simplest option for static web pages.

### Method A: Drag & Drop (Instant)
1. Log in to [Netlify](https://netlify.com).
2. Go to the **Sites** tab.
3. Drag the entire project folder (`mymothercharity` directory containing your index.html, about.html, config.js, etc.) and drop it into the designated box at the bottom of the page.
4. Netlify will deploy it in seconds and give you a public URL (e.g., `https://random-name.netlify.app`). You can customize the subdomain in settings.

### Method B: Git Integration (Auto-deploy on git push)
1. Push your folder to a **GitHub** repository.
2. In Netlify, click **Import from Git**.
3. Select your repository.
4. Leave build settings blank (Vite/Build commands are not needed since this is static HTML/CSS/JS). Set publish directory to `.` (current directory).
5. Click **Deploy**.

---

## Part 3: Deploying to Vercel

Vercel is another high-performance hosting platform.

### Method A: Deploy via GitHub (Recommended)
1. Push your code to a repository on **GitHub**, **GitLab**, or **Bitbucket**.
2. Log in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
3. Import your repository.
4. Under **Build & Development Settings**, toggle **Build Command** and **Output Directory** to **OVERRIDE** (leave them empty or set to defaults since there is no build step).
5. Click **Deploy**.

### Method B: Deploy via Vercel CLI (Terminal)
1. Open PowerShell or Command Prompt inside your project directory (`d:\mymothercharity`).
2. Run: `npx vercel`
3. Log in if prompted, answer the questions (select defaults), and it will upload and deploy the site instantly.
