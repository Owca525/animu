
import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import {
    AnimeData,
    cardData,
    episodeList,
    episodeMetadata,
    FilterPluginsParams,
    playerData,
    playerPluginFormat,
    resolutionFormat,
    serverStatusData
} from "@renderer/utils/types";

const BASES = ["https://animefire.plus", "https://animefire.io"];

function headersFor(base: string, referer?: string) {
    return {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.5",
        "Referer": referer || (base + "/"),
        "Origin": base,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    };
}

function fixEncoding(s: string): string {
    if (!/[ÃÂ][\u0080-\u00BF\u00A0-\u00FF]/.test(s)) return s;
    try { return decodeURIComponent(escape(s)); } catch { return s; }
}

function clean(s: string): string {
    return fixEncoding(s)
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ")
        .replace(/&#8211;|&#8212;/g, "-")
        .replace(/\u2013|\u2014/g, "-")
        .replace(/\s+/g, " ")
        .trim();
}

function slugifyQuery(q: string): string {
    return q
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, " ")
        .trim()
        .replace(/\s+/g, "-");
}

function normalizeSeriesKey(s: string): string {
    return clean(s)
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\btodos\s+os\s+episodios\b/gi, " ")
        .replace(/\bepisodios\b/gi, " ")
        .replace(/\b(?:dublado|dub|legendado|leg|sub)\b/gi, " ")
        .replace(/[()\[\]{}:;,.!?'"–—_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function titleScore(query: string, candidate: string): number {
    const q = normalizeSeriesKey(query);
    const c = normalizeSeriesKey(candidate);
    if (!q || !c) return 0;
    if (c === q) return 3;
    const qWords = q.split(/\s+/).filter(w => w.length > 1);
    const cWords = c.split(/\s+/).filter(w => w.length > 1);
    if (c.startsWith(q)) return 2 - Math.min(0.75, Math.max(0, cWords.length - qWords.length) * 0.12);
    if (c.includes(q)) return 1.2 - Math.min(0.5, Math.max(0, cWords.length - qWords.length) * 0.08);
    const words = qWords;
    if (!words.length) return 0;
    return words.filter(w => cWords.includes(w)).length / words.length
        - Math.min(0.35, Math.max(0, cWords.length - words.length) * 0.04);
}

function safeParse(t: string): any | null {
    try { return JSON.parse(t); } catch { return null; }
}

interface AFOpts { asJson?: boolean; referer?: string; }
interface AFResp { base: string; text?: string; json?: any; }

let _workingBase: string | null = null;

async function requestAF(path: string, opts: AFOpts = {}): Promise<AFResp | null> {
    const bases = _workingBase ? [_workingBase, ...BASES.filter(b => b !== _workingBase)] : BASES;

    for (const base of bases) {
        try {
            const referer = opts.referer
                ? opts.referer.replace(/^https?:\/\/[^/]+/i, base)
                : undefined;
            const headers: Record<string, string> = { ...headersFor(base, referer) };
            if (opts.asJson) {
                headers["Accept"] = "application/json, text/plain, */*";
                headers["X-Requested-With"] = "XMLHttpRequest";
            }
            const resp = await request(`${base}${path}`, { headers });
            if (!resp.success) continue;

            if (resp.text && /Attention Required!\s*\|\s*Cloudflare|cf-error-details|Just a moment/i.test(resp.text)) {
                continue;
            }

            _workingBase = base;

            let json = resp.json;
            if (opts.asJson && !json && resp.text) json = safeParse(resp.text);
            return { base, text: resp.text, json };
        } catch {
            continue;
        }
    }
    return null;
}

interface FireAnime { slug: string; title: string; cover?: string; isDub: boolean; }
interface FireVariants { sub?: string; dub?: string; }

async function searchAnimes(query: string, page: number): Promise<FireAnime[]> {
    const slug = slugifyQuery(query);
    if (!slug) return [];

    const paths = page > 1
        ? [`/pesquisar/${slug}/${page}`]
        : [`/pesquisar/${slug}/1`, `/pesquisar/${slug}`];

    let html = "";
    for (const p of paths) {
        const r = await requestAF(p);
        if (r?.text && /\/animes\//.test(r.text)) { html = r.text; break; }
    }
    if (!html) return [];

    const results: FireAnime[] = [];
    const seen = new Set<string>();
    const anchorRe = /<a\s+[^>]*href="(?:https?:\/\/[^/"]+)?\/animes\/([^/"?#]+)"[^>]*>/gi;

    for (const m of html.matchAll(anchorRe)) {
        const animeSlug = m[1];
        if (seen.has(animeSlug)) continue;
        if (/^(generos?|categorias?|tops?|lista)/i.test(animeSlug)) continue;

        const pos = m.index ?? 0;
        const ctx = html.slice(pos, Math.min(html.length, pos + 1200));

        let title = "";
        const titleAttr = m[0].match(/title="([^"]+)"/i);
        if (titleAttr) title = clean(titleAttr[1]);
        if (!title) {
            const h3 = ctx.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
            if (h3) title = clean(h3[1]);
        }
        if (!title) {
            const alt = ctx.match(/<img[^>]*alt="([^"]+)"/i);
            if (alt) title = clean(alt[1]);
        }
        if (!title || title.length < 2) continue;

        let cover: string | undefined;
        const img = ctx.match(/<img[^>]*(?:data-src|src)="(https?:\/\/[^"]+)"/i);
        if (img) cover = img[1];

        const cleanTitle = title.replace(/\s*[-–]?\s*Todos\s+os\s+Epis[^\s]*/gi, "").trim();
        if (titleScore(query, cleanTitle) < 0.1) continue;

        seen.add(animeSlug);
        results.push({
            slug: animeSlug,
            title: cleanTitle,
            cover,
            isDub: /dublado/i.test(animeSlug) || /dublado/i.test(title),
        });
    }

    return results.sort((a, b) => titleScore(query, b.title) - titleScore(query, a.title));
}

function epSlugOf(animeSlug: string): string {
    return animeSlug.replace(/-todos-os-episodios$/i, "");
}

async function fetchEpisodes(animeSlug: string): Promise<number[]> {
    try {
        const r = await requestAF(`/animes/${animeSlug}`);
        if (!r?.text) return [];
        const html = r.text;

        const base = epSlugOf(animeSlug);
        const nums = new Set<number>();

        const exactRe = new RegExp(
            `href="(?:https?:\\/\\/[^/"]+)?\\/animes\\/${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/(\\d+)"`,
            "gi"
        );
        for (const m of html.matchAll(exactRe)) {
            const n = parseInt(m[1]);
            if (n > 0) nums.add(n);
        }

        if (nums.size === 0) {
            const counts: Record<string, Set<number>> = {};
            for (const m of html.matchAll(/href="(?:https?:\/\/[^/"]+)?\/animes\/([^/"?#]+)\/(\d+)"/gi)) {
                const s = m[1]; const n = parseInt(m[2]);
                if (n <= 0) continue;
                (counts[s] ??= new Set()).add(n);
            }
            const top = Object.keys(counts).sort((a, b) => counts[b].size - counts[a].size)[0];
            if (top) for (const n of counts[top]) nums.add(n);
        }

        return [...nums].sort((a, b) => a - b);
    } catch (e) {
        console.error("AnimeFire/fetchEpisodes", e);
        return [];
    }
}

async function findRelatedVariants(animeSlug: string): Promise<FireVariants> {
    const baseKey = normalizeSeriesKey(animeSlug.replace(/-todos-os-episodios$/i, ""));
    const variants: FireVariants = {};
    if (!baseKey) return variants;

    try {
        const results = await searchAnimes(baseKey, 1);
        for (const item of results) {
            if (normalizeSeriesKey(item.title) !== baseKey) continue;
            const type: keyof FireVariants = item.isDub ? "dub" : "sub";
            if (!variants[type] || item.slug === animeSlug) variants[type] = item.slug;
        }
    } catch (e) {
        console.warn("AnimeFire/findRelatedVariants", e);
    }

    return variants;
}

function isDirectVideo(u: string): boolean {
    return /\.(mp4|m3u8|webm|mpd)(\?|$)/i.test(u);
}

function isBloggerToken(u: string): boolean {
    return /(?:^|\/\/)(?:www\.)?blogger\.com\/video\.g\?token=/i.test(u);
}

async function resolveBlogger(url: string): Promise<resolutionFormat[]> {
    try {
        const r = await request(url, {
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Referer": "https://www.blogger.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            },
        });
        if (!r.success) return [];
        let json: any = r.json;
        if (!json && r.text) {
            const t = r.text.replace(/^[^{[]+/, "");
            try { json = JSON.parse(t); } catch { json = null; }
        }
        if (!json || !Array.isArray(json.streams)) return [];
        const out: resolutionFormat[] = [];
        const fmtRes: Record<number, string> = { 37: "FHD", 22: "HD", 18: "SD", 35: "HD", 34: "SD" };
        for (const s of json.streams) {
            const u = String(s?.play_url || "");
            if (!u) continue;
            const res = fmtRes[Number(s.format_id)] || "HD";
            out.push({ res: res as any, url: u, hls: false });
        }
        const order: Record<string, number> = { FHD: 0, HD: 1, SD: 2 };
        out.sort((a, b) => (order[a.res] ?? 9) - (order[b.res] ?? 9));
        return out;
    } catch (e) {
        console.warn("AnimeFire/resolveBlogger", e);
        return [];
    }
}

async function resolveHtmlWrapper(url: string, referer: string): Promise<resolutionFormat[]> {
    try {
        const r = await request(url, {
            headers: {
                "Accept": "text/html,application/xhtml+xml",
                "Referer": referer,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            },
        });
        if (!r.success || !r.text) return [];
        const out: resolutionFormat[] = [];
        const seen = new Set<string>();
        for (const m of r.text.matchAll(/["'](https?:\/\/[^"'<>\s]+\.(?:mp4|m3u8)[^"'<>\s]*)["']/gi)) {
            const u = m[1].replace(/&amp;/g, "&");
            if (seen.has(u)) continue;
            seen.add(u);
            const lbl = /\/fhd\/|1080/.test(u) ? "FHD" : /\/hd\/|720/.test(u) ? "HD" : "SD";
            out.push({ res: lbl as any, url: u, hls: /\.m3u8/i.test(u) });
        }
        return out;
    } catch { return []; }
}

function labelToRes(label: string): string {
    const l = (label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (l.includes("fhd") || l.includes("fullhd") || l.includes("1080")) return "FHD";
    if (l.includes("hd") || l.includes("720")) return "HD";
    return "SD";
}

async function fetchVideos(animeSlug: string, epNum: number): Promise<resolutionFormat[]> {
    const base = epSlugOf(animeSlug);
    const results: resolutionFormat[] = [];
    const seen = new Set<string>();
    const pushSrc = (src: string, label: string) => {
        if (!src || seen.has(src)) return;
        seen.add(src);
        results.push({ res: labelToRes(label), url: src, hls: /\.m3u8/i.test(src) });
    };

    const epPagePath = `/animes/${base}/${epNum}`;
    const apiPath = `/video/${base}/${epNum}`;

    try {
        const r = await requestAF(apiPath, { asJson: true, referer: epPagePath });
        const json = r?.json;
        if (json) {
            if (Array.isArray(json.data)) {
                for (const v of json.data) if (v?.src) pushSrc(String(v.src), String(v.label ?? ""));
            }
            if (!results.length && typeof json.token === "string" && /^https?:/.test(json.token)) {
                pushSrc(json.token, "HD");
            }
        }
    } catch (e) {
        console.warn("AnimeFire/fetchVideos API", e);
    }

    if (results.length && results.every(r => !isDirectVideo(r.url))) {
        const resolved: resolutionFormat[] = [];
        for (const r of results) {
            if (isBloggerToken(r.url)) {
                const streams = await resolveBlogger(r.url);
                for (const s of streams) {
                    if (!seen.has(s.url)) { seen.add(s.url); resolved.push(s); }
                }
            } else if (!isDirectVideo(r.url)) {
                const streams = await resolveHtmlWrapper(r.url, `${_workingBase || BASES[0]}${epPagePath}`);
                for (const s of streams) {
                    if (!seen.has(s.url)) { seen.add(s.url); resolved.push(s); }
                }
            } else {
                resolved.push(r);
            }
        }
        if (resolved.length) {
            results.length = 0;
            results.push(...resolved);
        }
    }

    if (results.length) return results;

    try {
        const r = await requestAF(epPagePath);
        if (!r?.text) return results;
        const html = r.text;

        const dvs = html.match(/data-video-src="([^"]+)"/i);
        if (dvs) {
            const epUrl = clean(dvs[1]).replace(/&amp;/g, "&");
            const path = epUrl.replace(/^https?:\/\/[^/]+/, "");
            const r2 = await requestAF(path, { asJson: true, referer: epPagePath });
            const json2 = r2?.json;
            if (json2 && Array.isArray(json2.data)) {
                for (const v of json2.data) if (v?.src) pushSrc(String(v.src), String(v.label ?? ""));
            }
        }

        for (const m of html.matchAll(/["'](https?:\/\/[^"'<>\s]+\.(?:mp4|m3u8)[^"'<>\s]*)["']/gi)) {
            const u = m[1].replace(/&amp;/g, "&");
            const lbl = /\/fhd\/|1080/.test(u) ? "F-HD" : /\/hd\/|720/.test(u) ? "HD" : "SD";
            pushSrc(u, lbl);
        }

        const iframe = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/i);
        if (iframe && !results.length) {
            pushSrc(iframe[1], "HD");
        }
    } catch (e) {
        console.error("AnimeFire/fetchVideos fallback", e);
    }

    return results;
}

export default class AnimeFire implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.2",
        name: "AnimeFire",
        author: "PT-BR",
        icon: "https://animefire.plus/img/favicon.ico",
        supportLang: ["pt-br", "pt"],
        urlWebsite: BASES[0],
        type: "player",
    };

    private _epCache: Record<string, number[]> = {};
    private _variantCache: Record<string, FireVariants> = {};

    private getEpisodes = async (animeSlug: string): Promise<number[]> => {
        if (!this._epCache[animeSlug] || this._epCache[animeSlug].length === 0) {
            this._epCache[animeSlug] = await fetchEpisodes(animeSlug);
        }
        return this._epCache[animeSlug];
    };

    private getVariants = async (animeSlug: string): Promise<FireVariants> => {
        if (!this._variantCache[animeSlug]) {
            const currentType: keyof FireVariants = /dublado/i.test(animeSlug) ? "dub" : "sub";
            this._variantCache[animeSlug] = {
                ...(await findRelatedVariants(animeSlug)),
                [currentType]: animeSlug,
            };
        }
        return this._variantCache[animeSlug];
    };

    private resolveSlugForType = async (animeSlug: string, type?: string): Promise<string> => {
        if (type !== "dub" && type !== "sub") return animeSlug;
        const variants = await this.getVariants(animeSlug);
        return variants[type] || animeSlug;
    };

    private normSlug(id: string): string {
        return id.replace(/^https?:\/\/[^/]+\/animes\//, "").replace(/^\/?animes\//, "").replace(/\/$/, "");
    }

    extractPlayerData = async (
        _type: string,
        episode: episodeMetadata,
        id: string
    ): Promise<playerData[]> => {
        try {
            const epNum = parseInt(typeof episode === "object" ? (episode as any).ep : episode);
            if (isNaN(epNum)) return [];
            const animeSlug = await this.resolveSlugForType(this.normSlug(id), _type);
            const resolution = await fetchVideos(animeSlug, epNum);
            if (!resolution.length) return [];
            return [{ hostname: "AnimeFire", defaultHost: true, resolution }];
        } catch (e) {
            console.error("AnimeFire/extractPlayerData", e);
            return [];
        }
    };

    extractEpisodeList = async (
        animeData?: AnimeData,
        anime_id?: string
    ): Promise<episodeList | undefined> => {
        try {
            let animeSlug: string | undefined;
            if (anime_id) {
                animeSlug = this.normSlug(anime_id);
            } else if (animeData) {
                const titleToSearch = animeData.title?.romaji || animeData.title?.english || "";
                if (!titleToSearch) return undefined;
                const cards = await this.searchAnime(titleToSearch, 1);
                if (!cards.length) return undefined;
                const animeCards = cards.map(c => c.AnimeData);
                const matched = SheepFinderAnime2000(animeCards, animeData);
                animeSlug = matched || cards[0]?.AnimeData?.player_ID || undefined;
            }
            if (!animeSlug) return undefined;

            const nums = await this.getEpisodes(animeSlug);
            if (!nums.length) return undefined;

            const variants = await this.getVariants(animeSlug);
            const episodesData: episodeList["episodesData"] = [];

            const addEpisodes = async (type: "sub" | "dub", variantSlug?: string) => {
                if (!variantSlug) return;
                const list = await this.getEpisodes(variantSlug);
                if (!list.length) return;
                episodesData.push({
                    type,
                    name: type === "dub" ? "Dublado PT-BR" : "Legendado PT-BR",
                    episodes: list.map(n => ({ ep: n.toString() })),
                });
            };

            await addEpisodes("sub", variants.sub);
            await addEpisodes("dub", variants.dub);

            if (!episodesData.length) {
                const type: "dub" | "sub" = /dublado/i.test(animeSlug) ? "dub" : "sub";
                episodesData.push({
                    type,
                    name: type === "dub" ? "Dublado PT-BR" : "Legendado PT-BR",
                    episodes: nums.map(n => ({ ep: n.toString() })),
                });
            }

            return {
                player_id: animeSlug,
                episodesData,
            };
        } catch (e) {
            console.error("AnimeFire/extractEpisodeList", e);
            return undefined;
        }
    };

    extractOnlyEpisodesList = async (
        _type: string,
        anime_id: string
    ): Promise<episodeMetadata[]> => {
        const data = await this.extractEpisodeList(undefined, anime_id);
        return data?.episodesData.find(v => v.type === _type)?.episodes ?? data?.episodesData[0]?.episodes ?? [];
    };

    searchAnime = async (
        name: string,
        page: number,
        _params?: FilterPluginsParams
    ): Promise<cardData[]> => {
        try {
            const results = await searchAnimes(name, Math.max(1, page || 1));
            return results.map(a => ({
                AnimeData: {
                    title: { romaji: a.title, native: a.title, english: a.title },
                    id: "",
                    player_ID: a.slug,
                    coverImage: a.cover,
                    type: "ANIME",
                },
            }));
        } catch (e) {
            console.error("AnimeFire/searchAnime", e);
            return [];
        }
    };

    raportStatus = async () => {
        const w = async (fn: () => Promise<unknown>): Promise<serverStatusData> => {
            try {
                const t = performance.now();
                const r = await fn();
                return { time: performance.now() - t, work: Array.isArray(r) ? r.length > 0 : !!r };
            } catch {
                return { time: 0, work: false };
            }
        };
        const t0 = performance.now();
        const cards = await this.searchAnime("Naruto", 1);
        const search: serverStatusData = { time: performance.now() - t0, work: cards.length > 0 };
        const firstSlug = cards[0]?.AnimeData?.player_ID ?? "naruto-dublado-todos-os-episodios";
        const [episodes, player] = await Promise.all([
            w(() => this.extractOnlyEpisodesList("dub", firstSlug)),
            w(() => this.extractPlayerData("dub", { ep: "1" }, firstSlug)),
        ]);
        return { search, episodes, player };
    };
}
