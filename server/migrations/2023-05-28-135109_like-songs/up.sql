-- Your SQL goes here

CREATE TABLE songs (
    id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    durationms INT NOT NULL,
    thumbnail VARCHAR(255) NOT NULL,
    video_id VARCHAR(255) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE liked_song (
    id VARCHAR(255) UNIQUE NOT NULL,
    song_id VARCHAR(255) NOT NULL,
    liked_by VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(song_id) REFERENCES songs(id),
    FOREIGN KEY(liked_by) REFERENCES users(id)
);