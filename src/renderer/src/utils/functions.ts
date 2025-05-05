export function decodeHtmlEntities(str: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.documentElement.textContent;
}

export function convertDateToFormattedString(year: number | undefined, month: number | undefined, hour: number | undefined, minute: number | undefined, day: number | undefined) {
    if (year == undefined) year = 0
    if (month == undefined) month = 0
    if (hour == undefined) hour = 0
    if (minute == undefined) minute = 0
    if (day == undefined) day = 0
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(year, month, day, hour, minute));
}

export function capitalizeFirstLetter(text: string) {
    if (text.length === 0) return '';
    if (text.length <= 2) return text.toUpperCase()
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function convertSeconds(totalSeconds: number | undefined) {
    if (!totalSeconds) return
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
}