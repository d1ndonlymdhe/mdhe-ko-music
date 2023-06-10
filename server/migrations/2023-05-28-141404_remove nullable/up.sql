
-- Your SQL goes here
DROP TABLE songs;
DROP TABLE liked_song;

CREATE TABLE songs (
    id VARCHAR UNIQUE NOT NULL,
    title VARCHAR NOT NULL,
    artist VARCHAR NOT NULL,
    durationms INT NOT NULL,
    thumbnail VARCHAR NOT NULL,
    -- TODO Make this unique
    video_id VARCHAR NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE liked_song (
    id VARCHAR UNIQUE NOT NULL,
    song_id VARCHAR NOT NULL,
    liked_by VARCHAR NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(song_id) REFERENCES songs(id),
    FOREIGN KEY(liked_by) REFERENCES users(id)
);