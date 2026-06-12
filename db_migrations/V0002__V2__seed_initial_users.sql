
INSERT INTO avng_users (login, password, name, tab_number, role, rank, join_date, is_super_admin)
SELECT 'chief', 'admin123', 'Романов Александр Игоревич', '000-001', 'chief', 'sergeant', '2026-01-01', FALSE
WHERE NOT EXISTS (SELECT 1 FROM avng_users WHERE login = 'chief');

INSERT INTO avng_users (login, password, name, tab_number, role, rank, join_date, is_super_admin)
SELECT '686702', '686702', 'Андрейченко Иван', '686-702', 'deputy', 'sergeant', '2026-06-12', TRUE
WHERE NOT EXISTS (SELECT 1 FROM avng_users WHERE login = '686702');

INSERT INTO avng_users (login, password, name, tab_number, role, rank, join_date, is_super_admin)
SELECT 'instr1', 'instr123', 'Кузнецов Павел Андреевич', '000-010', 'instructor', 'jr_sergeant', '2026-02-10', FALSE
WHERE NOT EXISTS (SELECT 1 FROM avng_users WHERE login = 'instr1');

INSERT INTO avng_users (login, password, name, tab_number, role, rank, join_date, is_super_admin)
SELECT 'ivanov', 'pass1234', 'Иванов Дмитрий Сергеевич', '000-100', 'cadet', 'private', '2026-03-15', FALSE
WHERE NOT EXISTS (SELECT 1 FROM avng_users WHERE login = 'ivanov');

INSERT INTO avng_users (login, password, name, tab_number, role, rank, join_date, is_super_admin)
SELECT 'petrov', 'pass5678', 'Петров Андрей Викторович', '000-101', 'cadet', 'private', '2026-03-15', FALSE
WHERE NOT EXISTS (SELECT 1 FROM avng_users WHERE login = 'petrov');
