const { invoke } = window.__TAURI__.core;

function create_card(anime) {
  console.log(anime);
  var title = anime.name;
  if (title.length > 30) {
    title = title.substring(0, 43) + "...";
  }

  var card_div = document.createElement("div");
  card_div.className = "card";
  card_div.title = anime.name;
  var card_img = document.createElement("div");
  card_img.className = "card-img";
  var spinner = document.createElement("span");
  spinner.className = "material-symbols-outlined spinner";
  spinner.textContent = "progress_activity";
  var img = document.createElement("img");
  img.src = anime.thumbnail;
  img.onerror = function () {
    var placeholder = document.createElement("div");
    placeholder.textContent = "Error Loading Img";
    placeholder.style.width = "200px";
    placeholder.style.height = "290px";
    placeholder.style.display = "flex";
    placeholder.style.justifyContent = "center";
    placeholder.style.alignItems = "center";

    img.replaceWith(placeholder);
  };
  // TODO: naprawienie żeby usuwało spinner kiedy załaduje zdjęcie
  //img.onload = function() {
  //  document.getElementById("spinner").style.display = "none";
  //  img.display = "none";
  //};
  var card_text = document.createElement("div");
  card_text.className = "text-card";
  card_text.textContent = title;

  card_img.appendChild(img);
  //card_img.appendChild(spinner);
  card_div.appendChild(card_img);
  card_div.appendChild(card_text);

  card_div.addEventListener("click", function () {
    const anime_id = anime._id;
    fetch_anime_information(anime_id);
  });
  document.querySelector(".card-container").appendChild(card_div);
}
// TODO: naprawienie żeby img i text nie przenikał przez cardy
//set_recent_anime()
async function set_recent_anime() {
  const response = await invoke("get_recent_anime");
  const cleanedJsonString = response.slice(1, -1);
  const jsonObject = JSON.parse("{" + cleanedJsonString);

  var anime_data = jsonObject.data.shows.edges;
  anime_data.forEach((element) => {
    create_card(element);
  });
}

async function fetch_anime_information(id) {
  try {
    const response = await invoke("get_anime_data", { "id": id });
    const jsonObject = JSON.parse(response);
    document.querySelector(".container").style.display = "none";
    var player = document.querySelector(".data-container");
    player.style.display = "";
    console.log(jsonObject)
    console.log(JSON.stringify(jsonObject))
    player.innerHTML = JSON.stringify(jsonObject);
  } catch (error) {}
}

async function fetch_search_anime() {
  const input = document.getElementById("search_text");
  const name = input.value;

  if (name != "")
    try {
      const response = await invoke("get_search", { name: name });
      const cleanedJsonString = response.slice(1, -1);
      const jsonObject = JSON.parse("{" + cleanedJsonString);

      var anime_data = jsonObject.data.shows.edges;
      remove_loading();
      anime_data.forEach((element) => {
        create_card(element);
      });
    } catch (error) {
      console.error(error);
    }
}

function remove_loading() {
  document.querySelector(".container").classList.remove("loading");
  document.querySelector(".container").innerHTML = "";
  var cards = document.createElement("div");
  cards.className = "card-container";
  document.querySelector(".container").appendChild(cards);
}

function set_loading() {
  document.querySelector(".container").classList.add("loading");
  var spinner = document.createElement("span");
  spinner.className = "material-symbols-outlined spinner";
  spinner.textContent = "progress_activity";
  document.querySelector(".container").appendChild(spinner);
}

document
  .getElementById("search_text")
  .addEventListener("keypress", function (event) {
    if (event.key == "Enter") {
      document.querySelector(".container").innerHTML = "";
      set_loading();
      fetch_search_anime();
    }
});
document.getElementById("test").addEventListener("click", function(){
  $(".sidebar").css("display", "none");
  $(".data-container").css("display", "");
  $(".settings-container").css("display", "none");
  $(".container").css("display", "none");
})
async function get_extracted_urls(id, ep) {
  const response = await invoke("get_episode_url", { "id": id, "ep": ep });
  console.log(response)
}
document.getElementById("test2").addEventListener("click", function(){
  get_extracted_urls("bLM8BaZEH2XaS3iRu", "1")
})
document.querySelector("#menu").addEventListener("click", function () {
  $(".sidebar").css("display", "flex");
});
document.querySelector(".home").addEventListener("click", function () {
  $(".sidebar").css("display", "none");
  $(".data-container").css("display", "none");
  $(".settings-container").css("display", "none");
  $(".container").css("display", "");
});
document.querySelector(".container").addEventListener("click", function () {
  if (document.querySelector(".sidebar").style.display != "") {
    $(".sidebar").css("display", "none");
  }
});
document.querySelector(".plugins").addEventListener("click", function () {
  $(".sidebar").css("display", "none");
  $(".container").css("display", "none");
  $(".data-container").css("display", "none");
  $(".settings-container").css("display", "");
});
document.querySelector(".settings").addEventListener("click", function () {
  $(".sidebar").css("display", "none");
  $(".container").css("display", "none");
  $(".data-container").css("display", "none");
  $(".settings-container").css("display", "");
});