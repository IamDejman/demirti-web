import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initializeDatabase() {
  try {
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

    // Create scholarship_tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS scholarship_tracking (
        id SERIAL PRIMARY KEY,
        count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Initialize scholarship count if not exists
    const scholarshipCheck = await sql`
      SELECT COUNT(*) as count FROM scholarship_tracking;
    `;
    
    if (scholarshipCheck.rows[0].count === '0') {
      await sql`
        INSERT INTO scholarship_tracking (count, last_updated)
        VALUES (0, CURRENT_TIMESTAMP);
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

export async function getAllApplications() {
  const result = await sql`
    SELECT * FROM applications
    ORDER BY created_at DESC;
  `;
  return result.rows;
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

// Scholarship functions
export async function getScholarshipCount() {
  const result = await sql`
    SELECT count, last_updated FROM scholarship_tracking
    ORDER BY id DESC
    LIMIT 1;
  `;
  
  if (result.rows.length === 0) {
    return { count: 0 };
  }
  
  return {
    count: parseInt(result.rows[0].count) || 0,
    last_updated: result.rows[0].last_updated
  };
}

export async function incrementScholarshipCount() {
  const current = await getScholarshipCount();
  const newCount = (current.count || 0) + 1;
  
  await sql`
    UPDATE scholarship_tracking
    SET count = ${newCount}, last_updated = CURRENT_TIMESTAMP
    WHERE id = (SELECT id FROM scholarship_tracking ORDER BY id DESC LIMIT 1);
  `;
  
  return newCount;
}

