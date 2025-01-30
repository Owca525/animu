export function calculateZoomLevel(percentage: number): number {
    if (isNaN(percentage)) return 0
    if (percentage < 50 || percentage > 200) return 0
    return Math.log(percentage / 100) / Math.log(1.2)
}
// function calculateZoomPercantage(level: number): number {
//   return Math.floor(Math.pow(1.2, level) * 100)
// }