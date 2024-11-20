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

async function preaper_urls(urls) {
  urls.forEach(element => {
    if (element.startsWith("{")) {
      var dict = JSON.parse(element)
      urls.push(dict.links[0].link)
      var num = urls.indexOf(element)
      console.log(num)
      urls.splice(num, 1)
    }
  });
  return urls;
}

function change_player(url) {
  document.querySelector(".player").innerHTML = "";
  const video = document.createElement("iframe");
  video.width = "854";
  video.height = "480";
  video.frameborder = "0";
  video.allowFullscreen = true;
  if (url.includes("myanime.sharepoint.com")) {
    const video = document.createElement("video");
    const source = document.createElement("source");
    video.width = "854";
    video.height = "480";
    video.controls = true;
    source.src = url;
    source.id = "video";
    source.type = "video/mp4"
    video.appendChild(source);
    document.querySelector(".player").appendChild(video);
    return
  }
  if (url.includes("ok.ru")) {
    video.src = url;
  }
  if (url.includes("mp4upload.com")) {
    video.src = url;
  }
  document.querySelector(".player").appendChild(video);
}

async function preaper_episode(id, ep) {
  document.querySelector(".urls-player").innerHTML = "";
  const list = await invoke("get_episode_url", { "id": id, "ep": ep });
  if (list[0] == "500") {
    // TODO: dodać zabezpieczenia do playera jeśli wywali error
  }
  var urls = await preaper_urls(eval(list));
  console.log(urls)
  urls.forEach(element => {
    var url_button = document.createElement("a");
    url_button.href = "#"
    url_button.className = "player-selector"
    if (element.includes("myanime.sharepoint.com")) {
      url_button.innerHTML = "myanime"
      url_button.addEventListener("click", function() {
        const url = element;
        change_player(url);
      });
      document.querySelector(".urls-player").appendChild(url_button)
      change_player(url);
    }
    if (element.includes("ok.ru")) {
      url_button.innerHTML = "ok.ru"
      url_button.addEventListener("click", function() {
        const url = element;
        change_player(url);
      });
      document.querySelector(".urls-player").appendChild(url_button)
    }
    if (element.includes("mp4upload.com")) {
      url_button.innerHTML = "mp4upload"
      url_button.addEventListener("click", function() {
        const url = element;
        change_player(url);
      });
      document.querySelector(".urls-player").appendChild(url_button)
    }
  })
}

async function fetch_anime_information(id) {
  try {
    const response = await invoke("get_anime_data", { "id": id });
    const jsonObject = JSON.parse(response);
    const showData = jsonObject["data"]["show"];
    document.querySelector(".container").style.display = "none";
    var player = document.querySelector(".data-container");
    player.style.display = "";
    // zamiana danych na prawidłowe
    document.querySelector("#thumbnail").src = showData["thumbnail"]
    document.querySelector(".header-text").innerHTML = showData["name"]
    document.querySelector(".description").innerHTML = showData["description"]
    const episode_list = showData.availableEpisodesDetail.sub;
    episode_list.reverse();
    episode_list.forEach(element => {
      let ep = document.createElement("a");
      ep.href = "#";
      ep.className = "episode";
      ep.innerHTML = "Episode " + element;
      ep.addEventListener("click", function() {
        const ep = element
        const id_anime = id;
        preaper_episode(id_anime, ep)
      })
      document.querySelector(".episodes").appendChild(ep);
    });
    await preaper_episode(id, episode_list[0])
    // Nie działa zmiana video
    /*
    const jsonUrls = get_extracted_urls(showData["_id"], "1")
    document.querySelector("#video").src = "huh"
    for(url in jsonUrls["data"]["episode"]["sourceUrls"]) {
        console.log(url)
        if(url["streamerId"] == "allanime") {
          document.querySelector("#video").src = url["sourceUrl"]
          console.log(url["sourceUrl"])
          break;
        }
    } */
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