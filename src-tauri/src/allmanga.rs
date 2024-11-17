#![allow(unused)]
use reqwest::Client;
use serde_json::Value;
use regex::Regex;
use std::collections::HashMap;

// Hashe są indyfikatorem dla danego urządzenia muszą być kiedy jest wysyłany request do api allmanga
static HASH_SEARCH: &str = "06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a";
static HASH_INFO: &str = "9d7439c90f203e534ca778c4901f9aa2d3ad42c06243ab2c5e6b79612af32028";
static HASH_PLAYER: &str = "5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0";
static API_WEB: &str = "https://api.allanime.day";

// wysyła GET do api allmanga z danymi "name" i jest zwracany dict konwertowany na String
pub async fn get_search_anime(name: &str) -> Result<String, String> {
    let client = Client::new();
    let variables = "{'search':{'query':'".to_string()
        + &name
        + "'},'limit':26,'page':1,'translationType':'sub','countryOrigin':'ALL'}";
    let extensions =
        "{'persistedQuery':{'version':1,'sha256Hash': '".to_string() + HASH_SEARCH + "'}}";
    let url = API_WEB.to_string() + "/api?variables=" + &variables + "&extensions=" + &extensions;

    let response = client
        .get(url.replace("'", "\""))
        .header(
            "User-Agent",
            "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
        )
        .header("Referer", "https://allmanga.to/")
        .send()
        .await;

    match response {
        Ok(resp) => match resp.text().await {
            Ok(text) => Ok(text),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}

pub async fn fetch_recent_anime() -> Result<String, String> {
    let client = Client::new();
    let variables = "{'search':{'sortBy':'Recent'},'limit':26,'page':1,'translationType':'sub','countryOrigin':'ALL'}";
    let extensions = "{'persistedQuery':{'version':1,'sha256Hash': '".to_string() + HASH_SEARCH + "'}}";
    let url = API_WEB.to_string() + "/api?variables=" + &variables + "&extensions=" + &extensions;

    let response = client
        .get(url.replace("'", "\""))
        .header(
            "User-Agent",
            "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
        )
        .header("Referer", "https://allmanga.to/")
        .send()
        .await;

    match response {
        Ok(resp) => match resp.text().await {
            Ok(text) => Ok(text),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}

async fn fetch_url(url: &str) -> Result<String, String> {
    let client = Client::new();
    println!("{}", url);
    let response = client
        .get(url.replace("'", "\""))
        .header(
            "User-Agent",
            "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
        )
        .header("Referer", "https://allmanga.to/")
        .send()
        .await;

    match response {
        Ok(resp) => match resp.text().await {
            Ok(text) => Ok(text),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}


fn decode_text(text: &str, replacements: &HashMap<&str, &str>) -> String {
    let mut processed_text = String::new();
    for chunk in text.as_bytes().chunks(2) {
        let chunk_str = std::str::from_utf8(chunk).unwrap_or("");
        processed_text.push_str(chunk_str);
        processed_text.push('\n');
    }

    let mut result = processed_text.clone();
    for (pattern, replacement) in replacements {
        let regex = Regex::new(pattern).expect("Invalid regex");
        result = regex.replace_all(&result, *replacement).to_string();
    }

    result.replace('\n', "").replace("/clock", "/clock.json")
}

fn find_url(url: &str, source_name: &str, source_names: &[&str]) -> String {
    if source_names.contains(&source_name) {
        url.to_string()
    } else {
        String::new()
    }
}

async fn search_urls(dict: &str) -> String {
    let source_names = vec!["Sak", "S-mp4", "Luf-mp4", "Mp4", "Ok"];
    let replacements: HashMap<&str, &str> = HashMap::from([
        ("^01$", "9"),
        ("^08$", "0"),
        ("^05$", "="),
        ("^0a$", "2"),
        ("^0b$", "3"),
        ("^0c$", "4"),
        ("^07$", "?"),
        ("^00$", "8"),
        ("^5c$", "d"),
        ("^0f$", "7"),
        ("^5e$", "f"),
        ("^17$", "/"),
        ("^54$", "l"),
        ("^09$", "1"),
        ("^48$", "p"),
        ("^4f$", "w"),
        ("^0e$", "6"),
        ("^5b$", "c"),
        ("^5d$", "e"),
        ("^0d$", "5"),
        ("^53$", "k"),
        ("^1e$", "&"),
        ("^5a$", "b"),
        ("^59$", "a"),
        ("^4a$", "r"),
        ("^4c$", "t"),
        ("^4e$", "v"),
        ("^57$", "o"),
        ("^51$", "i"),
    ]);

    let parsed: HashMap<String, Value> = serde_json::from_str(dict).expect("");
    if let Some(source_urls) = parsed
        .get("data")
        .and_then(|data| data.get("episode"))
        .and_then(|episode| episode.get("sourceUrls"))
        .and_then(|urls| urls.as_array())
    {
        let urls: Vec<String> = source_urls
            .iter()
            .filter_map(|entry| {
                let url = entry.get("sourceUrl")?.as_str()?;
                let source_name = entry.get("sourceName")?.as_str()?;
                Some(find_url(url, source_name, &source_names))
            })
            .filter(|url| !url.is_empty())
            .collect();

        let decoded_urls: Vec<String> = urls
            .iter()
            .filter(|url| url.starts_with("--"))
            .map(|url| format!("http://allanime.day/apivtwo/clock.json?id={}", decode_text(&url[2..], &replacements)))
            .collect();

        for url in decoded_urls {
            println!("{:?}", fetch_url(&url).await);
        }
    }
    
    return dict.to_string();
}

// wysyła request GET do api allmanga i odbiera zaszyfrowane linki
pub async fn extracting_urls(id: &str, ep: &str) -> Result<String, String> {
    let client = Client::new();
    let variables = "{'showId':'".to_string() + &id + "','translationType':'sub','episodeString':'" + &ep + "'}";
    let extensions = "{'persistedQuery':{'version':1,'sha256Hash': '".to_string() + HASH_PLAYER + "'}}";
    let url = API_WEB.to_string() + "/api?variables=" + &variables + "&extensions=" + &extensions;

    let response = client
        .get(url.replace("'", "\""))
        .header(
            "User-Agent",
            "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
        )
        .header("Referer", "https://allmanga.to/")
        .send()
        .await;

    match response {
        Ok(resp) => match resp.text().await {
            Ok(text) => {
                Ok(search_urls(&text).await)
            }
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}

// wysyła do api allmanga metodą GET i odpowiedzi powinno być dict z danymi anime
pub async fn extracting_anime_data(id: &str) -> Result<String, String> {
    let client = Client::new();
    let variables = "{'_id':'".to_string() + &id + "'}";
    let extensions = "{'persistedQuery':{'version':1,'sha256Hash': '".to_string() + HASH_INFO + "'}}";
    let url = API_WEB.to_string() + "/api?variables=" + &variables + "&extensions=" + &extensions;

    let response = client
        .get(url.replace("'", "\""))
        .header( "User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",)
        .header("Referer", "https://allmanga.to/")
        .send()
        .await;

    match response {
        Ok(resp) => match resp.text().await {
            Ok(text) => Ok(text),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}
