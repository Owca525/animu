# Animu Documentation

## Table of Contents

- [Making Plugins](#Make-Plugin)
- [Theme CSS](#Making-Theme)
- [Functions](#Functions)
- [Types](#Types)

## Make Plugin

If you want to write your own plugin, you need to know JavaScript. Below is a template with a prepared structure where the Anmu will load correctly. The names of these functions cannot be changed.

[example File](assets/example.js)

```javascript
class example {
  metadata = {
    version: "1.0",
    name: "example",
    author: "Author",
    icon: "",
    urlWebsite: "",
    supportLang: ["en"],
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
```

## Making Theme

To create a theme, you need to create an empty folder and create a theme.json file in it. In this file, set the correct paths to css. These paths should be in the folder where theme.json is located, or if you want to set them permanently, you can specify the exact location.

[Example theme.json](assets/theme.json)

```json
{
  "api": 1,
  "author": "example",
  "mainCSS": "./example.css",
  "themeName": "Example",
  "version": "1.0"
}
```

If you want add options to theme add this to theme.json

```json
{
  "options": [
    {
      "name": "CheckBox",
      "css": "./example.css",
      "default": "false"
    },
    {
      "name": "Dropdown",
      "dropDown": [
        {
          "option": "Example 1",
          "css": "./example.css"
        },
        {
          "option": "Example 2",
          "css": "./example.css"
        }
      ]
    }
  ]
}
```

## Functions

The functions here will only be for plugins, and only these functions will be available to plugins (this may change if more functions with features are added).

```javascript
/**
 * @param {"text" | "image"} type
 * @param {string} content
 * @returns {Promise<boolean | undefined>}
 */
await SaveToClipboard(type, content);

/**
 * @param {string | undefined | null} text
 * @returns {string}
 */
capitalizeFirstLetter(text);

/**
 * Convert VTT file to list udenstand by animu
 *
 * @param {string} url
 * @returns {Promise<playerChapterList[]>}
 */
await convertChaptersVTT(url);

/**
 * @param {number} stopYear
 * @returns {string[]}
 */
genYearsList(stopYear);

/**
 * @param {string | undefined} text
 * @returns {string | undefined}
 */
makeSmallText(text);

/**
 * This function is fetch wrapper by animu
 * for support backend requests
 *
 * @param {string} url
 * @param {{ method?: "POST" | "GET", headers?: { [key: string]: string } | undefined } | undefined} options
 * @returns {{ text: string, json: { [key: string]: any } | undefined, buffer: Buffer, status: number, statusText: string, url: string, success: boolean, responseHeader: { [key: string]: string } }}
 */
await request(url, options);

/**
 * custom made i18n
 *
 * @param {string} key
 * @param {{ [key: string]: string | number | undefined } | undefined} replace
 * @returns {string}
 */
t(key, replace);
```

# Types
All types needed for plugins will be here.

```typescript
interface AnimeData {
    averageScore?: number | undefined
    bannerImage?: string | undefined
    coverImage?: string | undefined
    description?: string | undefined
    duration?: number | undefined
    endDate?: {
        day: number
        month: number
        year: number
    } | undefined
    episodes?: number | undefined
    format?: string | undefined
    genres?: Array<String>
    nextAiringEpisode?: {
        airingAt: number
        episode: number
        timeUntilAiring: number
    } | undefined
    popularity?: number | undefined
    season?: string | undefined
    seasonYear?: number | undefined
    startDate?: {
        day: number
        month: number
        year: number
    } | undefined
    characters?: {
        role: string,
        character: {
            id: string,
            name: string,
            image: string
        },
        voiceActor?: {
            id: string,
            name: string,
            image: string
        }
    }[]
    source?: string | undefined
    status?: string | undefined
    synonyms?: string[],
    studios?: string[]
    title: { english?: string, native: string, romaji: string }
    type?: string | undefined
    episodesList?: { episodes: { ep: string, img?: string, title?: string }[], type: string, name?: string }[]
    player_ID?: string
    id: string
    isAdult?: boolean
    malID?: string
    trailer?: { id: string, site: string } | undefined
    relations?: {
        id: number,
        title: { english?: string, native: string, romaji: string }
        bannerImage?: string
        coverImage: string
        relationType: string
    }[]
    recommendations?: {
        id: number,
        title: { english?: string, native: string, romaji: string }
        bannerImage?: string
        coverImage: string
    }[]
}
```

```typescript
interface episodeList { 
    player_id: string, 
    episodesData: { 
        episodes: { ep: string, img?: string, title?: string }[],
        type: string, 
        name?: string 
    }[] 
}
```

```typescript
interface playerData {
    hostname: string
    resolution: resolutionFormat[]
    dubResolution?: resolutionFormat[]
    splitHLS?: boolean
    defaultHost?: boolean
    storyboardVTT?: string
    listChapters?: playerChapterList[]
    subtitles?: playerSubtitlesFormat[]
    external?: externalPlayerFormat
    extractResolution?: (playerData: playerDataExtended) => Promise<playerData | undefined>
    isDubbing?: (playerData: playerDataExtended) => Promise<resolutionFormat[] | undefined>
}
```

```typescript
type playerDataExtended = playerData & {
    episode: {
        currentEpisode: string
        episodeList: string[]
        anime: AnimeData
        animeID: string
        type: string
    }
}
```

```typescript
interface resolutionFormat {
    res: string,
    url: string,
    hls?: boolean
    reqHeader?: { [key: string]: string },
    doNotUseBackend?: boolean
    defaultSubtitles?: boolean;
}
```

```typescript
type playerChapterList = { 
    start: number, 
    end: number, 
    type: "opening" | "ending" | "other", 
    name?: string 
}
```

```typescript
interface playerSubtitlesFormat { 
    url: string, 
    lang: string, 
    label: string, 
    format: string 
}
```

```typescript
interface externalPlayerFormat {
    chaptersUrl: string
}
```

```typescript
interface genresSearchFormat { 
    genres?: string[], 
    years?: string, 
    seasons?: string, 
    format?: string[], 
    airing?: string 
}
```

```typescript
interface cardData {
    AnimeData: AnimeData
    saveData?: indentityPlayer
    onClick?: (data: AnimeData) => void
}
```

```typescript
interface indentityPlayer {
    pluginName: string
    last_Time: number
    episode: string
    type: string
    isStarted?: boolean
}
```