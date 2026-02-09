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

### Data Not Appearing
- Check Vercel logs for API errors
- Verify the database connection is working
- Check that tables were created successfully

