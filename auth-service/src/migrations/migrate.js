/**
 * Database Migration Script
 * Run with: npm run migrate
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to postgres database first (to create docs_portal database)
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres',  // Connect to default postgres database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Step 1: Create database if it doesn't exist
    console.log('📦 Step 1: Creating database...');
    try {
      await adminPool.query('CREATE DATABASE docs_portal');
      console.log('✅ Database docs_portal created');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️  Database docs_portal already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Create user if it doesn't exist
    console.log('\n👤 Step 2: Creating database user...');
    try {
      await adminPool.query(`
        CREATE USER docs_user WITH PASSWORD '${process.env.DB_PASSWORD}'
      `);
      console.log('✅ User docs_user created');
    } catch (error) {
      if (error.code === '42710') {
        console.log('ℹ️  User docs_user already exists');
      } else {
        throw error;
      }
    }

    // Grant privileges
    await adminPool.query('GRANT ALL PRIVILEGES ON DATABASE docs_portal TO docs_user');
    console.log('✅ Privileges granted');

    // Close admin connection
    await adminPool.end();

    // Step 3: Connect to docs_portal database
    console.log('\n🔌 Step 3: Connecting to docs_portal database...');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'docs_portal',
      user: 'postgres',  // Use postgres user for schema creation
      password: process.env.DB_PASSWORD,
    });

    // Step 4: Run schema
    console.log('\n📋 Step 4: Creating database schema...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../../../database/schema.sql'),
      'utf8'
    );

    // Split by statements and execute (skip CREATE DATABASE and \c commands)
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s =>
        s.length > 0 &&
        !s.startsWith('CREATE DATABASE') &&
        !s.startsWith('\\c')
      );

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    console.log('✅ Schema created');

    // Step 5: Create superuser
    console.log('\n👑 Step 5: Creating superuser account...');
    const superuserEmail = process.env.SUPERUSER_EMAIL || 'admin@docs.local';
    const superuserPassword = process.env.SUPERUSER_PASSWORD || 'changeme123';
    const superuserName = process.env.SUPERUSER_NAME || 'Super Admin';

    const passwordHash = await bcrypt.hash(superuserPassword, 10);

    await pool.query(`
      INSERT INTO docs_users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, 'superuser', true)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = $2, full_name = $3, updated_at = NOW()
    `, [superuserEmail, passwordHash, superuserName]);

    console.log('✅ Superuser created');
    console.log(`   Email: ${superuserEmail}`);
    console.log(`   Password: ${superuserPassword}`);
    console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');

    // Step 6: Grant permissions to docs_user
    console.log('\n🔐 Step 6: Granting permissions...');
    await pool.query('GRANT USAGE ON SCHEMA public TO docs_user');
    await pool.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO docs_user');
    await pool.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO docs_user');
    console.log('✅ Permissions granted');

    // Verify
    console.log('\n✅ Step 7: Verifying...');
    const result = await pool.query('SELECT COUNT(*) FROM docs_users');
    console.log(`   Users in database: ${result.rows[0].count}`);

    await pool.end();

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Update .env with production credentials');
    console.log('2. Start the auth service: npm start');
    console.log('3. Test login with superuser credentials\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
