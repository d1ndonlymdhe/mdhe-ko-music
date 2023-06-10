-- Your SQL goes here
CREATE TABLE playlist(
    id VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    custom_image BOOLEAN NOT NULL,
    PRIMARY KEY(id) FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE playlist_song(
    id VARCHAR UNIQUE NOT NULL,
    playlist_id VARCHAR NOT NULL,
    song_id VARCHAR NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(playlist_id) REFERENCES playlist(id),
    FOREIGN KEY(song_id) REFERENCES songs(id)
)