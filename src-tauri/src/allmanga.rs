use reqwest::blocking::Client;

pub fn get_anime_search(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client.get("https://www.example.com").send()?;
    let json = response.text()?;
    println!("dasd");
    Ok(json)
}