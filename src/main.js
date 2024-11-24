const { invoke } = window.__TAURI__.core;

var title = "";

function set_theme(theme) {
  document.body.setAttribute("class", theme);
}

if (localStorage.getItem("theme") == null) {
  localStorage.setItem("theme", "light");
  set_theme(localStorage.getItem("theme"));
} else {
  set_theme(localStorage.getItem("theme"));
  if (localStorage.getItem("theme") == "light") {
    document.querySelector("#change-theme").textContent = "dark_mode";
  } else {
    document.querySelector("#change-theme").textContent = "light_mode";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  run_events();
  //set_recent_anime();

  // Eventy
  document.querySelector(".set-back").addEventListener("click", function () {
    document.querySelector(".player-container").style.display = "none";
    document.querySelector(".information-container").style.display = "";
  });

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

  // Change theme
  document
    .querySelector("#change-theme")
    .addEventListener("click", function () {
      if (localStorage.getItem("theme") == "light") {
        set_theme("dark");
        localStorage.setItem("theme", "dark");
        this.textContent = "light_mode";
      } else {
        set_theme("light");
        localStorage.setItem("theme", "light");
        this.textContent = "dark_mode";
      }
    });

  document
    .querySelector(".information-container")
    .addEventListener("click", function () {
      this.style.display = "none";
    });

  document
    .querySelector(".box-information")
    .addEventListener("click", function (event) {
      event.stopPropagation();
    });
  // end

  // main page/search
  async function set_recent_anime() {
    const response = await invoke("get_recent_anime");
    const cleanedJsonString = response.slice(1, -1);
    const jsonObject = JSON.parse("{" + cleanedJsonString);

    var anime_data = jsonObject.data.shows.edges;
    anime_data.forEach((element) => {
      create_card(element);
    });
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
  // end

  // cards creation
  function create_card(anime) {
    console.log(anime);
    var title = anime.name;
    if (title.length > 30) {
      title = title.substring(0, 43) + "...";
    }

    const card_div = document.createElement("div");
    card_div.className = "card";
    card_div.title = anime.name;
    const card_img = document.createElement("div");
    card_img.className = "card-img";
    const img = document.createElement("img");
    img.src = anime.thumbnail;
    const load = document.createElement("div");
    load.className = "error-img";
    const spinner = document.createElement("div");
    spinner.className = "material-symbols-outlined spinner";
    spinner.textContent = "progress_activity";
    img.onerror = function () {
      const placeholder = document.createElement("div");
      placeholder.textContent = "Error Loading Img";
      placeholder.className = "error-img";
      load.style.display = "none";

      img.replaceWith(placeholder);
    };
    load.appendChild(spinner);
    card_img.appendChild(load);
    img.onload = function () {
      load.style.display = "none";
    };
    var card_text = document.createElement("div");
    card_text.className = "text-card";
    card_text.textContent = title;

    card_img.appendChild(img);
    card_div.appendChild(card_img);
    card_div.appendChild(card_text);

    card_div.addEventListener("click", function () {
      const anime_id = anime._id;
      fetch_anime_information(anime_id);
    });
    document.querySelector(".card-container").appendChild(card_div);
  };

  // player section
  async function preaper_urls(urls) {
    urls.forEach((element) => {
      if (element.startsWith("{")) {
        var dict = JSON.parse(element);
        urls.push(dict.links[0].link);
        var num = urls.indexOf(element);
        console.log(num);
        urls.splice(num, 1);
      }
    });
    return urls;
  };

  async function set_player(id_anime, ep) {
    document.querySelector(".player-container").style.display = "";
    document.querySelector(".information-container").style.display = "none";
    const response = await invoke("get_episode_url", { "id": id_anime, "ep": ep });
    // TODO: Make player work 
    console.log(response)
  };
  // end

  // information
  async function fetch_anime_information(id) {
    try {
      const response = await invoke("get_anime_data", { id: id });
      const jsonObject = JSON.parse(response);
      const showData = jsonObject["data"]["show"];

      document.querySelector(".information-container").style.display = "";
      document.querySelector(".box-episodes").innerHTML = "";
      var box_img = document.querySelector(".box-img");
      box_img.innerHTML = "";

      // zamiana danych na prawidłowe
      const img = document.createElement("img");
      img.src = showData["thumbnail"];
      const load = document.createElement("div");
      load.className = "error-img";
      const spinner = document.createElement("div");
      spinner.className = "material-symbols-outlined spinner";
      spinner.textContent = "progress_activity";
      img.onerror = function () {
        const placeholder = document.createElement("div");
        placeholder.textContent = "Error Loading Img";
        placeholder.className = "error-img";
        load.style.display = "none";

        img.replaceWith(placeholder);
      };
      load.appendChild(spinner);
      box_img.appendChild(load);
      img.onload = function () {
        load.style.display = "none";
      };
      box_img.appendChild(img);

      document.querySelector(".header-text").innerHTML = showData["name"];
      document.querySelector(".description").innerHTML =
        showData["description"];
      const episode_list = showData.availableEpisodesDetail.sub;
      episode_list.reverse();
      title = showData["name"];
      episode_list.forEach((element) => {
        let ep = document.createElement("div");
        ep.className = "episode";
        ep.innerHTML = element;
        ep.addEventListener("click", function () {
          const ep = element;
          const id_anime = id;
          set_player(id_anime, ep);
        });
        document.querySelector(".box-episodes").appendChild(ep);
      });
      //await preaper_episode(id, episode_list[0])
    } catch (error) {}
  }
  // img function
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
});
