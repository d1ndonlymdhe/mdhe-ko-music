-- This file should undo anything in `up.sql`
DROP TABLE playlist;

CREATE TABLE playlist(
    id VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    custom_image BOOLEAN NOT NULL,
    PRIMARY KEY(id) FOREIGN KEY(user_id) REFERENCES users(id)
);