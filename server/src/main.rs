use actix_cors::Cors;
// use actix_multipart::{form, Field, Multipart};
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
// use futures_util::{StreamExt as _S, TryStreamExt as _};
// use mime::Mime;
use models::{LikedSong, Playlist};
use rusty_ytdl::{search::SearchResult, *};
use schema::liked_song::liked_by;
use serde::{Deserialize, Serialize};
use server::established_connection;
use sha256::digest;
// use std::fs::File;
// use std::io::prelude::*;
// use std::path::Path;
use std::time::SystemTime;
use uuid::Uuid;
pub mod models;
pub mod schema;

pub(crate) use diesel::prelude::*;

use self::schema::tokens::dsl::*;
use self::schema::users::dsl::*;

use crate::{
    models::{Song, Token, User},
    schema::tokens,
    schema::users,
};

#[derive(Serialize)]
struct ReturnMsg<T> {
    success: bool,
    msg: T,
}

#[derive(Deserialize)]
struct CookieTest {
    token: Option<String>,
}

#[post("/check_cookie")]
async fn check_cookie(payload: web::Json<CookieTest>) -> impl Responder {
    let new_token = &payload.token;
    match new_token {
        Some(t) => {
            let res = verify_cookie(t);
            match res {
                Ok(_) => {
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: true,
                        msg: String::from("Ok"),
                    });
                }
                Err(e) => match e {
                    TokenError::QueryError => {
                        return HttpResponse::Ok().json(ReturnMsg {
                            success: false,
                            msg: String::from("Server Error"),
                        })
                    }
                    TokenError::Invalid => {
                        return HttpResponse::Ok().json(ReturnMsg {
                            success: false,
                            msg: String::from("Invalid Token"),
                        })
                    }
                },
            }
        }
        None => {
            return HttpResponse::Ok().json(ReturnMsg {
                success: false,
                msg: String::from("No token"),
            });
        }
    }
}

enum TokenError {
    Invalid,
    QueryError,
}
enum TokenSuccess {
    UserId(String),
}

fn verify_cookie(t: &str) -> Result<TokenSuccess, TokenError> {
    let connection = &mut established_connection();
    let res: Result<Vec<Token>, _> = tokens
        .filter(token.eq(t))
        .limit(1)
        .load::<Token>(connection);
    match res {
        Ok(rows) => {
            if rows.len() == 1 {
                return Ok(TokenSuccess::UserId(String::from(&(rows[0].user_id))));
            } else {
                return Err(TokenError::Invalid);
            }
        }
        Err(_) => return Err(TokenError::QueryError),
    }
}

#[get("/")]
async fn test() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

#[derive(Deserialize)]
struct LoginInfo {
    username: String,
    password: String,
}

#[post("/login")]
async fn login(info: web::Json<LoginInfo>) -> impl Responder {
    let new_username = &info.username;
    let new_password = &info.password;
    println!("Ok");
    let hash = digest(String::from(new_password));
    let connection = &mut established_connection();
    let res: Result<Vec<User>, _> = users
        .filter(username.eq(new_username))
        .limit(1)
        .load::<User>(connection);
    match res {
        Ok(rows) => {
            if rows.len() == 1 {
                println!("{} {}", hash, rows[0].unique_hash);
                if rows[0].unique_hash == hash {
                    let t = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH);
                    match t {
                        Ok(time) => {
                            let s = time.as_millis();
                            let token_value = digest(String::from(new_username) + &(s.to_string()));
                            let res = diesel::insert_into(tokens)
                                .values(Token {
                                    id: Uuid::new_v4().to_string(),
                                    token: String::from(&token_value),
                                    user_id: String::from(&rows[0].id),
                                })
                                .execute(connection);
                            match res {
                                Ok(_) => {
                                    println!("{}", token_value);
                                    return HttpResponse::Ok()
                                        .insert_header((
                                            "Set-Cookie",
                                            "token=abcdefgh; Domain=http://localhost:8000",
                                        ))
                                        .json(ReturnMsg {
                                            success: true,
                                            msg: String::from(&token_value),
                                        });
                                }
                                Err(_) => {
                                    return HttpResponse::Ok().json(ReturnMsg {
                                        success: false,
                                        msg: String::from("Could not create token "),
                                    })
                                }
                            }
                        }
                        Err(_) => {
                            return HttpResponse::Ok().json(ReturnMsg {
                                success: false,
                                msg: String::from("Internal Error"),
                            });
                        }
                    }
                } else {
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: false,
                        msg: String::from("Wrong password"),
                    });
                }
            } else {
                return HttpResponse::Ok().json(ReturnMsg {
                    success: false,
                    msg: String::from("No user found"),
                });
            }
        }
        Err(_) => {
            return HttpResponse::Ok().json(ReturnMsg {
                success: false,
                msg: String::from("Could not read from db"),
            })
        }
    }
}

#[derive(Insertable)]
#[diesel(table_name = tokens)]
pub struct TokenInsert {
    pub id: String,
    pub user_id: String,
    pub token: String,
}

#[derive(Insertable)]
#[diesel(table_name = users)]
struct UserInsert {
    id: String,
    username: String,
    unique_hash: String,
}

#[post("/signup")]
async fn signup(info: web::Json<LoginInfo>) -> impl Responder {
    let connection = &mut established_connection();
    let uid = Uuid::new_v4().to_string();
    let new_username = &info.username;
    let new_password = &info.password;
    let hash = digest(String::from(new_password));
    let res: Result<Vec<User>, _> = users
        .filter(username.eq(new_username))
        .limit(1)
        .load::<User>(connection);
    match res {
        Ok(rows) => {
            if rows.len() == 0 {
                let new_user = UserInsert {
                    id: uid,
                    username: String::from(new_username),
                    unique_hash: hash,
                };
                let res = diesel::insert_into(users)
                    .values(new_user)
                    .execute(connection);
                match res {
                    Ok(_) => {
                        return HttpResponse::Ok().json(ReturnMsg {
                            success: true,
                            msg: String::from("User created"),
                        })
                    }
                    Err(_) => {
                        return HttpResponse::Ok().json(ReturnMsg {
                            success: false,
                            msg: String::from("Error writing to db"),
                        })
                    }
                }
            } else {
                return HttpResponse::Ok().json(ReturnMsg {
                    success: false,
                    msg: String::from("User already exists"),
                });
            }
        }

        Err(_) => {
            return HttpResponse::Ok().json(ReturnMsg {
                success: false,
                msg: String::from("Error reading from db"),
            });
        }
    };
}

#[derive(Deserialize)]
struct SearchQuery {
    title: String,
    token: Option<String>,
}

#[derive(Serialize)]
struct SearchResultItem {
    id: String,
    title: String,
    channel: String,
    channel_id: String,
    video_id: String,
    thumbnail_url: String,
    duration_ms: u64,
    is_liked: bool,
}
#[derive(Serialize)]
struct SearchResultRes {
    success: bool,
    items: Vec<SearchResultItem>,
    msg: String,
}

#[get("/search")]
async fn search_vids(payload: web::Query<SearchQuery>) -> impl Responder {
    // use crate::schema::songs::dsl::songs;
    let title = &payload.title;
    let yt = search::YouTube::new();
    let user_token = &payload.token;
    let mut success = false;
    let mut msg = "Internal Server Error".to_string();
    let mut ret_results: Vec<SearchResultItem> = Vec::new();
    // let connection = &mut established_connection();
    match yt {
        Ok(youtube) => {
            let res = youtube.search(title, None).await;
            let mut v_token: Result<TokenSuccess, TokenError> = Err(TokenError::Invalid);
            if let Some(t) = user_token {
                println!("{}", t);
                v_token = verify_cookie(t);
            }

            match res {
                Ok(results) => {
                    for r in &(results)[..(if results.len() > 10 {
                        10
                    } else {
                        results.len()
                    })] {
                        match r {
                            SearchResult::Video(v) => {
                                let title = &(*v.title);
                                let channel = &(*v.channel.name);
                                let channel_id = &(*v.channel.id);
                                let video_id = &(*v.id);
                                let thumbnail_url = &(*v.thumbnails[0].url);
                                let duration_ms = v.duration;
                                let new_id = add_song_to_db((
                                    title,
                                    channel,
                                    video_id,
                                    thumbnail_url,
                                    duration_ms as i32,
                                ));

                                ret_results.push(SearchResultItem {
                                    id: String::from(&new_id),
                                    title: String::from(title),
                                    channel: String::from(channel),
                                    channel_id: String::from(channel_id),
                                    video_id: String::from(video_id),
                                    thumbnail_url: String::from(thumbnail_url),
                                    is_liked: match &v_token {
                                        Ok(t) => match t {
                                            TokenSuccess::UserId(uid) => {
                                                match check_liked(&uid, &new_id) {
                                                    LikeCheckResult::Liked(_) => true,
                                                    _ => false,
                                                }
                                            }
                                        },
                                        Err(_) => false,
                                    },
                                    duration_ms: duration_ms,
                                });
                                success = true;
                                msg = "ok".to_string();
                            }
                            _ => {
                                success = false;
                                msg = "Internal Server Error".to_string();
                            }
                        }
                    }
                }
                Err(_) => {
                    success = false;
                    msg = "Internal Server Error".to_string();
                }
            }
        }
        Err(_) => {
            success = false;
            msg = "Internal Server Error".to_string();
        }
    }
    return HttpResponse::Ok().json(SearchResultRes {
        msg,
        success,
        items: ret_results,
    });
}

fn add_song_to_db(info: (&str, &str, &str, &str, i32)) -> String {
    use crate::schema::songs::dsl::songs;
    use crate::schema::songs::*;
    // use crate::models::Song;
    let (s_title, s_artist, s_video_id, s_thumbnail, s_durationms) = info;
    let conn = &mut established_connection();
    let exists: Result<Vec<Song>, _> = songs
        .filter(video_id.eq(s_video_id))
        .limit(1)
        .load::<Song>(conn);
    if let Ok(s) = exists {
        if s.len() == 1 {
            return s[0].id.clone();
        }
    }
    let new_id = Uuid::new_v4().to_string();
    let _ = diesel::insert_into(songs)
        .values(Song {
            artist: String::from(s_artist),
            durationms: s_durationms,
            id: String::from(&new_id),
            thumbnail: String::from(s_thumbnail),
            title: String::from(s_title),
            video_id: String::from(s_video_id),
        })
        .execute(conn);
    return String::from(&new_id);
}

#[derive(Deserialize)]
struct PlayQuery {
    id: String,
}

#[derive(Serialize)]
struct PlayMsg {
    url: String,
    next_id: String,
}

#[get("/play")]
async fn play_song(payload: web::Query<PlayQuery>) -> impl Responder {
    let vid_id = &payload.id;
    let yt = rusty_ytdl::Video::new_with_options(
        vid_id,
        VideoOptions {
            quality: VideoQuality::HighestAudio,
            filter: VideoSearchOptions::Audio,
            ..Default::default()
        },
    );
    // let x = yt.get_video_url();
    //recompile
    match yt {
        Ok(v) => {
            // let url = v.get_video_url();
            let url = v.get_info().await;
            match url {
                Ok(info) => {
                    let fmts = info.formats;

                    for f in fmts {
                        let q = f.audio_quality.unwrap_or("None".to_string());
                        let c = f.mime_type.audio_codec.unwrap_or("None".to_string());
                        if q != "None" && c != "None" {
                            if q == "AUDIO_QUALITY_LOW" && c == "opus" {
                                let u = f.url;
                                return HttpResponse::Ok().json(ReturnMsg {
                                    success: true,
                                    msg: PlayMsg {
                                        url: u,
                                        next_id: String::from(&info.related_videos[0].id),
                                    },
                                });
                            }
                        }
                    }
                }
                Err(_) => {
                    println!("Empty")
                }
            }
            return HttpResponse::Ok().json(ReturnMsg {
                success: false,
                msg: "Not Found".to_string(),
            });
        }
        Err(_) => {
            return HttpResponse::Ok().json(ReturnMsg {
                success: false,
                msg: "Invalid request".to_string(),
            });
        }
    }
    // return HttpResponse::Ok();
}

#[derive(Deserialize, Serialize)]
struct LikeRequest {
    song_id: String,
    action: bool,
    token: String,
}

// #[derive()]
#[derive(Serialize)]
struct LikeResMsg {
    action: bool,
    song_id: String,
}
#[derive(Serialize)]
struct LikeResponse {
    success: bool,
    msg: LikeResMsg,
}

#[post("/like")]
async fn like_song(payload: web::Json<LikeRequest>) -> impl Responder {
    use crate::schema::liked_song::dsl::liked_song;
    // use crate::schema::liked_song::user_id;s
    use crate::models::LikedSong;
    use crate::schema::liked_song::*;

    let user_song_id = String::from(&payload.song_id);
    let action = payload.action;
    let user_token = String::from(&payload.token);
    let tv = verify_cookie(&user_token);
    let connection = &mut established_connection();
    let req = LikeResMsg {
        action: payload.action,
        song_id: payload.song_id.clone(),
    };
    if let Ok(t) = tv {
        match t {
            TokenSuccess::UserId(uid) => {
                match check_liked(&uid, &user_song_id) {
                    LikeCheckResult::Liked(ls_id) => {
                        if action {
                            return HttpResponse::Ok().json(LikeResponse {
                                success: false,
                                msg: req,
                            });
                        } else {
                            // let song = songs.
                            println!("{}", ls_id);
                            let ds = diesel::delete(liked_song)
                                .filter(id.eq(ls_id))
                                .execute(connection);
                            if let Ok(s) = ds {
                                println!("{}", s);
                                return HttpResponse::Ok().json(LikeResponse {
                                    success: true,
                                    msg: req,
                                });
                            } else {
                                return HttpResponse::Ok().json(LikeResponse {
                                    success: false,
                                    msg: req,
                                });
                            }
                        }
                    }
                    LikeCheckResult::Unliked => {
                        if action {
                            let sv = diesel::insert_into(liked_song)
                                .values(LikedSong {
                                    id: Uuid::new_v4().to_string(),
                                    liked_by: uid.clone(),
                                    song_id: user_song_id.clone(),
                                })
                                .execute(connection);
                            if let Ok(_) = sv {
                                return HttpResponse::Ok().json(LikeResponse {
                                    success: true,
                                    msg: req,
                                });
                            } else {
                                return HttpResponse::Ok().json(LikeResponse {
                                    success: true,
                                    msg: req,
                                });
                            }
                        } else {
                            return HttpResponse::Ok().json(LikeResponse {
                                success: false,
                                msg: req,
                            });
                        }
                    }
                    LikeCheckResult::Error => {
                        return HttpResponse::Ok().json(LikeResponse {
                            success: false,
                            msg: req,
                        })
                    }
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: String::from("Invalid Token"),
    });
}

#[derive(Deserialize)]
struct IsLikedReq {
    song_id: String,
    token: String,
}
#[derive(Serialize)]
struct IsLikedRes {
    is_liked: bool,
    song_id: String,
}

enum LikeCheckResult {
    Liked(String),
    Unliked,
    Error,
}

fn check_liked(uid: &str, p_song_id: &str) -> LikeCheckResult {
    use crate::schema::liked_song::dsl::liked_song;
    use crate::schema::liked_song::song_id;
    let conn = &mut established_connection();
    println!("{} {}", p_song_id, uid);
    let liked_exists: Result<Vec<LikedSong>, _> = liked_song
        .filter(song_id.eq(p_song_id).and(liked_by.eq(uid)))
        .limit(1)
        .load::<LikedSong>(conn);
    if let Ok(l) = liked_exists {
        if l.len() == 1 {
            println!("Liked");
            return LikeCheckResult::Liked(l[0].id.clone());
        } else {
            println!("unliked");
            return LikeCheckResult::Unliked;
        }
    }
    return LikeCheckResult::Error;
}

#[post("/is_liked")]
async fn is_liked(payload: web::Json<IsLikedReq>) -> impl Responder {
    let user_song_id = &payload.song_id;
    let user_token = &payload.token;
    let c_res = verify_cookie(user_token);
    if let Ok(t) = c_res {
        match t {
            TokenSuccess::UserId(uid) => match check_liked(&uid, user_song_id) {
                LikeCheckResult::Liked(_) => {
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: true,
                        msg: IsLikedRes {
                            is_liked: true,
                            song_id: payload.song_id.clone(),
                        },
                    });
                }
                LikeCheckResult::Unliked => {
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: true,
                        msg: IsLikedRes {
                            is_liked: false,
                            song_id: payload.song_id.clone(),
                        },
                    });
                }
                LikeCheckResult::Error => {
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: false,
                        msg: "Query Error",
                    });
                }
            },
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "Token Error",
    });
}

#[derive(Deserialize)]
struct SongInfoReq {
    song_id: String,
    token: String,
}

#[derive(Serialize)]
struct SongInfoMsg {
    info: SearchResultItem,
    next_id: String,
    url: String,
}

#[post("get_song_info")]
async fn get_info(payload: web::Json<SongInfoReq>) -> impl Responder {
    let user_song_id = &payload.song_id;
    let user_token = &payload.token;
    let vt = verify_cookie(&user_token);
    if let Ok(t) = vt {
        match t {
            TokenSuccess::UserId(uid) => {
                let yt = rusty_ytdl::Video::new_with_options(
                    user_song_id,
                    VideoOptions {
                        quality: VideoQuality::HighestAudio,
                        filter: VideoSearchOptions::Audio,
                        ..Default::default()
                    },
                );
                if let Ok(v) = yt {
                    let info = v.get_info().await;
                    if let Ok(i) = info {
                        let details = i.video_details;
                        let title = details.title;
                        let channel = details.author.clone().unwrap().name;
                        let channel_id = details.author.unwrap().id;
                        let thumbnail = &details.thumbnails[0].url;
                        let video_id = details.video_id;
                        let durationms = details.length_seconds.parse().unwrap_or(0) * 1000;
                        let song_is_liked = match check_liked(&uid, &video_id) {
                            LikeCheckResult::Liked(_) => true,
                            LikeCheckResult::Error => false,
                            LikeCheckResult::Unliked => false,
                        };
                        let fmts = i.formats;
                        let mut song_url = String::new();
                        println!("related to {}", title);
                        println!("-------------");
                        for r in &i.related_videos {
                            println!("{}", r.title);
                        }
                        println!("------------");
                        for f in fmts {
                            let quality = f.audio_quality.unwrap_or("None".to_string());
                            let codec = f.mime_type.audio_codec.unwrap_or("None".to_string());
                            if quality != "None" && codec != "None" {
                                if quality == "AUDIO_QUALITY_LOW" && codec == "opus" {
                                    song_url = String::from(&f.url);
                                }
                            }
                        }
                        let new_id = add_song_to_db((
                            title.as_str(),
                            channel.as_str(),
                            video_id.as_str(),
                            thumbnail.as_str(),
                            durationms,
                        ));
                        return HttpResponse::Ok().json({
                            ReturnMsg {
                                success: true,
                                msg: SongInfoMsg {
                                    info: SearchResultItem {
                                        id: new_id.clone(),
                                        title: title.clone(),
                                        channel: channel.clone(),
                                        channel_id: channel_id.clone(),
                                        video_id: video_id.clone(),
                                        thumbnail_url: thumbnail.clone(),
                                        duration_ms: durationms as u64,
                                        is_liked: song_is_liked,
                                    },
                                    url: song_url,
                                    next_id: String::from(&i.related_videos[0].id),
                                },
                            }
                        });
                    }
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "Error",
    });
}

#[post("get_song_info_db")]
async fn get_info_db(payload: web::Json<SongInfoReq>) -> impl Responder {
    use crate::models::Song;
    use crate::schema::songs::dsl as songs;
    let user_song_id = &payload.song_id;
    let user_token = &payload.token;
    let vt = verify_cookie(&user_token);
    if let Ok(t) = vt {
        match t {
            TokenSuccess::UserId(uid) => {
                let conn = &mut established_connection();
                let song: Result<Song, _> =
                    songs::songs.filter(songs::id.eq(user_song_id)).first(conn);
                if let Ok(s) = song {
                    let yt = rusty_ytdl::Video::new_with_options(
                        &s.video_id,
                        VideoOptions {
                            quality: VideoQuality::HighestAudio,
                            filter: VideoSearchOptions::Audio,
                            ..Default::default()
                        },
                    );
                    if let Ok(v) = yt {
                        let info = v.get_info().await;
                        if let Ok(i) = info {
                            let details = i.video_details;
                            let title = details.title;
                            let channel = details.author.clone().unwrap().name;
                            let channel_id = details.author.unwrap().id;
                            let thumbnail = &details.thumbnails[0].url;
                            let video_id = details.video_id;
                            let durationms = details.length_seconds.parse().unwrap_or(0) * 1000;
                            let song_is_liked = match check_liked(&uid, &s.video_id) {
                                LikeCheckResult::Liked(_) => true,
                                LikeCheckResult::Error => false,
                                LikeCheckResult::Unliked => false,
                            };
                            let fmts = i.formats;
                            let mut song_url = String::new();
                            println!("related to {}", title);
                            println!("-------------");
                            for r in &i.related_videos {
                                println!("{}", r.title);
                            }
                            println!("------------");
                            for f in fmts {
                                let quality = f.audio_quality.unwrap_or("None".to_string());
                                let codec = f.mime_type.audio_codec.unwrap_or("None".to_string());
                                if quality != "None" && codec != "None" {
                                    if quality == "AUDIO_QUALITY_LOW" && codec == "opus" {
                                        song_url = String::from(&f.url);
                                    }
                                }
                            }
                            let new_id = add_song_to_db((
                                title.as_str(),
                                channel.as_str(),
                                video_id.as_str(),
                                thumbnail.as_str(),
                                durationms,
                            ));
                            return HttpResponse::Ok().json({
                                ReturnMsg {
                                    success: true,
                                    msg: SongInfoMsg {
                                        info: SearchResultItem {
                                            id: new_id.clone(),
                                            title: title.clone(),
                                            channel: channel.clone(),
                                            channel_id: channel_id.clone(),
                                            video_id: video_id.clone(),
                                            thumbnail_url: thumbnail.clone(),
                                            duration_ms: durationms as u64,
                                            is_liked: song_is_liked,
                                        },
                                        url: song_url,
                                        next_id: String::from(&i.related_videos[0].id),
                                    },
                                }
                            });
                        }
                    }
                }else{
                    println!("No song found");
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "Error",
    });
}

#[derive(Deserialize)]
struct GetAllLikedReq {
    token: String,
}

#[derive(Serialize)]
struct GetLikedMsg {
    songs: Vec<Song>,
}




#[post("/get_all_liked")]
async fn get_all_liked(payload: web::Json<GetAllLikedReq>) -> impl Responder {
    use crate::models::*;
    use crate::schema::liked_song::dsl::liked_song;
    use crate::schema::songs::dsl::songs;
    let user_token = &payload.token;
    let vt = verify_cookie(user_token);
    let conn = &mut established_connection();
    if let Ok(t) = vt {
        match t {
            TokenSuccess::UserId(uid) => {
                // let liked_songs = liked_song.filter(liked_by.eq(uid)).select()

                let l_songs: Result<Vec<Song>, _> = liked_song
                    .inner_join(songs)
                    .filter(liked_by.eq(uid))
                    .select(Song::as_select())
                    .load::<Song>(conn);
                if let Ok(s) = l_songs {
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: true,
                        msg: GetLikedMsg { songs: s },
                    });
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "false",
    });
}

#[derive(Deserialize)]
struct CreatePlaylistReq {
    title: String,
    token: String,
}

#[derive(Serialize)]
struct CreatePlaylistRes {
    playlist: Playlist,
}

#[post("/create_playlist")]
async fn create_playlist(payload: web::Json<CreatePlaylistReq>) -> impl Responder {
    use crate::models;
    use crate::schema::playlist::dsl;
    let user_token = &payload.token;
    let mut playlist_title = String::from(&payload.title);
    let vt = verify_cookie(&user_token);
    let conn = &mut established_connection();
    if let Ok(t) = vt {
        match t {
            TokenSuccess::UserId(uid) => {
                let count = count_playlists(&uid);
                if playlist_title == "" {
                    playlist_title =
                        String::from(&("Playlist".to_string() + " " + &(count + 1).to_string()));
                }
                let pid = Uuid::new_v4().to_string();
                let create_playlist = diesel::insert_into(dsl::playlist)
                    .values(models::Playlist {
                        custom_image: false,
                        id: pid.clone(),
                        title: String::from(&playlist_title),
                        user_id: String::from(&uid),
                        count: 0,
                    })
                    .execute(conn);
                if let Ok(size) = create_playlist {
                    println!("{}", size);
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: true,
                        msg: CreatePlaylistRes {
                            playlist: models::Playlist {
                                custom_image: false,
                                id: pid.clone(),
                                title: playlist_title.clone(),
                                user_id: uid.clone(),
                                count: 0,
                            },
                        },
                    });
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "error",
    });
}

#[derive(Deserialize)]
struct AddSongReq {
    pid: String,
    token: String,
    song_db_id: String,
}

#[post("add_song_pl")]
async fn add_song_to_pl(payload: web::Json<AddSongReq>) -> impl Responder {
    use crate::models::Playlist;
    use crate::models::PlaylistSong;
    use crate::models::Song;
    use crate::schema::playlist;
    use crate::schema::playlist_song;
    use crate::schema::songs;
    let pid = &payload.pid;
    let user_token = &payload.token;
    let song_db_id = &payload.song_db_id;
    let vt = verify_cookie(user_token);
    if let Ok(t) = vt {
        match t {
            TokenSuccess::UserId(uid) => {
                let conn = &mut established_connection();
                let verify_pl: Result<Playlist, _> =
                    playlist::dsl::playlist.find(pid).first::<Playlist>(conn);
                if let Ok(pl) = verify_pl {
                    if pl.user_id == uid {
                        let new_id = Uuid::new_v4().to_string();
                        let verify_song: Result<Song, _> =
                            songs::dsl::songs.find(song_db_id).first::<Song>(conn);
                        if let Ok(s) = verify_song {
                            let __ = diesel::update(playlist::dsl::playlist)
                                .filter(playlist::dsl::id.eq(&pl.id))
                                .set(playlist::dsl::count.eq(pl.count + 1))
                                .execute(conn);
                            let insert_ok = diesel::insert_into(playlist_song::dsl::playlist_song)
                                .values(PlaylistSong {
                                    id: new_id.clone(),
                                    playlist_id: pid.clone(),
                                    song_id: s.id.clone(),
                                })
                                .execute(conn);
                            if let Ok(_) = insert_ok {
                                return HttpResponse::Ok().json(ReturnMsg {
                                    success: true,
                                    msg: "Success",
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "Error",
    });
}

#[post("remove_song_pl")]
async fn remove_song_pl(payload: web::Json<AddSongReq>) -> impl Responder {
    use crate::models::Playlist;
    use crate::models::PlaylistSong;
    use crate::schema::playlist::dsl as playlist;
    use crate::schema::playlist_song::dsl as playlist_song;
    let pid = &payload.pid;
    let user_token = &payload.token;
    let song_db_id = &payload.song_db_id;
    let vt = verify_cookie(user_token);
    if let Ok(t) = vt {
        match t {
            TokenSuccess::UserId(uid) => {
                let conn = &mut established_connection();
                let verify_pl: Result<Playlist, _> =
                    playlist::playlist.find(pid).first::<Playlist>(conn);
                if let Ok(pl) = verify_pl {
                    if pl.user_id == uid {
                        let verify_song_in_pl: Result<PlaylistSong, _> =
                            playlist_song::playlist_song
                                .filter(
                                    playlist_song::song_id
                                        .eq(&song_db_id)
                                        .and(playlist_song::playlist_id.eq(pid)),
                                )
                                .first::<PlaylistSong>(conn);
                        if let Ok(pl_song) = verify_song_in_pl {
                            let delete_success = diesel::delete(playlist_song::playlist_song)
                                .filter(playlist_song::id.eq(pl_song.id))
                                .execute(conn);
                            if let Ok(_) = delete_success {
                                let _d = diesel::update(playlist::playlist)
                                    .set(playlist::count.eq(pl.count - 1))
                                    .execute(conn);
                                return HttpResponse::Ok().json(ReturnMsg {
                                    success: true,
                                    msg: "Success",
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "error",
    });
}

#[derive(Deserialize)]
struct DeletePlReq {
    pid: String,
    token: String,
}

#[post("delete_pl")]
async fn delete_pl(payload: web::Json<DeletePlReq>) -> impl Responder {
    use crate::models::Playlist;
    use crate::models::PlaylistSong;
    use crate::schema::playlist::dsl as playlist;
    use crate::schema::playlist_song::dsl as playlist_song;
    let pid = &payload.pid;
    let user_token = &payload.token;

    if let Ok(t) = verify_cookie(&user_token) {
        match t {
            TokenSuccess::UserId(uid) => {
                let conn = &mut established_connection();
                let verify_pl: Result<Playlist, _> =
                    playlist::playlist.find(&pid).first::<Playlist>(conn);
                if let Ok(pl) = verify_pl {
                    if pl.user_id == uid {
                        let all_pl_songs: Result<Vec<PlaylistSong>, _> =
                            playlist_song::playlist_song
                                .filter(playlist_song::playlist_id.eq(&pid))
                                .load::<PlaylistSong>(conn);
                        if let Ok(pl_songs) = all_pl_songs {
                            for pl_song in pl_songs {
                                let _ = diesel::delete(playlist_song::playlist_song)
                                    .filter(playlist_song::id.eq(pl_song.id))
                                    .execute(conn);
                            }
                            let delete_success = diesel::delete(playlist::playlist)
                                .filter(playlist::id.eq(&pid))
                                .execute(conn);
                            if let Ok(_) = delete_success {
                                return HttpResponse::Ok().json(ReturnMsg {
                                    success: true,
                                    msg: "Success",
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "Error",
    });
}

fn count_playlists(uid: &str) -> usize {
    use crate::schema::playlist::dsl;
    let conn = &mut established_connection();
    let vec_check: Result<Vec<Playlist>, _> = dsl::playlist
        .filter(dsl::user_id.eq(uid))
        .load::<Playlist>(conn);
    let mut count: usize = 0;
    if let Ok(pls) = vec_check {
        for _ in pls {
            count = count + 1;
        }
    }
    return count;
}

#[derive(Deserialize)]
struct EditReq {
    title: String,
    pid: String,
    token: String,
}

#[post("edit_playlist")]
async fn edit_playlist(payload: web::Json<EditReq>) -> impl Responder {
    use crate::models::Playlist;
    use crate::schema::playlist::dsl as playlist;
    let title = &payload.title;
    let user_token = &payload.token;
    let pid = &payload.pid;
    if let Ok(t) = verify_cookie(&user_token) {
        match t {
            TokenSuccess::UserId(uid) => {
                let conn = &mut established_connection();
                let check_pl: Result<Playlist, _> =
                    playlist::playlist.find(&pid).first::<Playlist>(conn);
                if let Ok(pl) = check_pl {
                    if pl.user_id == uid {
                        let check_up: Result<usize, _> =
                            diesel::update(playlist::playlist.find(&pid))
                                .set(playlist::title.eq(&title))
                                .execute(conn);
                        if let Ok(_) = check_up {
                            return HttpResponse::Ok().json(ReturnMsg {
                                success: true,
                                msg: "OK",
                            });
                        }
                    }
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "Error",
    });
}

#[derive(Deserialize)]
struct GetUserPlsReq {
    token: String,
}

#[derive(Serialize)]
struct PlInfo {
    title: String,
    id: String,
    songs: Vec<Song>,
    count: i32,
}

#[derive(Serialize)]
struct GetUserPlsRes {
    pls: Vec<PlInfo>,
}

#[post("get_all_pls")]
async fn get_all_pls(payload: web::Json<GetUserPlsReq>) -> impl Responder {
    
    use crate::models::Playlist;
    // use crate::models::PlaylistSong;
    use crate::models::Song;
    use crate::schema::songs::dsl as songs;
    use crate::schema::playlist::dsl as playlist;
    use crate::schema::playlist_song::dsl as playlist_song;
    let user_token = &payload.token;
    if let Ok(t) = verify_cookie(&user_token) {
        match t {
            TokenSuccess::UserId(uid) => {
                let conn = &mut established_connection();

                let check_pls: Result<Vec<Playlist>, _> = playlist::playlist
                    .filter(playlist::user_id.eq(&uid))
                    .load::<Playlist>(conn);
                if let Ok(pls) = check_pls {
                    let mut ret_vec: Vec<PlInfo> = Vec::new();
                    for pl in pls {
                        let pl_songs_check: Result<Vec<Song>, _> =
                            playlist_song::playlist_song
                                .inner_join(playlist::playlist)
                                .inner_join(songs::songs)
                                .filter(
                                    playlist_song::playlist_id
                                        .eq(&pl.id)
                                        .and(playlist::user_id.eq(&uid)),
                                )
                                .select(Song::as_select())
                                .load(conn);
                        if let Ok(pl_songs) = pl_songs_check {
                                ret_vec.push(PlInfo {
                                    title: pl.title.clone(),
                                    id: pl.id.clone(),
                                    songs:pl_songs,
                                    count: pl.count,
                                })
                        }
                    }
                    return HttpResponse::Ok().json(ReturnMsg {
                        success: true,
                        msg: GetUserPlsRes { pls: ret_vec },
                    });
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "error",
    });
}

#[derive(Deserialize)]
struct GetPlSongsReq {
    pid: String,
    token: String,
}

#[post("get_pl_songs")]
async fn get_pl_songs(payload: web::Json<GetPlSongsReq>) -> impl Responder {
    // use crate::models::PlaylistSong;
    use crate::models::Song;
    use crate::schema::songs::dsl as songs;
    use crate::schema::playlist::dsl as playlist;
    use crate::schema::playlist_song::dsl as playlist_song;
    let pid = &payload.pid;
    let user_token = &payload.token;
    if let Ok(t) = verify_cookie(&user_token) {
        match t {
            TokenSuccess::UserId(uid) => {
                let conn = &mut established_connection();
                // let pl_check = playlist::playlist.filter(playlist::id.eq(&pid).and(playlist::user_id.eq(&uid)));
                let pl_songs_check: Result<Vec<Song>, _> = playlist_song::playlist_song
                    .inner_join(playlist::playlist)
                    .inner_join(songs::songs)
                    .filter(
                        playlist_song::playlist_id
                            .eq(&pid)
                            .and(playlist::user_id.eq(uid)),
                    )
                    .select(Song::as_select())
                    .load(conn);
                if let Ok(pl_songs) = pl_songs_check {
                    // let ids: Vec<String> = pl_songs.into_iter().map(|song| song.song_id).collect();
                    return HttpResponse::Ok().json({
                        ReturnMsg {
                            success: true,
                            msg: pl_songs,
                        }
                    });
                }
            }
        }
    }
    return HttpResponse::Ok().json(ReturnMsg {
        success: false,
        msg: "Error",
    });
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        // let cors = Cors::allow_any_method().allow_any_header().allowed_origin("http://localhost:5173")
        let cors = Cors::default()
            .supports_credentials()
            .allow_any_method()
            .allow_any_header()
            .allow_any_origin();

        // Cors::allow_any_method(cors);

        App::new()
            .wrap(cors)
            .service(test)
            .service(check_cookie)
            .service(login)
            .service(signup)
            .service(search_vids)
            .service(play_song)
            .service(like_song)
            .service(is_liked)
            .service(get_all_liked)
            .service(get_info)
            .service(get_info_db)
            .service(create_playlist)
            .service(add_song_to_pl)
            .service(delete_pl)
            .service(remove_song_pl)
            .service(edit_playlist)
            .service(get_all_pls)
            .service(get_pl_songs)
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await
}
