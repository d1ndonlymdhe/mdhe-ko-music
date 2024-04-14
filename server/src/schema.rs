// @generated automatically by Diesel CLI.

diesel::table! {
    liked_song (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        song_id -> Varchar,
        #[max_length = 255]
        liked_by -> Varchar,
    }
}

diesel::table! {
    playlist (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        title -> Varchar,
        #[max_length = 255]
        user_id -> Varchar,
        custom_image -> Bool,
        count -> Integer,
    }
}

diesel::table! {
    playlist_song (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        playlist_id -> Varchar,
        #[max_length = 255]
        song_id -> Varchar,
    }
}

diesel::table! {
    songs (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        title -> Varchar,
        #[max_length = 255]
        artist -> Varchar,
        durationms -> Integer,
        #[max_length = 255]
        thumbnail -> Varchar,
        #[max_length = 255]
        video_id -> Varchar,
    }
}

diesel::table! {
    tokens (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        user_id -> Varchar,
        #[max_length = 255]
        token -> Varchar,
    }
}

diesel::table! {
    users (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        username -> Varchar,
        #[max_length = 255]
        unique_hash -> Varchar,
    }
}

diesel::joinable!(liked_song -> songs (song_id));
diesel::joinable!(liked_song -> users (liked_by));
diesel::joinable!(playlist -> users (user_id));
diesel::joinable!(playlist_song -> playlist (playlist_id));
diesel::joinable!(playlist_song -> songs (song_id));
diesel::joinable!(tokens -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    liked_song,
    playlist,
    playlist_song,
    songs,
    tokens,
    users,
);
