import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Run: export DATABASE_URL="your-connection-string"');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...\n');

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('animation', 'design', 'architecture')),
        title JSONB NOT NULL DEFAULT '{}',
        description JSONB DEFAULT '{}',
        content JSONB DEFAULT '{}',
        thumbnail TEXT,
        media JSONB DEFAULT '[]',
        tools TEXT[] DEFAULT '{}',
        client TEXT,
        year INTEGER,
        featured BOOLEAN DEFAULT false,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Projects table created');

    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        title JSONB NOT NULL DEFAULT '{}',
        excerpt JSONB DEFAULT '{}',
        content JSONB NOT NULL DEFAULT '{}',
        category TEXT CHECK (category IN ('animation', 'design', 'architecture', 'tutorial', 'news')),
        thumbnail TEXT,
        published BOOLEAN DEFAULT true,
        author TEXT DEFAULT 'Feven Zerabruk',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Blog posts table created');

    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Contacts table created');

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Settings table created');

    console.log('\n📊 Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order_index)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at)`;
    console.log('✅ Indexes created');

    console.log('\n🎉 Database setup complete! All tables and indexes are ready.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

setupDatabase();