# Vercel Postgres Database Setup

This project uses Vercel Postgres for storing application data. Follow these steps to set up the database.

## Step 1: Create Vercel Postgres Database

**Note:** Postgres is now available through the Vercel Marketplace.

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to the **Storage** tab
4. Click **Browse Storage** or look for **Marketplace** option
5. In the Marketplace, search for **Postgres** or **Neon Postgres**
6. Click on the Postgres option
7. Click **Add Integration** or **Create**
8. Choose a name for your database (e.g., `demirti-db`)
9. Select a region (choose closest to your users)
10. Follow the setup wizard to create your database

**Alternative:** You can also use Neon Postgres (recommended) which integrates seamlessly with Vercel:
- Go to https://neon.tech
- Create a free account
- Create a new project
- Copy the connection string
- Add it to your Vercel environment variables as `POSTGRES_URL`

## Step 2: Get Connection String

After creating the database:

1. Go to the **Storage** tab in your Vercel project
2. Click on your Postgres database
3. Go to the **.env.local** tab
4. Copy the connection string variables

You'll see variables like:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`
- `POSTGRES_PASSWORD`

## Step 3: Add Environment Variables

Add these to your `.env.local` file (for local development) and Vercel project settings (for production):

```env
# Vercel Postgres (automatically added by Vercel)
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_prisma_url_here
POSTGRES_URL_NON_POOLING=your_non_pooling_url_here
POSTGRES_USER=your_user
POSTGRES_HOST=your_host
POSTGRES_DATABASE=your_database
POSTGRES_PASSWORD=your_password

# Other existing variables
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=no-reply@demirti.com
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Optional: Read replica for scaling read operations (Neon same-region replica)
# When set, read-heavy routes use this for SELECT queries; falls back to POSTGRES_URL if unset
POSTGRES_URL_READ_REPLICA=
```

## Step 4: Initialize Database Tables

After setting up the database, initialize the tables by visiting:

**Local development:**
```
http://localhost:3000/api/init-db
```

**Production:**
```
https://your-domain.com/api/init-db
```

This will create the necessary tables:
- `applications` - Stores all application data
- `scholarship_tracking` - Tracks scholarship count
- `admins` - Admin users (email, bcrypt password hash)
- `admin_password_resets` - OTPs for forgot-password flow
- plus `tracks`, `discounts`, `events` as used by the app

## Admin authentication

**What we use:** Custom auth (no third-party). Admins are stored in the `admins` table; passwords are hashed with **bcrypt**. After login, the client stores a token in **localStorage** and checks it to show the admin dashboard. API routes do not validate the token server-side; they rely on the client redirecting to `/admin/login` when not authenticated.

**Create your first admin** (when there are no admins yet):

1. Ensure the DB is initialized (visit `/api/init-db` once).
2. Call the create-admin API with email, password, and optional name. For example with curl:

   ```bash
   curl -X POST https://your-domain.com/api/admin/admins \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"YourSecurePassword","firstName":"Admin","lastName":"User"}'
   ```

   For local dev, use `http://localhost:3000/api/admin/admins`.

3. Log in at `/admin/login` with that email and password.

**Create more admins:** Log in → **Admin** → **Config** → **Admins** tab → use the form to add or edit admins.

**Forgot password:** On the login page, use **Forgot password?** → enter your admin email → receive an OTP by email → enter OTP → set new password and confirm → you are logged in and redirected to the dashboard.

## Step 5: Verify Setup

You can verify the database is working by:

1. Submitting a test application
2. Checking the Vercel dashboard → Storage → Your Database → Data tab
3. You should see data in the `applications` table

## Database Schema

### Applications Table
- `id` - Serial primary key
- `application_id` - Unique application identifier
- `first_name` - Applicant's first name
- `last_name` - Applicant's last name
- `email` - Applicant's email
- `phone` - Applicant's phone number
- `track_name` - Selected track (Data Science/Project Management)
- `payment_option` - Payment method (default: paystack)
- `payment_reference` - Paystack payment reference (null if unpaid)
- `amount` - Payment amount in kobo (null if unpaid)
- `status` - Application status (pending/paid)
- `created_at` - Application creation timestamp
- `paid_at` - Payment completion timestamp (null if unpaid)

### Scholarship Tracking Table
- `id` - Serial primary key
- `count` - Current number of paid learners
- `last_updated` - Last update timestamp

## Production migration (old DB → new DB)

To move production from one Neon DB to another **without any code changes**:

1. **New DB schema**  
   The app creates tables on whichever DB is in `POSTGRES_URL` when the request runs. To create tables on the **new** DB only:
   - **Locally:** In `.env.local`, set `POSTGRES_URL` to the **actual new DB connection string** (copy the value from your `NEW_POSTGRES_URL` in Vercel—do not set it to the literal text `NEW_POSTGRES_URL`). Restart the dev server (`npm run dev`), then open **http://localhost:3000/api/init-db** in the browser. The local process uses your local env, so tables are created in the new DB.
   - **Not production:** If you call your production URL (e.g. `https://your-domain.com/api/init-db`), the server uses Production env, where `POSTGRES_URL` is still the old DB—so tables would be created in the old DB, not the new one.

2. **Copy data**  
   From a machine that can reach both DBs (e.g. your laptop), use `pg_dump` and `pg_restore`. You need the **old** DB URL (current `POSTGRES_URL`) as source and the **new** DB URL (`NEW_POSTGRES_URL`) as destination. Load them into your shell (e.g. `export POSTGRES_URL="..."` and `export NEW_POSTGRES_URL="..."` from Vercel → Project → Settings → Environment Variables, or from a file).

   **Option A – New DB is still empty (you did not run step 1 yet)**  
   Dump schema and data from the old DB, then restore everything into the new DB:

   1. Dump from the **old** DB (source):  
      `pg_dump "$POSTGRES_URL" --no-owner --no-acl -F c -f old.dump`
   2. Restore into the **new** DB (destination):  
      `pg_restore --no-owner --no-acl -d "$NEW_POSTGRES_URL" old.dump`

   **Option B – New DB already has an empty schema from step 1**  
   Dump only data from the old DB, then load that data into the new DB so you don’t duplicate or conflict on table/enum creation:

   1. Dump **data only** from the **old** DB (source):  
      `pg_dump "$POSTGRES_URL" --no-owner --no-acl -F c --data-only -f old-data.dump`
   2. Restore that data into the **new** DB (destination):  
      `pg_restore --no-owner --no-acl -d "$NEW_POSTGRES_URL" old-data.dump`

   **Tips:**  
   - Double-check which URL is which: `POSTGRES_URL` = old (source), `NEW_POSTGRES_URL` = new (destination). Restoring into the wrong URL will write to the wrong database.  
   - If you see connection or SSL errors, try the non-pooling URLs (`POSTGRES_URL_NON_POOLING` and `NEW_POSTGRES_URL_NON_POOLING`) for both dump and restore.  
   - Keep the dump file (e.g. `old.dump` or `old-data.dump`) until you’ve verified the new DB; then you can delete it.

3. **Verify**  
   Compare row counts and spot-check important tables on old vs new.

4. **Cutover**  
   In Vercel → Project → Settings → Environment Variables (Production), set `POSTGRES_URL` (and `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_READ_REPLICA` if used) to the **new** DB URLs. Redeploy so production uses the new DB. No application code changes are required; the app only reads `POSTGRES_*`.

5. **Cleanup**  
   Remove the old `POSTGRES_*` and optional `NEW_POSTGRES_*` vars from Vercel, and delete the old Neon project.

## Migration from JSON Files

If you have existing data in JSON files (`data/applications.json`), you can migrate it by:

1. Reading the JSON file
2. Using the `/api/save-application` endpoint to import each record
3. Or writing a migration script

## Troubleshooting

### Connection Issues
- Ensure all environment variables are set correctly
- Check that the database is created in Vercel
- Verify the connection string is correct

### Table Creation Issues
- Run `/api/init-db` endpoint again
- Check Vercel logs for errors
- Ensure you have proper database permissions
- **Init-db writing to the wrong DB:** If you need tables on the new DB, run init-db from **local** with `POSTGRES_URL` in `.env.local` set to the new DB URL, then open `http://localhost:3000/api/init-db`. Calling production’s `/api/init-db` uses production’s `POSTGRES_URL` (the old DB).

### Data Not Appearing
- Check Vercel logs for API errors
- Verify the database connection is working
- Check that tables were created successfully

