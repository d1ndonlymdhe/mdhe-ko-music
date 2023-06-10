-- This file should undo anything in `up.sql`
DROP TABLE songs;
DROP TABLE liked_song;
CREATE TABLE songs (
    id VARCHAR UNIQUE NOT NULL,
    title VARCHAR,
    artist VARCHAR,
    durationms INT,
    thumbnail VARCHAR,
    video_id VARCHAR,
    PRIMARY KEY(id)
);

CREATE TABLE liked_song (
    id VARCHAR UNIQUE NOT NULL,
    song_id VARCHAR,
    liked_by VARCHAR,
    PRIMARY KEY(id),
    FOREIGN KEY(song_id) REFERENCES songs(id),
    FOREIGN KEY(liked_by) REFERENCES users(id)
);