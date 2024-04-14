-- Your SQL goes here
CREATE TABLE users (
    id  VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    unique_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE tokens (
    id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);