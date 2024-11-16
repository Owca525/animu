const { invoke } = window.__TAURI__.core;

function create_card(anime) {
  console.log(anime)
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
  spinner.className = "material-symbols-outlined";
  spinner.id = "spinner";
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

  card_div.addEventListener("click", function() {
    const anime_id = anime._id;
    fetch_episode_list(anime_id);
  });

  document.getElementById("card-container").appendChild(card_div)
};

async function fetch_episode_list(id) {
  const response = await invoke("get_anime_data", {"id": id});
  console.log(response);
};

async function fetch_search_anime() {
  const input = document.getElementById('search_text');
  const name = input.value;

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
  };
};

document.getElementById("search_text").addEventListener("keypress", function(event) {
    if (event.key == "Enter") {
      document.getElementById("card-container").innerHTML = "";
      fetch_search_anime();
    };
});

document.querySelector("html").addEventListener("click", function() {
  $(".sidebar").css("display", "none")
});
document.querySelector(".header").addEventListener("click", function() {
  $(".sidebar").css("display", "none")
});
document.querySelector(".container").addEventListener("click", function() {
  $(".sidebar").css("display", "none")
});

document.querySelector("#menu").addEventListener("click", function() {
  $(".sidebar").css("display", "flex")
});