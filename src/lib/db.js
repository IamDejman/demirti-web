import { sql } from '@vercel/postgres';
import { DEFAULT_SPONSORED_COHORT } from './config';

// Check if database is initialized
let dbInitialized = false;
let initializationPromise = null;

export async function ensureDatabaseInitialized() {
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
          const cohortDefault = (DEFAULT_SPONSORED_COHORT || 'Data Science Feb 2026').replace(/'/g, "''");
          const createSql = `CREATE TABLE sponsored_applications (
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
              cohort_name VARCHAR(255) DEFAULT '${cohortDefault}',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
          const template = Object.assign([createSql], { raw: [createSql] });
          await sql(template);
          await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_review_status ON sponsored_applications(review_status)`;
          await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_email ON sponsored_applications(email)`;
          console.log('sponsored_applications table created');
        }
        // Analytics schema (sessions, visitors, goals, funnels, daily_stats, extend events)
        const sessionsCheck = await sql`
          SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions');
        `;
        if (!sessionsCheck.rows[0].exists) {
          await ensureAnalyticsSchema();
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

    // Create events table for analytics
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL, -- e.g. 'pageview' or 'event'
        name VARCHAR(255),         -- event name when type = 'event'
        session_id VARCHAR(255),
        url TEXT,
        referrer TEXT,
        properties JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Indexes for faster analytics queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_created_at
      ON events(created_at);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_url
      ON events(url);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_name
      ON events(name);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_session_id
      ON events(session_id);
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

    // Sponsored cohort applications table (DEFAULT must be literal, not parameter)
    const cohortDefault = (DEFAULT_SPONSORED_COHORT || 'Data Science Feb 2026').replace(/'/g, "''");
    const createSql = `CREATE TABLE IF NOT EXISTS sponsored_applications (
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
        cohort_name VARCHAR(255) DEFAULT '${cohortDefault}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    const template = Object.assign([createSql], { raw: [createSql] });
    await sql(template);
    await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_review_status ON sponsored_applications(review_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sponsored_applications_email ON sponsored_applications(email)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Analytics schema: new tables and extend events (run when sessions table is missing)
async function ensureAnalyticsSchema() {
  const addCol = async (fn) => {
    try {
      await fn();
    } catch (e) {
      if (e.code !== '42701') throw e; // duplicate_column
    }
  };
  await addCol(() => sql`ALTER TABLE events ADD COLUMN visitor_id VARCHAR(255)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN utm_source VARCHAR(255)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN utm_medium VARCHAR(255)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN utm_campaign VARCHAR(255)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN utm_content VARCHAR(255)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN utm_term VARCHAR(255)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN traffic_channel VARCHAR(50)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN device_type VARCHAR(50)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN browser VARCHAR(100)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN os VARCHAR(100)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN screen_resolution VARCHAR(50)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN viewport_size VARCHAR(50)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN language VARCHAR(20)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN country VARCHAR(100)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN city VARCHAR(255)`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN page_duration_seconds INTEGER`);
  await addCol(() => sql`ALTER TABLE events ADD COLUMN scroll_depth_percent INTEGER`);

  await sql`CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON events(visitor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_traffic_channel ON events(traffic_channel)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_country ON events(country)`;

  await sql`
    CREATE TABLE IF NOT EXISTS visitors (
      visitor_id VARCHAR(255) PRIMARY KEY,
      first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total_sessions INTEGER DEFAULT 0,
      total_pageviews INTEGER DEFAULT 0,
      total_events INTEGER DEFAULT 0
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_visitors_first_seen_at ON visitors(first_seen_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(255) PRIMARY KEY,
      visitor_id VARCHAR(255) NOT NULL,
      started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP,
      duration_seconds INTEGER,
      pageview_count INTEGER DEFAULT 0,
      event_count INTEGER DEFAULT 0,
      entry_page TEXT,
      exit_page TEXT,
      bounced BOOLEAN,
      device_type VARCHAR(50),
      browser VARCHAR(100),
      os VARCHAR(100),
      country VARCHAR(100),
      city VARCHAR(255),
      traffic_channel VARCHAR(50),
      utm_source VARCHAR(255),
      utm_medium VARCHAR(255),
      utm_campaign VARCHAR(255),
      is_new_visitor BOOLEAN DEFAULT true,
      last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON sessions(visitor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_traffic_channel ON sessions(traffic_channel)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_country ON sessions(country)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_last_activity_at ON sessions(last_activity_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      match_value TEXT NOT NULL,
      match_type VARCHAR(20) DEFAULT 'contains',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goal_completions (
      id SERIAL PRIMARY KEY,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      session_id VARCHAR(255),
      visitor_id VARCHAR(255),
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_goal_completions_goal_id ON goal_completions(goal_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_goal_completions_completed_at ON goal_completions(completed_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS funnels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      steps JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_stats (
      date DATE NOT NULL,
      traffic_channel VARCHAR(50) NOT NULL DEFAULT 'other',
      device_type VARCHAR(50) NOT NULL DEFAULT 'desktop',
      country VARCHAR(100) NOT NULL DEFAULT 'Unknown',
      pageviews BIGINT DEFAULT 0,
      unique_visitors BIGINT DEFAULT 0,
      sessions BIGINT DEFAULT 0,
      bounces BIGINT DEFAULT 0,
      total_duration_seconds BIGINT DEFAULT 0,
      PRIMARY KEY (date, traffic_channel, device_type, country)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS consent_log (
      id SERIAL PRIMARY KEY,
      visitor_id VARCHAR(255),
      consent_status VARCHAR(20) NOT NULL,
      ip_hash VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('Analytics schema ensured');
}

// Keys we never store in event properties (PII / privacy)
const PII_KEYS = new Set(['email', 'name', 'firstName', 'lastName', 'phone', 'password', 'token', 'address']);

// Analytics event functions
export async function recordEvent(event) {
  await ensureDatabaseInitialized();

  const {
    type,
    name = null,
    sessionId = null,
    visitorId = null,
    url = null,
    referrer = null,
    properties = null,
    utmSource = null,
    utmMedium = null,
    utmCampaign = null,
    utmContent = null,
    utmTerm = null,
    trafficChannel = null,
    deviceType = null,
    browser = null,
    os = null,
    screenResolution = null,
    viewportSize = null,
    language = null,
    country = null,
    city = null,
    pageDurationSeconds = null,
    scrollDepthPercent = null,
  } = event || {};

  if (!type) {
    throw new Error('Event type is required');
  }

  // Basic size limits to avoid oversized payloads
  const safeUrl = typeof url === 'string' ? url.slice(0, 2048) : null;
  const safeReferrer = typeof referrer === 'string' ? referrer.slice(0, 2048) : null;

  let safeProperties = null;
  if (properties && typeof properties === 'object') {
    try {
      const stripped = {};
      for (const [k, v] of Object.entries(properties)) {
        const key = String(k).toLowerCase();
        if (!PII_KEYS.has(key) && v !== undefined && v !== null) {
          stripped[k] = v;
        }
      }
      const jsonString = JSON.stringify(stripped);
      const limited = jsonString.length > 8192 ? jsonString.slice(0, 8192) : jsonString;
      safeProperties = limited ? JSON.parse(limited) : null;
    } catch {
      safeProperties = null;
    }
  }

  await sql`
    INSERT INTO events (
      type, name, session_id, visitor_id, url, referrer, properties,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, traffic_channel,
      device_type, browser, os, screen_resolution, viewport_size, language,
      country, city, page_duration_seconds, scroll_depth_percent
    )
    VALUES (
      ${type}, ${name}, ${sessionId}, ${visitorId}, ${safeUrl}, ${safeReferrer}, ${safeProperties},
      ${utmSource}, ${utmMedium}, ${utmCampaign}, ${utmContent}, ${utmTerm}, ${trafficChannel},
      ${deviceType}, ${browser}, ${os}, ${screenResolution}, ${viewportSize}, ${language},
      ${country}, ${city}, ${pageDurationSeconds}, ${scrollDepthPercent}
    )
  `;
}

export async function upsertVisitor(visitorId, { isPageview = false, isEvent = false } = {}) {
  await ensureDatabaseInitialized();
  if (!visitorId) return;

  const now = new Date();
  const result = await sql`
    INSERT INTO visitors (visitor_id, first_seen_at, last_seen_at, total_sessions, total_pageviews, total_events)
    VALUES (${visitorId}, ${now}, ${now}, 0, ${isPageview ? 1 : 0}, ${isEvent ? 1 : 0})
    ON CONFLICT (visitor_id) DO UPDATE SET
      last_seen_at = ${now},
      total_pageviews = visitors.total_pageviews + ${isPageview ? 1 : 0},
      total_events = visitors.total_events + ${isEvent ? 1 : 0}
    RETURNING *;
  `;
  return result.rows[0];
}

export async function upsertSession(sessionId, visitorId, data) {
  await ensureDatabaseInitialized();
  if (!sessionId || !visitorId) return;

  const now = new Date();
  const {
    entryPage = null,
    exitPage = null,
    isPageview = false,
    isEvent = false,
    deviceType = null,
    browser = null,
    os = null,
    country = null,
    city = null,
    trafficChannel = null,
    utmSource = null,
    utmMedium = null,
    utmCampaign = null,
    isNewVisitor = false,
  } = data || {};

  const existing = await sql`
    SELECT session_id FROM sessions WHERE session_id = ${sessionId} LIMIT 1;
  `;

  if (existing.rows.length === 0) {
    await sql`
      INSERT INTO sessions (
        session_id, visitor_id, started_at, last_activity_at,
        pageview_count, event_count, entry_page, exit_page,
        device_type, browser, os, country, city,
        traffic_channel, utm_source, utm_medium, utm_campaign, is_new_visitor
      )
      VALUES (
        ${sessionId}, ${visitorId}, ${now}, ${now},
        ${isPageview ? 1 : 0}, ${isEvent ? 1 : 0},
        ${entryPage}, ${exitPage},
        ${deviceType}, ${browser}, ${os}, ${country}, ${city},
        ${trafficChannel}, ${utmSource}, ${utmMedium}, ${utmCampaign}, ${isNewVisitor}
      )
    `;
  } else {
    await sql`
      UPDATE sessions SET
        last_activity_at = ${now},
        pageview_count = sessions.pageview_count + ${isPageview ? 1 : 0},
        event_count = sessions.event_count + ${isEvent ? 1 : 0},
        exit_page = ${exitPage}
      WHERE session_id = ${sessionId}
    `;
  }
}

export async function updateSessionBounce(sessionId, bounced) {
  await ensureDatabaseInitialized();
  if (!sessionId) return;
  await sql`
    UPDATE sessions SET bounced = ${bounced} WHERE session_id = ${sessionId}
  `;
}

export async function getVisitorSessionCount(visitorId) {
  await ensureDatabaseInitialized();
  if (!visitorId) return 0;
  const r = await sql`
    SELECT COUNT(*) AS cnt FROM sessions WHERE visitor_id = ${visitorId}
  `;
  return Number(r.rows[0]?.cnt ?? 0);
}

export async function getSessionBySessionId(sessionId) {
  await ensureDatabaseInitialized();
  if (!sessionId) return null;
  const r = await sql`
    SELECT * FROM sessions WHERE session_id = ${sessionId} LIMIT 1
  `;
  return r.rows[0] || null;
}

export async function getPageViewsByDay(startDate, endDate) {
  await ensureDatabaseInitialized();

  const result = await sql`
    SELECT
      DATE_TRUNC('day', created_at) AS day,
      COUNT(*) AS pageviews
    FROM events
    WHERE type = 'pageview'
      AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY day
    ORDER BY day ASC;
  `;

  return result.rows.map((row) => ({
    day: row.day,
    pageviews: Number(row.pageviews) || 0,
  }));
}

export async function getTopPages(startDate, endDate, limit = 20) {
  await ensureDatabaseInitialized();

  const result = await sql`
    SELECT
      url,
      COUNT(*) AS views
    FROM events
    WHERE type = 'pageview'
      AND url IS NOT NULL
      AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY url
    ORDER BY views DESC
    LIMIT ${limit};
  `;

  return result.rows.map((row) => ({
    url: row.url,
    views: Number(row.views) || 0,
  }));
}

export async function getEventCounts(startDate, endDate) {
  await ensureDatabaseInitialized();

  const result = await sql`
    SELECT
      COALESCE(name, '') AS name,
      COUNT(*) AS count
    FROM events
    WHERE type = 'event'
      AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY COALESCE(name, '')
    ORDER BY count DESC;
  `;

  return result.rows.map((row) => ({
    name: row.name,
    count: Number(row.count) || 0,
  }));
}

export async function getApplicationFunnelStats(startDate, endDate) {
  await ensureDatabaseInitialized();

  // Funnel based on events: 'application_started' and 'payment_success'
  const result = await sql`
    WITH session_events AS (
      SELECT
        session_id,
        BOOL_OR(name = 'application_started') AS started,
        BOOL_OR(name = 'payment_success') AS completed
      FROM events
      WHERE type = 'event'
        AND name IN ('application_started', 'payment_success')
        AND created_at BETWEEN ${startDate} AND ${endDate}
        AND session_id IS NOT NULL
      GROUP BY session_id
    )
    SELECT
      COUNT(*) FILTER (WHERE started) AS started,
      COUNT(*) FILTER (WHERE started AND completed) AS completed
    FROM session_events;
  `;

  const row = result.rows[0] || { started: 0, completed: 0 };
  const started = Number(row.started) || 0;
  const completed = Number(row.completed) || 0;
  const conversionRate = started > 0 ? completed / started : 0;

  return {
    started,
    completed,
    conversionRate,
  };
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

// Goals
export async function getAllGoals() {
  await ensureDatabaseInitialized();
  const result = await sql`SELECT * FROM goals ORDER BY name`;
  return result.rows;
}

export async function getActiveGoals() {
  await ensureDatabaseInitialized();
  const result = await sql`SELECT * FROM goals ORDER BY id`;
  return result.rows;
}

export async function getGoalById(id) {
  await ensureDatabaseInitialized();
  const result = await sql`SELECT * FROM goals WHERE id = ${id} LIMIT 1`;
  return result.rows[0] || null;
}

export async function createGoal({ name, type, matchValue, matchType = 'contains' }) {
  await ensureDatabaseInitialized();
  const result = await sql`
    INSERT INTO goals (name, type, match_value, match_type)
    VALUES (${name}, ${type}, ${matchValue}, ${matchType || 'contains'})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function updateGoal(id, { name, type, matchValue, matchType }) {
  await ensureDatabaseInitialized();
  const updates = [];
  if (name !== undefined) updates.push(sql`name = ${name}`);
  if (type !== undefined) updates.push(sql`type = ${type}`);
  if (matchValue !== undefined) updates.push(sql`match_value = ${matchValue}`);
  if (matchType !== undefined) updates.push(sql`match_type = ${matchType}`);
  if (updates.length === 0) return await getGoalById(id);
  const setClause = updates.reduce((prev, u) => (prev ? sql`${prev}, ${u}` : u), null);
  const result = await sql`
    UPDATE goals SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING *;
  `;
  return result.rows[0] || null;
}

export async function deleteGoal(id) {
  await ensureDatabaseInitialized();
  const result = await sql`DELETE FROM goals WHERE id = ${id} RETURNING *`;
  return result.rows[0] || null;
}

// goal_completions has no unique constraint; dedupe by checking if this goal+session already has a completion
export async function ensureGoalCompletionOnce(goalId, sessionId, visitorId) {
  await ensureDatabaseInitialized();
  const existing = await sql`
    SELECT 1 FROM goal_completions
    WHERE goal_id = ${goalId} AND session_id = ${sessionId}
    LIMIT 1
  `;
  if (existing.rows.length > 0) return;
  await sql`
    INSERT INTO goal_completions (goal_id, session_id, visitor_id)
    VALUES (${goalId}, ${sessionId}, ${visitorId})
  `;
}

// Funnels
export async function getAllFunnels() {
  await ensureDatabaseInitialized();
  const result = await sql`SELECT * FROM funnels ORDER BY name`;
  return result.rows;
}

export async function getFunnelById(id) {
  await ensureDatabaseInitialized();
  const result = await sql`SELECT * FROM funnels WHERE id = ${id} LIMIT 1`;
  return result.rows[0] || null;
}

export async function createFunnel({ name, steps }) {
  await ensureDatabaseInitialized();
  const stepsJson = JSON.stringify(steps || []);
  const result = await sql`
    INSERT INTO funnels (name, steps) VALUES (${name}, ${stepsJson}::jsonb) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateFunnel(id, { name, steps }) {
  await ensureDatabaseInitialized();
  if (name !== undefined && steps !== undefined) {
    const stepsJson = JSON.stringify(steps);
    await sql`UPDATE funnels SET name = ${name}, steps = ${stepsJson}::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  } else if (name !== undefined) {
    await sql`UPDATE funnels SET name = ${name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  } else if (steps !== undefined) {
    const stepsJson = JSON.stringify(steps);
    await sql`UPDATE funnels SET steps = ${stepsJson}::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  return await getFunnelById(id);
}

export async function deleteFunnel(id) {
  await ensureDatabaseInitialized();
  const result = await sql`DELETE FROM funnels WHERE id = ${id} RETURNING *`;
  return result.rows[0] || null;
}

// Daily stats aggregation (for cron): one row per (date, traffic_channel, device_type, country)
export async function aggregateDailyStatsForDateSimple(date) {
  await ensureDatabaseInitialized();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  await sql`
    INSERT INTO daily_stats (date, traffic_channel, device_type, country, pageviews, unique_visitors, sessions, bounces, total_duration_seconds)
    SELECT
      ${startOfDay}::DATE,
      COALESCE(traffic_channel, 'other'),
      COALESCE(device_type, 'desktop'),
      COALESCE(country, 'Unknown'),
      COUNT(*) FILTER (WHERE type = 'pageview'),
      COUNT(DISTINCT visitor_id) FILTER (WHERE visitor_id IS NOT NULL),
      0,
      0,
      0
    FROM events
    WHERE created_at BETWEEN ${startOfDay} AND ${endOfDay}
    GROUP BY traffic_channel, device_type, country
    ON CONFLICT (date, traffic_channel, device_type, country) DO UPDATE SET
      pageviews = EXCLUDED.pageviews,
      unique_visitors = EXCLUDED.unique_visitors
  `;

  const sessionStats = await sql`
    SELECT COALESCE(traffic_channel, 'other') AS traffic_channel, COALESCE(device_type, 'desktop') AS device_type, COALESCE(country, 'Unknown') AS country,
      COUNT(*) AS sessions, COUNT(*) FILTER (WHERE bounced = true) AS bounces, COALESCE(SUM(duration_seconds), 0) AS total_duration_seconds
    FROM sessions
    WHERE started_at BETWEEN ${startOfDay} AND ${endOfDay}
    GROUP BY traffic_channel, device_type, country
  `;
  for (const row of sessionStats.rows) {
    await sql`
      UPDATE daily_stats SET sessions = ${row.sessions}, bounces = ${row.bounces}, total_duration_seconds = ${row.total_duration_seconds}
      WHERE date = ${startOfDay}::DATE AND traffic_channel = ${row.traffic_channel} AND device_type = ${row.device_type} AND country = ${row.country}
    `;
  }
}

export async function deleteEventsOlderThan(days = 365) {
  await ensureDatabaseInitialized();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const result = await sql`DELETE FROM events WHERE created_at < ${cutoff}`;
  return result.rowCount ?? 0;
}

