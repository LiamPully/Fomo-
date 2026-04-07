import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
  console.log('\n📊 Database Event Status\n');

  // Get all events
  const { data: events, error } = await supabase
    .from('events')
    .select('*, category:categories(name, color), business:businesses(name)');

  if (error) {
    console.error('❌ Error fetching events:', error.message);
    return;
  }

  console.log(`Total events in database: ${events.length}\n`);

  if (events.length > 0) {
    console.log('Sample events:');
    events.slice(0, 3).forEach((e, i) => {
      console.log(`\n  ${i + 1}. ${e.title}`);
      console.log(`     Category: ${e.category?.name || 'N/A'}`);
      console.log(`     Status: ${e.status}`);
      console.log(`     Area: ${e.area}`);
      console.log(`     Start: ${e.start_time}`);
      console.log(`     Business: ${e.business?.name || 'N/A'}`);
    });
  } else {
    console.log('⚠️  No events found in database');
    console.log('\nYou may want to seed some test events.');
  }

  // Get counts by status
  const { data: statusCounts } = await supabase
    .from('events')
    .select('status', { count: 'exact' });

  console.log('\n\n📈 Event Counts by Status:');
  const statuses = ['published', 'draft', 'past', 'removed'];
  for (const status of statuses) {
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    console.log(`  ${status}: ${count}`);
  }

  // Get published events that haven't ended
  const now = new Date().toISOString();
  const { data: activeEvents, count: activeCount } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .gte('end_time', now);

  console.log(`\n✅ Active published events (not ended): ${activeCount || 0}`);

  console.log('\n');
}

checkEvents();
