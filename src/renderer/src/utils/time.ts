export function convertMillisecondsToMinutes(milliseconds) {
    const seconds = milliseconds / 1000;
    const minutes = Math.floor(seconds / 60);
    return minutes;
}


export function convertDateToFormattedString(year: number | undefined, month: number | undefined, hour: number | undefined, minute: number | undefined, date: number | undefined) {
    if (year == undefined) year = 0
    if (month == undefined) month = 0
    if (hour == undefined) hour = 0
    if (minute == undefined) minute = 0
    if (date == undefined) date = 0
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(year, month, date, hour, minute));
}