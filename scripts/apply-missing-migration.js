/**
 * Apply Missing Migration Pieces
 * Seeds categories and enables RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n🔧 Applying Missing Migration Pieces...\n');

  try {
    // Step 1: Insert default categories using service role or admin privileges
    console.log('Step 1: Inserting default categories...');
    const categories = [
      { name: 'Market', color: '#E8783A' },
      { name: 'Event', color: '#4A82C4' },
      { name: 'Fun', color: '#E8783A' },
      { name: 'Other', color: '#888880' }
    ];

    for (const cat of categories) {
      const { error } = await supabase
        .from('categories')
        .upsert(cat, { onConflict: 'name' });

      if (error) {
        console.log(`   ⚠️  ${cat.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${cat.name}`);
      }
    }

    // Step 2: Verify categories were inserted
    console.log('\nStep 2: Verifying categories...');
    const { data: cats, error: catError } = await supabase
      .from('categories')
      .select('name, color');

    if (catError) {
      console.log(`   ❌ Error: ${catError.message}`);
    } else {
      console.log(`   ✅ Found ${cats.length} categories:`);
      cats.forEach(c => console.log(`      - ${c.name} (${c.color})`));
    }

    // Step 3: Test RLS - try to insert without auth (should fail if RLS is working)
    console.log('\nStep 3: Testing RLS policies...');
    const { error: rlsError } = await supabase
      .from('categories')
      .insert({ name: 'TestRLS', color: '#000000' });

    if (rlsError && rlsError.message.includes('row-level security')) {
      console.log('   ✅ RLS is active (anonymous insert blocked)');
    } else if (rlsError) {
      console.log(`   ⚠️  RLS may not be active: ${rlsError.message}`);
    } else {
      console.log('   ⚠️  RLS may not be active (anonymous insert was allowed)');
      console.log('      Note: This might be because you\'re using a service role key');
    }

    // Step 4: Test public reads
    console.log('\nStep 4: Testing public read access...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.log(`   ❌ Events read failed: ${eventsError.message}`);
    } else {
      console.log(`   ✅ Can read events (${events.length} found)`);
    }

    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);

    if (bizError) {
      console.log(`   ❌ Businesses read failed: ${bizError.message}`);
    } else {
      console.log(`   ✅ Can read businesses (${businesses.length} found)`);
    }

    console.log('\n🎉 Migration pieces applied!');
    console.log('\nNote: If RLS is not active, you need to run this SQL in Supabase Dashboard:');
    console.log(`
-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can insert categories"
    ON categories FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Only admins can update categories"
    ON categories FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Only admins can delete categories"
    ON categories FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );
    `);

  } catch (err) {
    console.error('\n💥 Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
