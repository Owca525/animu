class example {
    metadata = {
        version: "1.0",
        name: "example",
        author: "Author",
        icon: "",
        urlWebsite: "",
        supportLang: ["en"]
    };
    /**
     * Returns hostname, resolution, dubbing, etc.
     * More in types section
     *
     * @param {string} type - anime type (sub/dub/raw)
     * @param {string} episode - current episode
     * @param {string} id - id of anime
     * @returns {playerData[]}  - return empty list when is error
     */
    extractPlayerData = async (type, episode, id) => {};
    
    /**
     * Search Anime and return episode list of this anime
     * and if animeData is undefined, then anime_id is, and vice versa
     * More in types section
     *
     * @param {AnimeData | undefined} animeData - full anime information
     * @param {string | undefined} anime_id
     * @returns {episodeList | undefined} - return undefinde when is error
     */
    extractEpisodeList = async (animeData, anime_id) => {};

    /**
     * Return only episode list
     * More in types section
     *
     * @param {string} type - anime type (sub/dub/raw)
     * @param {string} anime_id
     * @returns {{ ep: string, img?: string, title?: string }[]} - return empty list when is error
     */
    extractOnlyEpisodesList = async (type, anime_id) => {};

    /**
     * Search Anime and return list of results
     * More in types section
     *
     * @param {string} name - search text
     * @param {number} page
     * @param {genresSearchFormat | undefined} params
     * @returns {cardData[]} - return empty list when is error
     */
    searchAnime = async (name, page, params) => {};
}
export { example as default };