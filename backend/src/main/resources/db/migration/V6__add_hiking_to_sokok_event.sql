-- Add Hiking to Sokok event (trilingual UZ/RU/EN) with poster image

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
    'Hiking to Sokok',
    E'🇺🇿 Tog''lar, toza havo, sharshara shovqini va shahar shovqinidan yiroqda unutilmas kun!\n🗓 Yakshanba, 22-noyabr | ⏰ Jo''nash: 06:00 (Alisher Navoi, Panorama) | 🌙 Qaytish: 18:30 | 💰 Narxi: 185,000 UZS\n• Tog'' haykingi va cho''qqilarni zabt etish • Sirli g''or • Go''zal sharshara • Qizil o''rmon • Professional fotograf • Piknik va o''yinlar • Qulay transport\n\n🇷🇺 Представь: горы, свежий воздух, шум водопада и целый день вдали от городской суеты… Поход в Сокок ждёт тебя!\n🗓 Воскресенье, 22 ноября | ⏰ Выезд: 06:00 (Alisher Navoi, Panorama) | 🌙 Возвращение: 18:30 | 💰 Стоимость: 185,000 UZS\n• Горный хайкинг и покорение вершин • Таинственная пещера • Живописный водопад • Красный лес • Профессиональный фотограф • Пикник и игры • Комфортный транспорт\n\n🇬🇧 Mountains, fresh air, waterfall sounds, and a full day away from city rush — Hiking to Sokok awaits!\n🗓 Sunday, November 22 | ⏰ Departure: 06:00 AM (Alisher Navoi, Panorama) | 🌙 Return: 18:30 | 💰 Price: 185,000 UZS\n• Mountain hiking & summit trek • Mysterious cave • Scenic waterfall • Red autumn forest • Professional photographer • Picnic & games • Comfortable transport',
    'Sports',
    DATE '2026-11-22',
    '06:00',
    'Sokok Mountains (Alisher Navoi, Panorama)',
    'JM Events',
    40,
    0,
    'from-orange-500 to-red-500',
    'Upcoming',
    '/events/hiking-to-sokok.jpg',
    TRUE,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM university_events WHERE LOWER(title) = 'hiking to sokok'
);
