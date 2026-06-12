
CREATE TABLE avng_users (
    id             SERIAL PRIMARY KEY,
    login          VARCHAR(64) UNIQUE NOT NULL,
    password       VARCHAR(128) NOT NULL,
    name           VARCHAR(256) NOT NULL,
    tab_number     VARCHAR(32) NOT NULL,
    role           VARCHAR(32) NOT NULL DEFAULT 'cadet',
    rank           VARCHAR(32) NOT NULL DEFAULT 'private',
    join_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE avng_lecture_progress (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES avng_users(id),
    lecture_id   VARCHAR(8) NOT NULL,
    done         BOOLEAN NOT NULL DEFAULT FALSE,
    confirm_link TEXT,
    confirmed_by VARCHAR(256),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, lecture_id)
);

CREATE TABLE avng_practice_progress (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES avng_users(id),
    practice_id  VARCHAR(8) NOT NULL,
    done         BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url    TEXT,
    confirmed_by VARCHAR(256),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, practice_id)
);

CREATE TABLE avng_reports (
    id                  SERIAL PRIMARY KEY,
    author_id           INTEGER NOT NULL REFERENCES avng_users(id),
    direction           VARCHAR(128) NOT NULL,
    status              VARCHAR(32) NOT NULL DEFAULT 'pending',
    signature           VARCHAR(256),
    photo_url           TEXT,
    lectures_snapshot   JSONB,
    practices_snapshot  JSONB,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE avng_exam_requests (
    id           SERIAL PRIMARY KEY,
    author_id    INTEGER NOT NULL REFERENCES avng_users(id),
    exam_title   VARCHAR(256) NOT NULL,
    rank         VARCHAR(32) NOT NULL,
    status       VARCHAR(32) NOT NULL DEFAULT 'pending',
    answer       TEXT,
    answered_by  VARCHAR(256),
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE avng_blacklist (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(256) NOT NULL,
    tab_number  VARCHAR(32),
    reason      TEXT NOT NULL,
    added_by    VARCHAR(256) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
