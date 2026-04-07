/**
 * Test Event Creation
 * Creates a test event to verify the flow works
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateEvent() {
  console.log('\n🧪 Testing Event Creation...\n');

  // Get first business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, event_count, subscription_status')
    .limit(1)
    .single();

  if (bizError) {
    console.error('❌ No business found:', bizError.message);
    return;
  }

  console.log('Business:', business.name);
  console.log(`Events: ${business.event_count}, Status: ${business.subscription_status}\n`);

  // Get category
  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('name', 'Market')
    .single();

  if (!category) {
    console.error('❌ Category not found');
    return;
  }

  // Create test event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(10, 0, 0, 0);

  const eventData = {
    business_id: business.id,
    category_id: category.id,
    title: "TEST: Sea Point Sunday Market",
    organiser: "Sea Point Traders",
    description: "A test event created via script. Fresh produce, crafts, and coffee with ocean views.",
    venue: "Sea Point Promenade",
    area: "Sea Point, Cape Town",
    address: "Beach Road, Sea Point",
    latitude: -33.9249,
    longitude: 18.3800,
    phone: "+27 21 123 4567",
    whatsapp: null,
    website: "https://seapointmarket.co.za",
    instagram: "@seapointmarket",
    start_time: tomorrow.toISOString(),
    end_time: new Date(tomorrow.getTime() + 5 * 60 * 60 * 1000).toISOString(), // +5 hours
    status: 'published',
    featured: false
  };

  console.log('Creating event:', eventData.title);
  console.log('Date:', new Date(eventData.start_time).toLocaleString('en-ZA'));

  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create event:', error.message);
    return;
  }

  console.log('\n✅ Event created successfully!');
  console.log('ID:', data.id);
  console.log('Title:', data.title);
  console.log('Status:', data.status);

  // Check if event_count was updated
  const { data: updatedBiz } = await supabase
    .from('businesses')
    .select('event_count')
    .eq('id', business.id)
    .single();

  console.log(`\nBusiness event_count: ${business.event_count} → ${updatedBiz.event_count}`);
}

testCreateEvent();
