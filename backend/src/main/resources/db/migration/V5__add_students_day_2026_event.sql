-- Add International Students' Day 2026 event with poster image

INSERT INTO university_events (
    title,
    description,
    category,
    event_date,
    event_time,
    location,
    organizer,
    capacity,
    registered_count,
    gradient,
    status,
    image_url,
    published,
    created_at
)
SELECT
    'International Students'' Day 2026',
    E'🇺🇿 17-noyabr – Xalqaro Talabalar kuni munosabati bilan universitetimizda ajoyib tadbir o''tkazamiz!\n• Eng faol va iste''dodli talabalarni taqdirlash marosimi\n• Bepul choy va qahva\n• Tadbir ikki qismdan iborat: 16:00 – Conference Hall''da taqdirlash marosimi, 18:00 – ochiq havoda gulxan!\n\n🇷🇺 17 ноября, в честь Международного дня студентов, мы проводим в университете яркое мероприятие!\n• Церемония награждения самых активных и талантливых студентов\n• Бесплатные чай и кофе\n• 16:00 – мероприятие в Conference Hall, 18:00 – костёр на открытом воздухе!\n\n🇬🇧 On November 17, for International Students'' Day, we''re hosting a special event at our university!\n• Awards ceremony for the most active and talented students\n• Free tea and coffee & bonfire outdoors\n• 4:00 PM – Event in the Conference Hall, 6:00 PM – Bonfire',
    'Cultural',
    DATE '2026-11-17',
    '16:00',
    'The Annual Conference Hall & Campus Courtyard',
    'Students'' Union',
    250,
    0,
    'from-sky-500 to-blue-600',
    'Upcoming',
    '/events/students-day-2026.jpg',
    TRUE,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM university_events WHERE LOWER(title) LIKE 'international students%day 2026%'
);
