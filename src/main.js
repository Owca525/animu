const { invoke } = window.__TAURI__.core;

function create_card(anime) {
  console.log(anime)
  var title = anime.name;
  if (title.length > 30) {
    title = title.substring(0, 30) + "...";
  }

  var card_div = document.createElement("div");
  card_div.className = "card";
  card_div.title = title;
  var card_img = document.createElement("div");
  card_img.className = "card-img";
  var img = document.createElement("img");
  img.src = anime.thumbnail;
  var card_text = document.createElement("div");
  card_text.className = "text-card";
  card_text.textContent = title;

  card_img.appendChild(img);
  card_div.appendChild(card_img);
  card_div.appendChild(card_text)

  document.getElementById("card-container").appendChild(card_div)
};

async function fetchData() {
  const input = document.getElementById('search_text')
  const name = input.value

  if (name != "") try {
    const response = await invoke('get_search', {"name": name});
    const cleanedJsonString = response.slice(1, -1);
    const jsonObject = JSON.parse("{" + cleanedJsonString);

    var anime_data = jsonObject.data.shows.edges;
    anime_data.forEach(element => {
        create_card(element);
    });
  } catch (error) {
    console.error(error);
  }
}

document.getElementById("search_text").addEventListener("keypress", function(event) {
    if (event.key == "Enter") {
      document.getElementById("card-container").innerHTML = "";
      fetchData()
    }
});