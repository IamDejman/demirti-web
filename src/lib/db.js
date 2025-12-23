import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initializeDatabase() {
  try {
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP
      );
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
      CURRENT_TIMESTAMP
    )
    RETURNING *;
  `;

  return { ...result.rows[0], id: applicationId };
}

export async function getAllApplications() {
  const result = await sql`
    SELECT * FROM applications
    ORDER BY created_at DESC;
  `;
  
  return result.rows;
}

export async function updateApplicationPayment(email, trackName, paymentReference, amount) {
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
  const result = await sql`
    SELECT * FROM applications
    WHERE email = ${email} AND track_name = ${trackName}
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

// Scholarship functions (per track)
export async function getScholarshipCount(trackName) {
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
  const result = await sql`
    SELECT * FROM tracks
    WHERE is_active = true
    ORDER BY track_name;
  `;
  
  return result.rows;
}

export async function updateTrackConfig(trackName, updates) {
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
  
  // Combine all SET parts
  const setClause = sql.join(setParts, sql`, `);
  
  const result = await sql`
    UPDATE tracks
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE track_name = ${trackName}
    RETURNING *;
  `;
  
  return result.rows[0] || null;
}

