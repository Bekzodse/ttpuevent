-- Replace legacy demo halls with TTPU's 3 official halls and photos.
-- Clean up legacy halls and any orphaned test bookings/blocks referencing them.

ALTER TABLE event_halls ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

DELETE FROM cancellation_requests
WHERE application_id IN (
    SELECT a.id FROM hall_applications a
    JOIN event_halls h ON a.hall_id = h.id
    WHERE h.name NOT IN ('The Annual Conference Hall', 'Green Hall', 'Yellow Hall')
);

DELETE FROM equipment_reservations
WHERE application_id IN (
    SELECT a.id FROM hall_applications a
    JOIN event_halls h ON a.hall_id = h.id
    WHERE h.name NOT IN ('The Annual Conference Hall', 'Green Hall', 'Yellow Hall')
);

DELETE FROM application_history
WHERE application_id IN (
    SELECT a.id FROM hall_applications a
    JOIN event_halls h ON a.hall_id = h.id
    WHERE h.name NOT IN ('The Annual Conference Hall', 'Green Hall', 'Yellow Hall')
);

DELETE FROM hall_schedule_blocks
WHERE hall_id IN (
    SELECT id FROM event_halls
    WHERE name NOT IN ('The Annual Conference Hall', 'Green Hall', 'Yellow Hall')
);

DELETE FROM hall_applications
WHERE hall_id IN (
    SELECT id FROM event_halls
    WHERE name NOT IN ('The Annual Conference Hall', 'Green Hall', 'Yellow Hall')
);

DELETE FROM event_halls
WHERE name NOT IN ('The Annual Conference Hall', 'Green Hall', 'Yellow Hall');

INSERT INTO event_halls (name, building, floor, capacity, hourly_rate, amenities, description, image_url, active)
VALUES
(
    'The Annual Conference Hall',
    'Main Building',
    '1st Floor',
    250,
    70.00,
    'Tiered Blue Auditorium Seating, Podium & Stage, Dual Projectors, Surround Audio, Live Stream Rig',
    'TTPU flagship conference auditorium suited for international conferences, plenary assemblies, graduations, and keynote symposiums.',
    '/halls/annual-conference-hall.jpg',
    TRUE
),
(
    'Green Hall',
    'Academic Building',
    '2nd Floor',
    140,
    45.00,
    'Tiered Green Amphitheater Seating, Wooden Lecturer Desk, Wireless Microphones, HD Projection',
    'Modern amphitheater-style academic hall ideal for engineering lectures, faculty seminars, thesis defenses, and club meetings.',
    '/halls/green-hall.jpg',
    TRUE
),
(
    'Yellow Hall',
    'Academic Building',
    '3rd Floor',
    120,
    40.00,
    'Tiered Acoustic Auditorium, Podium Sound System, Smart Display, High-Speed Wi-Fi',
    'Bright modern lecture and presentation hall tailored for workshops, startup pitch days, guest talks, and student events.',
    '/halls/yellow-hall.jpg',
    TRUE
)
ON CONFLICT (name) DO UPDATE SET
    building = EXCLUDED.building,
    floor = EXCLUDED.floor,
    capacity = EXCLUDED.capacity,
    hourly_rate = EXCLUDED.hourly_rate,
    amenities = EXCLUDED.amenities,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    active = TRUE;

-- Update any legacy hall names inside university_events locations
UPDATE university_events SET location = 'The Annual Conference Hall' WHERE location IN ('Main Assembly Hall', 'IT Park, Building 2');
UPDATE university_events SET location = 'Green Hall' WHERE location IN ('Conference Hall A', 'Palace of Culture');
UPDATE university_events SET location = 'Yellow Hall' WHERE location IN ('Auditorium 101');
