#!/usr/bin/env node

/**
 * Database Setup Script for FarmTrak 360
 * This script sets up the Supabase database with all necessary tables and initial data
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in .env file');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupDatabase() {
    console.log('🚀 Starting FarmTrak 360 database setup...');

    try {
        const fs = require('fs');
        const path = require('path');

        const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // For Supabase, we need to use a different approach
        // Since Supabase doesn't expose raw SQL execution via RPC by default,
        // we'll provide instructions for manual setup

        console.log('📋 Schema file loaded successfully');
        console.log('🔧 For Supabase setup, please run the SQL manually in your Supabase dashboard');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of database/schema.sql');
        console.log('4. Run the SQL to create all tables and sample data');
        console.log('');
        console.log('Alternatively, if you have a DATABASE_URL configured,');
        console.log('the script will attempt direct PostgreSQL connection...');

        // Try direct PostgreSQL connection as fallback
        try {
            await setupDatabaseDirect();
        } catch (directError) {
            console.log('⚠️  Direct PostgreSQL connection also failed');
            console.log('Please set up the database manually using the SQL file');
        }

        console.log('🎉 Database setup completed!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Create a user account in Supabase Auth');
        console.log('2. Update the user profile in the user_profiles table');
        console.log('3. Start the backend server with: npm run dev');
        console.log('4. Access the application at http://localhost:3000');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

// Alternative setup using direct SQL execution via PostgreSQL client
async function setupDatabaseDirect() {
    console.log('🚀 Setting up database using direct PostgreSQL connection...');

    const { Client } = require('pg');

    const client = new Client({
        connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database');

        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await client.query(schema);
        console.log('✅ Schema executed successfully');

        await client.end();
        console.log('🎉 Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        if (client) await client.end();
        process.exit(1);
    }
}

// Run the setup
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('🔑 Supabase Service Role Key found - will provide manual setup instructions');
    setupDatabase();
} else {
    console.log('⚠️  No Supabase service role key found, trying direct PostgreSQL connection...');
    setupDatabaseDirect();
}
