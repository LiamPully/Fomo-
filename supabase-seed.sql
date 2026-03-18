-- Seed data for Fomo Markets
-- Run this after creating the schema

-- Insert sample businesses
INSERT INTO businesses (id, name, email, phone, subscription_status, event_count) VALUES
    ('b1', 'Cape Town Markets Co.', 'paid@demo.com', '+27 21 424 0805', 'active', 2),
    ('b2', 'Joburg Events', 'free@demo.com', '+27 11 838 5678', 'free', 0);

-- Insert sample events
INSERT INTO events (
    id, business_id, category_id, title, description, organiser,
    venue, area, address, latitude, longitude,
    phone, website, instagram,
    start_time, end_time,
    image_url, status, featured
) VALUES
    (
        '1', 'b1', 1, 'Oranjezicht City Farm Market',
        'Cape Town''s favourite weekly market. Fresh local produce, artisan goods, food stalls and a stunning harbour view every Friday and Saturday.',
        'OZCF',
        'V&A Waterfront', 'V&A Waterfront, Cape Town', 'V&A Waterfront\nCape Town',
        -33.9035, 18.4200,
        '+27 21 424 0805', 'ozcfmarket.com', '@ozcfmarket',
        '2026-03-06T09:00:00+02:00', '2026-03-06T14:00:00+02:00',
        'https://picsum.photos/seed/market1/800/500', 'published', true
    ),
    (
        '2', 'b1', 1, 'Neighbourhood Goods Market',
        'The iconic Saturday market at the Old Biscuit Mill. Artisan food, craft goods, flowers and world-class coffee every week.',
        'NGM',
        'The Old Biscuit Mill', 'Woodstock, Cape Town', '375 Albert Rd\nWoodstock, Cape Town',
        -33.9275, 18.4570,
        '+27 21 448 1438', NULL, '@neighbourgoodsmarket',
        '2026-03-07T09:30:00+02:00', '2026-03-07T15:00:00+02:00',
        'https://picsum.photos/seed/market2/800/500', 'published', true
    ),
    (
        '3', 'b1', 1, 'Greenside Morning Farmers Market',
        'A relaxed community market with organic produce, homemade preserves and fresh flowers every Monday morning.',
        'Greenside Market',
        'Greenside', 'Greenside, Johannesburg', 'Greenside\nJohannesburg',
        -26.1500, 28.0000,
        '+27 82 111 2233', NULL, NULL,
        '2026-03-09T07:30:00+02:00', '2026-03-09T12:00:00+02:00',
        'https://picsum.photos/seed/market3/800/500', 'published', false
    ),
    (
        '4', 'b1', 3, 'Durban Street Food Festival',
        'A celebration of Durban''s incredible street food scene. From bunny chow to vetkoek, breyani to grilled corn. Street performers, DJ sets, and family fun.',
        'Durban Events Co',
        'Moses Mabhida Stadium Precinct', 'Stamford Hill, Durban', '44 Isaiah Ntshangase Rd, Durban\nStamford Hill, Durban',
        -29.8290, 31.0300,
        '+27 31 000 5678', NULL, NULL,
        '2026-03-10T11:00:00+02:00', '2026-03-10T20:00:00+02:00',
        'https://picsum.photos/seed/food4/800/500', 'published', true
    ),
    (
        '5', 'b1', 2, 'Cape Town Art Fair Pop-Up',
        'Discover emerging South African artists at this curated pop-up gallery. Over 40 artists showing paintings, photography, sculpture, and digital art.',
        'CT Art Collective',
        'Cape Quarter Lifestyle Village', 'De Waterkant, Cape Town', 'Napier St, De Waterkant\nDe Waterkant, Cape Town',
        -33.9200, 18.4100,
        NULL, NULL, '@ctartcollective',
        '2026-03-11T10:00:00+02:00', '2026-03-11T18:00:00+02:00',
        'https://picsum.photos/seed/art5/800/500', 'published', false
    ),
    (
        '6', 'b1', 3, 'Trail Run: Table Mountain Explorer',
        'Join 300 runners for a breathtaking trail run on the slopes of Table Mountain. Three distance options: 10km, 21km, and 42km.',
        'Trail Run SA',
        'Tafelberg Road Parking', 'Gardens, Cape Town', 'Tafelberg Rd, Table Mountain\nGardens, Cape Town',
        -33.9500, 18.4000,
        '+27 72 999 3344', 'trailrunsa.co.za', NULL,
        '2026-03-12T06:30:00+02:00', '2026-03-12T13:00:00+02:00',
        'https://picsum.photos/seed/trail6/800/500', 'published', false
    ),
    (
        '7', 'b1', 1, 'Pretoria Night Market',
        'Pretoria''s favourite evening market under the stars. Street food, craft beers, live music and artisan goods in the heart of the city.',
        'Tshwane Events',
        'Church Square', 'Pretoria CBD, Pretoria', 'Church Square\nPretoria CBD, Pretoria',
        -25.7470, 28.2200,
        '+27 12 358 4000', NULL, NULL,
        '2026-03-13T17:00:00+02:00', '2026-03-13T22:30:00+02:00',
        'https://picsum.photos/seed/night7/800/500', 'published', false
    ),
    (
        '8', 'b1', 1, 'Maboneng Sunday Market',
        'The iconic Sunday market in Maboneng. Artists, makers, food vendors and musicians come together in Joburg''s most creative neighbourhood.',
        'Maboneng Precinct',
        'Arts on Main', 'Maboneng, Johannesburg', '264 Fox St\nMaboneng, Johannesburg',
        -26.2040, 28.0600,
        '+27 11 447 8194', NULL, NULL,
        '2026-03-14T10:00:00+02:00', '2026-03-14T16:00:00+02:00',
        'https://picsum.photos/seed/maboneng8/800/500', 'published', true
    ),
    (
        '9', 'b1', 4, 'Yoga in the Botanical Gardens',
        'Find your centre among the ferns and fynbos. A 90-minute sunrise yoga session with certified instructor Thandi Mokoena. All levels welcome.',
        'Mindful Cape Town',
        'Kirstenbosch National Botanical Garden', 'Newlands, Cape Town', 'Rhodes Dr, Newlands\nNewlands, Cape Town',
        -33.9900, 18.4300,
        '+27 82 444 7890', NULL, NULL,
        '2026-03-08T06:30:00+02:00', '2026-03-08T08:30:00+02:00',
        'https://picsum.photos/seed/yoga9/800/500', 'published', false
    ),
    (
        '10', 'b1', 3, 'Joburg Craft Beer Festival',
        '80+ craft beers from across SA. Live music all day, food trucks, and a home-brewing competition. 18+ only.',
        'Brew Culture SA',
        'Newtown Junction', 'Newtown, Johannesburg', 'Newtown Junction\nJohannesburg',
        -26.2040, 28.0300,
        '+27 11 838 5678', 'craftbeersa.co.za', NULL,
        '2026-03-14T12:00:00+02:00', '2026-03-14T22:00:00+02:00',
        'https://picsum.photos/seed/beer10/800/500', 'published', true
    ),
    (
        '11', 'b1', 2, 'Cape Town Jazz Festival',
        'Africa''s Grand Jazz Festival returns. Two stages, 40+ artists, world-class performances and the magic of Cape Town at night.',
        'CTIJF',
        'CTICC & Artscape', 'Cape Town CBD', 'Convention Square\nCape Town',
        -33.9200, 18.4200,
        '+27 21 671 0506', 'capetownjazzfest.com', NULL,
        '2026-03-27T17:00:00+02:00', '2026-03-28T00:00:00+02:00',
        'https://picsum.photos/seed/jazz11/800/500', 'published', true
    ),
    (
        '12', 'b1', 2, 'Soweto Wine & Lifestyle Festival',
        'The ultimate celebration of SA wine culture, food and music in the heart of Soweto. Wine tastings, gourmet street food and live performances.',
        'SWF',
        'Ubuntu Kraal Brewery', 'Soweto, Johannesburg', 'Vilakazi St\nOrlando West, Soweto',
        -26.2500, 27.9100,
        '+27 11 936 3116', NULL, '@sowetowinefest',
        '2026-03-28T11:00:00+02:00', '2026-03-28T21:00:00+02:00',
        'https://picsum.photos/seed/wine12/800/500', 'published', true
    );
