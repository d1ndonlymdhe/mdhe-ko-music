// @generated automatically by Diesel CLI.

diesel::table! {
    liked_song (id) {
        id -> Text,
        song_id -> Text,
        liked_by -> Text,
    }
}

diesel::table! {
    playlist (id) {
        id -> Text,
        title -> Text,
        user_id -> Text,
        custom_image -> Bool,
        count -> Integer,
    }
}

diesel::table! {
    playlist_song (id) {
        id -> Text,
        playlist_id -> Text,
        song_id -> Text,
    }
}

diesel::table! {
    songs (id) {
        id -> Text,
        title -> Text,
        artist -> Text,
        durationms -> Integer,
        thumbnail -> Text,
        video_id -> Text,
    }
}

diesel::table! {
    tokens (id) {
        id -> Text,
        user_id -> Text,
        token -> Text,
    }
}

diesel::table! {
    users (id) {
        id -> Text,
        username -> Text,
        unique_hash -> Text,
    }
}

diesel::joinable!(liked_song -> songs (song_id));
diesel::joinable!(liked_song -> users (liked_by));
diesel::joinable!(playlist -> users (user_id));
diesel::joinable!(playlist_song -> playlist (playlist_id));
diesel::joinable!(playlist_song -> songs (song_id));

diesel::allow_tables_to_appear_in_same_query!(
    liked_song,
    playlist,
    playlist_song,
    songs,
    tokens,
    users,
);
