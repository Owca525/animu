import { LoopReplace } from "./functions";

export interface Cue {
    start: number;
    end: number;
    text: string;
}

const headerASS = `[Script Info]
Title: Converted from VTT
ScriptType: v4.00+
Collisions: Normal
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,74,&H00FFEEED,&H00FFEEED,&H001F1F1F,&H00000000,0,0,0,0,95,100,0,0,1,3.5,0,2,150,150,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

function ConvertTimeToASSFormat(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);

    return `${h}:${m.toString().padStart(2, "0")}:${s.toString()
        .padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function TimerConverter(time = "", dot = ".") {
    try {
        const tmp = time.split(":")
        let [h, m, s] = ["00", "0", "0"];

        if (tmp.length == 3) {
            h = tmp[0]
            m = tmp[1]
            s = tmp[2]
        } else if (tmp.length == 2) {
            m = tmp[0]
            s = tmp[1]
        }

        const [sec, ms] = s.split(dot);

        return (
            parseInt(h) * 3600 +
            parseInt(m) * 60 +
            parseInt(sec) +
            parseInt(ms || "0") / 1000
        );
    } catch (error) {
        console.error("SubtitleConverter/TimerConverter", error)
        return 0
    }
}

function ExtractArrowTime(str: string) {
    const v1 = str.match(/(\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}\.\d{3})/)
    const v2 = str.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/)
    if (v1) return v1
    if (v2) return v2
    return
}

function HexToRGBASS(hex: string): string {
    hex = hex.replace("#", "");

    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");

    const r = hex.slice(0, 2);
    const g = hex.slice(2, 4);
    const b = hex.slice(4, 6);

    return `&H${b}${g}${r}&`;
}

class VTTConvert {
    public format = "vtt"
    private replacements = [
        [/<b>/gi, '{\\b1}'],
        [/<\/b>/gi, '{\\b0}'],

        [/<i>/gi, '{\\i1}'],
        [/<\/i>/gi, '{\\i0}'],

        [/<u>/gi, '{\\u1}'],
        [/<\/u>/gi, '{\\u0}'],
    ]

    public detect(str: string) {
        return str.trimStart().startsWith("WEBVTT")
    }

    public parser(vtt: string) {
        const lines = vtt.split(/\r?\n/);

        let cues: Cue[] = [];

        lines.forEach((value, index, array) => {
            const line = value.trim();
            const match = ExtractArrowTime(line);
            if (!match) return

            const start = TimerConverter(match[1]);
            const end = TimerConverter(match[2]);

            let text = "";
            index++;

            while (index < array.length && array[index].trim() !== "") {
                text += array[index].trim() + "\\N";
                index++;
            }

            text = text.replace(/\\N$/, "")

            cues.push({
                start,
                end,
                text: LoopReplace(text, this.replacements as any),
            });
        })

        return cues;
    }
}


class SRTConvert {
    public format = "srt"

    private replacements = [
        [/<b>/gi, '{\\b1}'],
        [/<\/b>/gi, '{\\b0}'],

        [/<i>/gi, '{\\i1}'],
        [/<\/i>/gi, '{\\i0}'],

        [/<u>/gi, '{\\u1}'],
        [/<\/u>/gi, '{\\u0}'],

        [/<\/font>/gi, '{\\r}']
    ]

    public detect(str: string) {
        return /^\s*\d+\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/m.test(str)
    }

    public parser(srt: string) {
        const blocks = srt
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim()
            .split(/\n{2,}/)

        const cues: Cue[] = []

        blocks.forEach((block) => {
            const lines = block
                .split("\n")
                .map(line => line.trim())
                .filter(Boolean)

            if (lines.length < 2) return

            const timeLineIndex = lines.findIndex(line => line.includes("-->"))

            if (timeLineIndex === -1) return

            const timeLine = lines[timeLineIndex]

            const match = timeLine.match(
                /^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
            )

            if (!match) return

            const start = TimerConverter(match[1], ",")
            const end = TimerConverter(match[2], ",")

            let text = lines
                .slice(timeLineIndex + 1)
                .join("\\N")
                .trim()

            text = text.replace(
                /<font\s+color=["']?(#[0-9a-f]{3,6})["']?\s*>/gi,
                (_, color) => `{\\c${HexToRGBASS(color)}}`
            )

            text = LoopReplace(
                text,
                this.replacements as any
            )

            cues.push({
                start,
                end,
                text
            })
        })

        return cues
    }
}

class TTMLonvert {
    public format = "ttml"

    public detect(str: string) {
        return str.trimStart().startsWith("<tt")
    }

    public parser(ttml: string) {
        let cues: Cue[] = [];
        const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;

        let match: RegExpExecArray | null;

        while ((match = pRegex.exec(ttml)) !== null) {
            const attrs = match[1];
            const rawText = match[2];

            const beginMatch = attrs.match(/begin="([^"]+)"/);
            const endMatch = attrs.match(/end="([^"]+)"/);

            if (!beginMatch || !endMatch) continue;

            const start = TimerConverter(beginMatch[1]);
            const end = TimerConverter(endMatch[1]);

            const text = this.CleanupText(rawText);

            cues.push({
                start,
                end,
                text,
            });
        }

        return cues;
    }

    private CleanupText(text: string) {
        text = text.replace(/<[^>]+>/g, "").trim()
        return text
            .replace(/<br\s*\/?>/gi, "\\N")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
    }
}

const converters = [new VTTConvert, new SRTConvert, new TTMLonvert]

export function DetectFormat(fileStr: string) {
    for (let index = 0; index < converters.length; index++) {
        const element = converters[index];

        if (element.detect(fileStr)) return element["format"]
        continue
    }
    console.error("SubtitleConverter/Unsuported Format", fileStr)
    return
}

export function CovnertToASS(fileStr: string) {
    /* IFDEF DEBUG */
    console.warn("SubtitleConverter/CovnertToASS", fileStr)
    /* ENDIF */
    const format = DetectFormat(fileStr)

    if (!format) return

    const converter = converters.find((v) => v.format == format)
    if (!converter) return

    const cueFormat = converter.parser(fileStr)

    const events = cueFormat.map((c) =>
        `Dialogue: 0,${ConvertTimeToASSFormat(c.start)},${ConvertTimeToASSFormat(c.end)},Default,,0,0,0,,${c.text}`
    ).join("\n");

    return headerASS + events;
}