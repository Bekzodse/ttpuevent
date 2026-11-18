-- Store student registration details on campus event registrations

ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS full_name VARCHAR(160);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS email VARCHAR(160);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS department VARCHAR(120);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS student_code VARCHAR(60);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS notes VARCHAR(500);
