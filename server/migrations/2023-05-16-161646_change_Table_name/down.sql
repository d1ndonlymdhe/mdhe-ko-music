-- This file should undo anything in `up.sql`-- Your SQL goes here
CREATE TABLE USERS (
    id  VARCHAR UNIQUE NOT NULL,
    username VARCHAR NOT NULL,
    unique_hash VARCHAR NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE TOKENS (
    id VARCHAR UNIQUE NOT NULL,
    user_id VARCHAR NOT NULL,
    token VARCHAR NOT NULL,
    PRIMARY KEY(id)
    FOREIGN KEY(user_id) REFERENCES USERS(id)
);