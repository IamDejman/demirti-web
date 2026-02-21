/**
 * Primary database connection for writes and init.
 * For read-only queries (public catalogs), use sqlRead from @/lib/db-read.
 */
import './env-db';
import { sql } from '@vercel/postgres';
import { DEFAULT_SPONSORED_COHORT, validateEnv } from './config';

// Check if database is initialized
let dbInitialized = false;
let initializationPromise = null;

export async function ensureDatabaseInitialized() {
  validateEnv();
  if (dbInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Check if tracks table exists (one of our main tables)
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tracks'
        );
      `;

      if (!tableCheck.rows[0].exists) {
        console.log('Database tables not found. Initializing...');
        await initializeDatabase();
        console.log('Database initialized successfully');
      } else {
        // Ensure admin_password_resets exists (added later for forgot-password)
        const resetTableCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'admin_password_resets'
          );
        `;
        if (!resetTableCheck.rows[0].exists) {
          console.log('Creating admin_password_resets table...');
          await sql`
            CREATE TABLE IF NOT EXISTS admin_password_resets (
              id SERIAL PRIMARY KEY,
              email VARCHAR(255) NOT NULL,
              otp VARCHAR(10) NOT NULL,
              expires_at TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
          await sql`
            CREATE INDEX IF NOT EXISTS idx_admin_password_resets_email_expires
            ON admin_password_resets(email, expires_at);
          `;
          console.log('admin_password_resets table created');
        }
        // Admin sessions for token-based auth
        const adminSessionsCheck = await sql`
          SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_sessions');
        `;
        if (!adminSessionsCheck.rows[0].exists) {
          await sql`
            CREATE TABLE IF NOT EXISTS admin_sessions (
              id SERIAL PRIMARY KEY,
              admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
              token VARCHAR(255) NOT NULL UNIQUE,
              expires_at TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
          await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)`;
          await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)`;
          console.log('admin_sessions table created');
        }
        // Sponsored cohort applications (essay-based, no payment)
        const sponsoredAppsCheck = await sql`
          SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sponsored_applications');
        `;
        if (!sponsoredAppsCheck.rows[0].exists) {
          await sql`CREATE TABLE sponsored_applications (
              id SERIAL PRIMARY KEY,
              application_id VARCHAR(255) UNIQUE NOT NULL,
              first_name VARCHAR(255) NOT NULL,
              last_name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              phone VARCHAR(50) NOT NULL,
              linkedin_url VARCHAR(500),
              city VARCHAR(255),
              occupation VARCHAR(500),
              essay TEXT NOT NULL,
              ack_linkedin_48h BOOLEAN DEFAULT false,
              ack_commitment BOOLEAN DEFAULT false,
              review_status VARCHAR(50) DEFAULT 'pending_review',
              accepted_at TIMESTAMP,
              linkedin_post_url VARCHAR(500),
              confirmed_at TIMESTAMP,
              forfeited_at TIMESTAMP,
              cohort_name VARCHAR(255) DEFAULT 'Data Science Feb 2026',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
          const cohortDefault = DEFAULT_SPONSORED_COHORT || null;
          if (cohortDefault && cohortDefault !== 'Data Science Feb 2026') {
            await sql`ALTER TABLE sponsored_applications ALTER COLUMN cohort_name SET DEFAULT ${cohortDefault}`;
          }
          await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_review_status ON sponsored_applications(review_status)`;
          await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_email ON sponsored_applications(email)`;
          console.log('sponsored_applications table created');
        }
      }
      dbInitialized = true;
    } catch (error) {
      console.error('Error checking/initializing database:', error);
      // Don't throw - let the calling function handle the error
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('Starting database initialization...');
  try {
    // Create admins table
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `;

    // Create index on email
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admins_email 
      ON admins(email);
    `;

    // Create admin_password_resets table for forgot-password OTP
    await sql`
      CREATE TABLE IF NOT EXISTS admin_password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_password_resets_email_expires
      ON admin_password_resets(email, expires_at);
    `;

    // Create tracks table to store track configuration
    await sql`
      CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        track_name VARCHAR(255) UNIQUE NOT NULL,
        course_price INTEGER NOT NULL,
        scholarship_limit INTEGER DEFAULT 10,
        scholarship_discount_percentage DECIMAL(5,2) DEFAULT 50.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create index on track_name
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tracks_name 
      ON tracks(track_name);
    `;

    // Initialize default tracks if they don't exist
    await sql`
      INSERT INTO tracks (track_name, course_price, scholarship_limit, scholarship_discount_percentage, is_active)
      VALUES 
        ('Data Science', 150000, 10, 50.00, true),
        ('Project Management', 150000, 10, 50.00, true)
      ON CONFLICT (track_name) DO NOTHING;
    `;

    // Create discounts table
    await sql`
      CREATE TABLE IF NOT EXISTS discounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create index on discounts name
    await sql`
      CREATE INDEX IF NOT EXISTS idx_discounts_name 
      ON discounts(name);
    `;

    // Create applications table
    await sql`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        application_id VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        track_name VARCHAR(255) NOT NULL,
        payment_option VARCHAR(50) DEFAULT 'paystack',
        payment_reference VARCHAR(255),
        amount INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        discount_code VARCHAR(255),
        referral_source VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP
      );
    `;

    // Add discount_code column to applications if it doesn't exist (for existing databases)
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'applications' AND column_name = 'discount_code'
        ) THEN
          ALTER TABLE applications ADD COLUMN discount_code VARCHAR(255);
        END IF;
      END $$;
    `;

    // Add referral_source column to applications if it doesn't exist (for existing databases)
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'applications' AND column_name = 'referral_source'
        ) THEN
          ALTER TABLE applications ADD COLUMN referral_source VARCHAR(255);
        END IF;
      END $$;
    `;

    // Create index on email and track_name for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_applications_email_track 
      ON applications(email, track_name);
    `;

    // Create index on payment_reference
    await sql`
      CREATE INDEX IF NOT EXISTS idx_applications_payment_ref 
      ON applications(payment_reference);
    `;

    // Create scholarship_tracking table (per track)
    // Check if table exists and what columns it has
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'scholarship_tracking'
      );
    `;

    if (tableExists.rows[0].exists) {
      // Table exists, check if it has track_name column
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'scholarship_tracking' 
        AND column_name = 'track_name';
      `;

      if (columnCheck.rows.length === 0) {
        // Old table structure exists, need to migrate
        console.log('Migrating scholarship_tracking table to per-track structure...');
        await sql`DROP TABLE IF EXISTS scholarship_tracking CASCADE;`;
        
        // Create new table with track_name
        await sql`
          CREATE TABLE scholarship_tracking (
            id SERIAL PRIMARY KEY,
            track_name VARCHAR(255) UNIQUE NOT NULL,
            count INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        // Create index
        await sql`
          CREATE INDEX idx_scholarship_tracking_track 
          ON scholarship_tracking(track_name);
        `;
        
        // Initialize default counts for both tracks
        await sql`
          INSERT INTO scholarship_tracking (track_name, count, last_updated)
          VALUES 
            ('Data Science', 0, CURRENT_TIMESTAMP),
            ('Project Management', 0, CURRENT_TIMESTAMP)
          ON CONFLICT (track_name) DO NOTHING;
        `;
        
        console.log('Migration completed successfully');
      } else {
        // Table already has track_name, just ensure indexes exist
        await sql`
          CREATE INDEX IF NOT EXISTS idx_scholarship_tracking_track 
          ON scholarship_tracking(track_name);
        `;
      }
    } else {
      // Table doesn't exist, create it with new structure
      await sql`
        CREATE TABLE scholarship_tracking (
          id SERIAL PRIMARY KEY,
          track_name VARCHAR(255) UNIQUE NOT NULL,
          count INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await sql`
        CREATE INDEX idx_scholarship_tracking_track 
        ON scholarship_tracking(track_name);
      `;
      
      // Initialize default counts for both tracks
      await sql`
        INSERT INTO scholarship_tracking (track_name, count, last_updated)
        VALUES 
          ('Data Science', 0, CURRENT_TIMESTAMP),
          ('Project Management', 0, CURRENT_TIMESTAMP);
      `;
    }

    await sql`CREATE TABLE IF NOT EXISTS sponsored_applications (
        id SERIAL PRIMARY KEY,
        application_id VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        linkedin_url VARCHAR(500),
        city VARCHAR(255),
        occupation VARCHAR(500),
        essay TEXT NOT NULL,
        ack_linkedin_48h BOOLEAN DEFAULT false,
        ack_commitment BOOLEAN DEFAULT false,
        review_status VARCHAR(50) DEFAULT 'pending_review',
        accepted_at TIMESTAMP,
        linkedin_post_url VARCHAR(500),
        confirmed_at TIMESTAMP,
        forfeited_at TIMESTAMP,
        cohort_name VARCHAR(255) DEFAULT 'Data Science Feb 2026',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    const cohortDefault2 = DEFAULT_SPONSORED_COHORT || null;
    if (cohortDefault2 && cohortDefault2 !== 'Data Science Feb 2026') {
      await sql`ALTER TABLE sponsored_applications ALTER COLUMN cohort_name SET DEFAULT ${cohortDefault2}`;
    }
    await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_review_status ON sponsored_applications(review_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_email ON sponsored_applications(email)`;

    // Additional indexes for query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Application functions
export async function saveApplication(application) {
  const applicationId = `APP_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const result = await sql`
    INSERT INTO applications (
      application_id,
      first_name,
      last_name,
      email,
      phone,
      track_name,
      payment_option,
      payment_reference,
      amount,
      status,
      discount_code,
      referral_source,
      created_at
    ) VALUES (
      ${applicationId},
      ${application.firstName},
      ${application.lastName},
      ${application.email},
      ${application.phone},
      ${application.trackName},
      ${application.paymentOption || 'paystack'},
      ${application.paymentReference || null},
      ${application.amount || null},
      ${application.paymentReference ? 'paid' : 'pending'},
      ${application.discountCode || null},
      ${application.referralSource || null},
      CURRENT_TIMESTAMP
    )
    RETURNING *;
  `;

  return { ...result.rows[0], id: applicationId };
}

export async function getAllApplications() {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM applications
    ORDER BY created_at DESC;
  `;
  
  return result.rows;
}

export async function updateApplicationPayment(email, trackName, paymentReference, amount) {
  await ensureDatabaseInitialized();
  const result = await sql`
    UPDATE applications
    SET 
      payment_reference = ${paymentReference},
      amount = ${amount},
      status = 'paid',
      paid_at = CURRENT_TIMESTAMP
    WHERE email = ${email} 
      AND track_name = ${trackName}
      AND payment_reference IS NULL
    RETURNING *;
  `;

  if (result.rows.length === 0) {
    // If no existing application found, create a new one
    // This handles cases where webhook arrives before form submission
    return null;
  }

  return result.rows[0];
}

export async function getApplicationByEmailAndTrack(email, trackName) {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM applications
    WHERE email = ${email} AND track_name = ${trackName}
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

// Sponsored application functions - re-exported from db-sponsored.js
export {
  saveSponsoredApplication,
  getAllSponsoredApplications,
  getSponsoredApplicationById,
  getSponsoredApplicationByEmail,
  updateSponsoredApplicationReviewStatus,
  updateSponsoredApplicationConfirmation,
  updateSponsoredApplicationConfirmationByEmail,
  markSponsoredApplicationForfeited,
  getNextWaitlistApplicant,
} from './db-sponsored';

// Scholarship functions (per track)
export async function getScholarshipCount(trackName) {
  await ensureDatabaseInitialized();
  if (!trackName) {
    return { count: 0 };
  }

  const result = await sql`
    SELECT count, last_updated FROM scholarship_tracking
    WHERE track_name = ${trackName}
    LIMIT 1;
  `;
  
  if (result.rows.length === 0) {
    // Initialize count for this track if it doesn't exist
    await sql`
      INSERT INTO scholarship_tracking (track_name, count, last_updated)
      VALUES (${trackName}, 0, CURRENT_TIMESTAMP)
      ON CONFLICT (track_name) DO NOTHING;
    `;
    return { count: 0 };
  }
  
  return {
    count: parseInt(result.rows[0].count) || 0,
    last_updated: result.rows[0].last_updated
  };
}

export async function incrementScholarshipCount(trackName) {
  await ensureDatabaseInitialized();
  if (!trackName) {
    throw new Error('Track name is required to increment scholarship count');
  }

  // Ensure the track exists in the table
  await sql`
    INSERT INTO scholarship_tracking (track_name, count, last_updated)
    VALUES (${trackName}, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (track_name) DO NOTHING;
  `;

  // Get current count
  const current = await getScholarshipCount(trackName);
  const newCount = (current.count || 0) + 1;
  
  // Update count for this specific track
  await sql`
    UPDATE scholarship_tracking
    SET count = ${newCount}, last_updated = CURRENT_TIMESTAMP
    WHERE track_name = ${trackName};
  `;
  
  return newCount;
}

// Track configuration functions
export async function getTrackConfig(trackName) {
  await ensureDatabaseInitialized();
  if (!trackName) {
    return null;
  }

  const result = await sql`
    SELECT * FROM tracks
    WHERE track_name = ${trackName} AND is_active = true
    LIMIT 1;
  `;
  
  return result.rows[0] || null;
}

export async function getAllTracks() {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM tracks
    WHERE is_active = true
    ORDER BY track_name;
  `;
  
  return result.rows;
}

export async function updateTrackConfig(trackName, updates) {
  await ensureDatabaseInitialized();
  // Build update query dynamically based on provided fields
  let updateFields = [];
  let updateValues = [];
  
  if (updates.coursePrice !== undefined) {
    updateFields.push('course_price');
    updateValues.push(updates.coursePrice);
  }
  if (updates.scholarshipLimit !== undefined) {
    updateFields.push('scholarship_limit');
    updateValues.push(updates.scholarshipLimit);
  }
  if (updates.scholarshipDiscountPercentage !== undefined) {
    updateFields.push('scholarship_discount_percentage');
    updateValues.push(updates.scholarshipDiscountPercentage);
  }
  if (updates.isActive !== undefined) {
    updateFields.push('is_active');
    updateValues.push(updates.isActive);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  // Build the SET clause manually with proper parameterization
  const setParts = updateFields.map((field, index) => {
    const value = updateValues[index];
    if (field === 'course_price') {
      return sql`course_price = ${value}`;
    } else if (field === 'scholarship_limit') {
      return sql`scholarship_limit = ${value}`;
    } else if (field === 'scholarship_discount_percentage') {
      return sql`scholarship_discount_percentage = ${value}`;
    } else if (field === 'is_active') {
      return sql`is_active = ${value}`;
    }
  }).filter(Boolean);
  
  const setClause = setParts.length === 1
    ? setParts[0]
    : setParts.reduce((prev, part) => (prev === null ? part : sql`${prev}, ${part}`), null);
  
  const result = await sql`
    UPDATE tracks
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE track_name = ${trackName}
    RETURNING *;
  `;
  
  return result.rows[0] || null;
}

// Discount functions
export async function getAllDiscounts() {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM discounts
    ORDER BY created_at DESC;
  `;
  
  return result.rows;
}

export async function getDiscountById(id) {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM discounts
    WHERE id = ${id}
    LIMIT 1;
  `;
  
  return result.rows[0] || null;
}

export async function getDiscountByName(name) {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM discounts
    WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    LIMIT 1;
  `;
  
  return result.rows[0] || null;
}

export async function createDiscount(name, percentage) {
  await ensureDatabaseInitialized();
  const result = await sql`
    INSERT INTO discounts (name, percentage, is_active)
    VALUES (${name}, ${percentage}, true)
    RETURNING *;
  `;
  
  return result.rows[0];
}

export async function updateDiscount(id, updates) {
  await ensureDatabaseInitialized();
  let updateFields = [];
  let updateValues = [];
  
  if (updates.name !== undefined) {
    updateFields.push('name');
    updateValues.push(updates.name);
  }
  if (updates.percentage !== undefined) {
    updateFields.push('percentage');
    updateValues.push(updates.percentage);
  }
  if (updates.isActive !== undefined) {
    updateFields.push('is_active');
    updateValues.push(updates.isActive);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  const setParts = updateFields.map((field, index) => {
    const value = updateValues[index];
    if (field === 'name') {
      return sql`name = ${value}`;
    } else if (field === 'percentage') {
      return sql`percentage = ${value}`;
    } else if (field === 'is_active') {
      return sql`is_active = ${value}`;
    }
  }).filter(Boolean);
  
  const setClause = setParts.length === 1
    ? setParts[0]
    : setParts.reduce((prev, part) => (prev === null ? part : sql`${prev}, ${part}`), null);
  
  const result = await sql`
    UPDATE discounts
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *;
  `;
  
  return result.rows[0] || null;
}

export async function deleteDiscount(id) {
  await ensureDatabaseInitialized();
  const result = await sql`
    DELETE FROM discounts
    WHERE id = ${id}
    RETURNING *;
  `;
  
  return result.rows[0] || null;
}
