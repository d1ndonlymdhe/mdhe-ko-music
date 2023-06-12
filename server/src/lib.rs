// use diesel::pg::PgConnection


use diesel::prelude::*;
// pub(crate) use diesel::sqlite::SqliteConnection;
pub(crate) use diesel::mysql::MysqlConnection;
use dotenvy::dotenv;
use std::env;

// pub mod models;
// pub mod schema;


pub fn established_connection() -> MysqlConnection {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
    // SqliteConnection::establish(&database_url).expect("Couldnot connect to database")
    // MysqlConnection::establish(&database_url).;
    MysqlConnection::establish(&database_url).expect("couldnot connect to database")
}