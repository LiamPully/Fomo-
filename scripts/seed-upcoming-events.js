/**
 * Seed Upcoming Events Script
 * Adds events with future dates for testing
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

// Generate future dates
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 7);

const nextWeekend = new Date(now);
nextWeekend.setDate(nextWeekend.getDate() + 5);

const nextMonth = new Date(now);
nextMonth.setDate(nextMonth.getDate() + 14);

// Helper to format date for Supabase
const formatDate = (date, hours = 10, minutes = 0) => {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const upcomingEvents = [
  {
    title: "Hout Bay Weekend Market",
    organiser: "Hout Bay Traders",
    description: "Fresh produce, artisan goods, and live music by the bay. Support local vendors and enjoy the ocean views!",
    venue: "Hout Bay Harbour",
    area: "Hout Bay, Cape Town",
    address: "1 Harbour Road, Hout Bay",
    latitude: -34.0358,
    longitude: 18.3476,
    category: "Market",
    start_time: formatDate(tomorrow, 9, 0),
    end_time: formatDate(tomorrow, 14, 0),
    phone: "+27 21 790 1234",
    whatsapp: "+27 72 123 4567",
    website: "https://houtbaymarket.co.za",
    instagram: "@houtbaymarket"
  },
  {
    title: "Cape Town Jazz Festival",
    organiser: "CT Jazz Society",
    description: "A weekend of world-class jazz performances featuring local and international artists. Multiple stages, food stalls, and craft beer.",
    venue: "Green Point Stadium Precinct",
    area: "Green Point, Cape Town",
    address: "14 Fritz Sonnenberg Road",
    latitude: -33.9034,
    longitude: 18.4110,
    category: "Event",
    start_time: formatDate(nextWeekend, 14, 0),
    end_time: formatDate(nextWeekend, 22, 0),
    phone: "+27 21 555 7890",
    whatsapp: null,
    website: "https://capetownjazzfest.co.za",
    instagram: "@ctjazzfest"
  },
  {
    title: "Kirstenbosch Summer Concert",
    organiser: "Kirstenbosch Gardens",
    description: "Sunset concerts in the gardens. Bring your picnic blanket and enjoy live music surrounded by beautiful flora.",
    venue: "Kirstenbosch Botanical Gardens",
    area: "Newlands, Cape Town",
    address: "Rhodes Drive, Newlands",
    latitude: -33.9875,
    longitude: 18.4324,
    category: "Fun",
    start_time: formatDate(nextWeek, 17, 0),
    end_time: formatDate(nextWeek, 20, 0),
    phone: "+27 21 799 8782",
    whatsapp: null,
    website: "https://sanbi.org/gardens/kirstenbosch",
    instagram: "@kirstenbosch",
    featured: true
  },
  {
    title: "Maboneng Night Market",
    organiser: "Maboneng Precinct",
    description: "Evening market with street food, live DJs, art installations, and local fashion. Experience Jozi's creative energy!",
    venue: "Maboneng Precinct",
    area: "Maboneng, Johannesburg",
    address: "264 Fox Street, Jeppestown",
    latitude: -26.2041,
    longitude: 28.0573,
    category: "Market",
    start_time: formatDate(nextWeekend, 17, 0),
    end_time: formatDate(nextWeekend, 23, 0),
    phone: "+27 11 614 9000",
    whatsapp: "+27 83 456 7890",
    website: "https://mabonengprecinct.com",
    instagram: "@mabonengprecinct"
  },
  {
    title: "Durban Beach Front Craft Fair",
    organiser: "Durban Tourism",
    description: "Beachfront craft fair featuring Zulu beadwork, traditional crafts, and local cuisine. Family-friendly with kids' activities.",
    venue: "Suncoast Promenade",
    area: "Durban Beachfront",
    address: "20 Battery Beach Road",
    latitude: -29.8384,
    longitude: 31.0401,
    category: "Market",
    start_time: formatDate(nextWeek, 8, 0),
    end_time: formatDate(nextWeek, 16, 0),
    phone: "+27 31 368 1000",
    whatsapp: null,
    website: "https://durban.co.za/events",
    instagram: "@durban"
  },
  {
    title: "Stellenbosch Wine & Food Festival",
    organiser: "Stellenbosch Wine Routes",
    description: "Wine tastings from 40+ estates, gourmet food pairings, cooking demonstrations, and vineyard tours.",
    venue: "Jan Marais Nature Reserve",
    area: "Stellenbosch",
    address: "Plein Street, Stellenbosch Central",
    latitude: -33.9344,
    longitude: 18.8698,
    category: "Event",
    start_time: formatDate(nextMonth, 11, 0),
    end_time: formatDate(nextMonth, 19, 0),
    phone: "+27 21 883 3826",
    whatsapp: "+27 72 888 9999",
    website: "https://stellenboschwinefestival.co.za",
    instagram: "@stellenboschwine",
    featured: true
  },
  {
    title: "Muizenberg Village Market",
    organiser: "Muizenberg Improvement District",
    description: "Community market with surf culture vibes. Vintage clothing, handmade jewelry, organic veggies, and surfer snacks.",
    venue: "Muizenberg Park",
    area: "Muizenberg, Cape Town",
    address: "Beach Road, Muizenberg",
    latitude: -34.1086,
    longitude: 18.4733,
    category: "Market",
    start_time: formatDate(tomorrow, 9, 0),
    end_time: formatDate(tomorrow, 15, 0),
    phone: "+27 21 788 7381",
    whatsapp: null,
    website: "https://muizenberg.co.za/market",
    instagram: "@muizenbergvillage"
  },
  {
    title: "Braamfontein Art Walk",
    organiser: "Braamfontein Alive",
    description: "Self-guided art walk through galleries, street art, and pop-up exhibitions. Maps available at participating venues.",
    venue: "Various venues in Braamfontein",
    area: "Braamfontein, Johannesburg",
    address: "73 Juta Street",
    latitude: -26.1944,
    longitude: 28.0348,
    category: "Fun",
    start_time: formatDate(nextWeek, 10, 0),
    end_time: formatDate(nextWeek, 17, 0),
    phone: "+27 11 403 0000",
    whatsapp: null,
    website: "https://braamfonteinartwalk.co.za",
    instagram: "@braamfonteinart"
  }
];

async function seedEvents() {
  console.log('\n🌱 Seeding Upcoming Events...\n');

  // Get the first business to use as owner
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .limit(1)
    .single();

  if (bizError) {
    console.error('❌ No business found:', bizError.message);
    console.log('Please create a business first (sign up as a user)');
    return;
  }

  console.log(`Using business ID: ${business.id}\n`);

  // Get category IDs
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name');

  if (catError) {
    console.error('❌ Error fetching categories:', catError.message);
    return;
  }

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  console.log('Categories found:', Object.keys(categoryMap).join(', '), '\n');

  let inserted = 0;
  let failed = 0;

  for (const event of upcomingEvents) {
    const categoryId = categoryMap[event.category] || categoryMap['Other'] || 1;

    const eventData = {
      business_id: business.id,
      category_id: categoryId,
      title: event.title,
      organiser: event.organiser,
      description: event.description,
      venue: event.venue,
      area: event.area,
      address: event.address,
      latitude: event.latitude,
      longitude: event.longitude,
      phone: event.phone,
      whatsapp: event.whatsapp,
      website: event.website,
      instagram: event.instagram,
      start_time: event.start_time,
      end_time: event.end_time,
      status: 'published',
      featured: event.featured || false
    };

    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.log(`❌ Failed: ${event.title} - ${error.message}`);
      failed++;
    } else {
      console.log(`✅ Added: ${event.title}`);
      console.log(`   📍 ${event.area}`);
      console.log(`   📅 ${new Date(event.start_time).toLocaleDateString('en-ZA')}`);
      inserted++;
    }
  }

  console.log(`\n🎉 Done! Inserted ${inserted} events (${failed} failed)\n`);
}

seedEvents();
