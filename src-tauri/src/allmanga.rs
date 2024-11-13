use reqwest::Client;

// Hashe są indyfikatorem dla danego urządzenia muszą być kiedy jest wysyłany request do api allmanga
static HASH_SEARCH: &str = "06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a";
static HASH_INFO: &str = "9d7439c90f203e534ca778c4901f9aa2d3ad42c06243ab2c5e6b79612af32028";
static HASH_PLAYER: &str = "5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0";
static API_WEB: &str = "https://api.allanime.day";

// wysyła POST do api allmanga z danymi "name" i jest zwracany dict konwertowany na String
pub async fn get_search_anime(name: &str) -> Result<String, String> {
    let client = Client::new();
    let variables = "{'search':{'query':'".to_string() + &name + "'},'limit':26,'page':1,'translationType':'sub','countryOrigin':'ALL'}";
    let extensions = "{'persistedQuery':{'version':1,'sha256Hash': '".to_string() + HASH_SEARCH + "'}}";
    let url = API_WEB.to_string() + "/api?variables=" + &variables + "&extensions=" + &extensions;

    let response = client
        .get(url.replace("'", "\""))
        .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0")
        .header("Referer", "https://allmanga.to/")
        .send()
        .await;

    match response {
        Ok(resp) => {
            match resp.text().await {
                Ok(text) => Ok(text),
                Err(err) => Err(err.to_string()),
            }
        }
        Err(err) => Err(err.to_string()),
    }
}