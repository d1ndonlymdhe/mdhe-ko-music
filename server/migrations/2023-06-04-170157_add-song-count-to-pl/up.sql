-- Your SQL goes here
DROP TABLE playlist;
CREATE TABLE playlist(
    id VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    custom_image BOOLEAN NOT NULL,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY(id) FOREIGN KEY(user_id) REFERENCES users(id)
);