use diesel::prelude::*;
use serde::Serialize;
use crate::schema::{users,tokens,songs,liked_song, playlist, playlist_song};
#[derive(Queryable,Selectable,Insertable)]
#[diesel(table_name=users)]
pub struct User{
    pub id: String,
    pub username: String,
    pub unique_hash: String,
}
#[derive(Queryable,Selectable,Insertable,Associations)]
#[diesel(belongs_to(User))]
#[diesel(table_name=tokens)]
pub struct  Token{
    pub id:String,
    pub user_id:String,
    pub token:String
}

#[derive(Queryable,Selectable,Insertable,Serialize)]
#[diesel(table_name=songs)]
pub struct Song{
    pub id:String,
    pub title:String,
    pub artist:String,
    pub durationms:i32,
    pub thumbnail:String,
    pub video_id:String,
}

#[derive(Queryable,Selectable,Insertable,Associations)]
#[diesel(table_name=liked_song)]
#[diesel(belongs_to(User,foreign_key=liked_by))]
#[diesel(belongs_to(Song,foreign_key=song_id))]
pub struct LikedSong{
    pub id :String,
    pub song_id:String,
    pub liked_by:String
}

#[derive(Queryable,Selectable,Insertable,Associations,Serialize)]
#[diesel(table_name=playlist)]
#[diesel(belongs_to(User,foreign_key=user_id))]
pub struct Playlist{
    pub id:String,
    pub title: String,
    pub user_id: String,
    pub custom_image: bool,
    pub count: i32,
}
#[derive(Queryable,Selectable,Insertable,Associations)]
#[diesel(table_name=playlist_song)]
#[diesel(belongs_to(Playlist,foreign_key=playlist_id))]
#[diesel(belongs_to(Song,foreign_key=song_id))]
pub struct PlaylistSong{
    pub id:String,
    pub playlist_id: String,
    pub song_id: String,
}