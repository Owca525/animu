import Button from "@renderer/components/ui/button"
import Checkbox from "@renderer/components/ui/checkbox"
import { JSX } from "react"
import { closeDialog } from "./context/DialogContext"

export function calculateZoomLevel(percentage: number): number {
    if (isNaN(percentage)) return 0
    if (percentage < 50 || percentage > 200) return 0
    return Math.log(percentage / 100) / Math.log(1.2)
}
// function calculateZoomPercantage(level: number): number {
//   return Math.floor(Math.pow(1.2, level) * 100)
// }

export function createDeleteDialog(animeName: string, type: string): JSX.Element {
    return (
        <>
            <div className="dialog-Header">Do you want delete this anime from {type}</div>
            <div className="dialog-text">Anime: {animeName}</div>
            <div className="dialog-buttons-container">
                <Checkbox
                    title="Always ask"
                    classContainer="dialog-History-del "
                />
                <Button value="Yes" className="dialog-button"/>
                <Button value="No" className="dialog-button" onClick={closeDialog}/>
            </div>
        </>
    )
}