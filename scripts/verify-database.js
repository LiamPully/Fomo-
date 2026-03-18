/**
 * Database Verification Script
 *
 * Run this after applying the migration to verify everything is set up correctly:
 * node scripts/verify-database.js
 *
 * Requires: npm install @supabase/supabase-js dotenv
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checks = {
  passed: 0,
  failed: 0,
  errors: []
};

async function check(name, testFn) {
  try {
    await testFn();
    console.log(`✅ ${name}`);
    checks.passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    checks.failed++;
    checks.errors.push({ name, error: error.message });
  }
}

async function runVerification() {
  console.log('\n🔍 Verifying Database Setup...\n');
  console.log(`URL: ${supabaseUrl}`);
  console.log('');

  // Check 1: Tables exist
  await check('Categories table exists', async () => {
    const { error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error) throw error;
  });

  await check('Businesses table exists', async () => {
    const { error } = await supabase.from('businesses').select('count', { count: 'exact', head: true });
    if (error) throw error;
  });

  await check('Events table exists', async () => {
    const { error } = await supabase.from('events').select('count', { count: 'exact', head: true });
    if (error) throw error;
  });

  // Check 2: Default categories exist
  await check('Default categories seeded', async () => {
    const { data, error } = await supabase.from('categories').select('name');
    if (error) throw error;
    const expected = ['Market', 'Event', 'Fun', 'Other'];
    const found = data.map(c => c.name);
    const missing = expected.filter(e => !found.includes(e));
    if (missing.length > 0) throw new Error(`Missing categories: ${missing.join(', ')}`);
  });

  // Check 3: RLS is enabled (try to insert without auth - should fail)
  await check('RLS policies active (anonymous insert blocked)', async () => {
    const { error } = await supabase.from('categories').insert({ name: 'Test', color: '#000000' });
    // We expect this to fail with RLS error
    if (!error || !error.message.includes('new row violates row-level security policy')) {
      throw new Error('RLS may not be enabled - anonymous insert was allowed');
    }
  });

  // Check 4: RPC function exists
  await check('increment_event_view RPC function exists', async () => {
    const { error } = await supabase.rpc('increment_event_view', { event_id: '00000000-0000-0000-0000-000000000000' });
    // We expect this to fail with "not found" not "function does not exist"
    if (error && error.message.includes('function does not exist')) {
      throw new Error('RPC function not found');
    }
  });

  // Check 5: Can read published events (public access)
  await check('Public can read published events', async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .limit(1);
    if (error) throw error;
  });

  // Check 6: Can read categories (public access)
  await check('Public can read categories', async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No categories found');
  });

  // Check 7: Can read businesses (public access)
  await check('Public can read businesses', async () => {
    const { data, error } = await supabase.from('businesses').select('*').limit(1);
    if (error) throw error;
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log('='.repeat(50));

  if (checks.failed === 0) {
    console.log('\n🎉 All checks passed! Database is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some checks failed. Review the errors above.');
    console.log('\nCommon fixes:');
    console.log('- Make sure you ran supabase-migration.sql');
    console.log('- Verify your Supabase URL and API key');
    console.log('- Check that RLS policies are enabled');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('\n💥 Verification failed with error:', err.message);
  process.exit(1);
});
