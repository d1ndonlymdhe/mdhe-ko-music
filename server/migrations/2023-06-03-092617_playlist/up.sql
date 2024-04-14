-- Your SQL goes here
CREATE TABLE playlist(
    id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    custom_image BOOLEAN NOT NULL,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY(id), FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE playlist_song(
    id VARCHAR(255) UNIQUE NOT NULL,
    playlist_id VARCHAR(255) NOT NULL,
    song_id VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(playlist_id) REFERENCES playlist(id),
    FOREIGN KEY(song_id) REFERENCES songs(id)
)