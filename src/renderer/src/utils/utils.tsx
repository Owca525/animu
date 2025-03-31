import Button from "@renderer/components/ui/button"
import Checkbox from "@renderer/components/ui/checkbox"
import { JSX } from "react"
import { closeDialog } from "./context/DialogContext"
import { readConfig, saveOneConfig } from "./filesMange/config"

export function calculateZoomLevel(percentage: number): number {
    if (isNaN(percentage)) return 0
    if (percentage < 50 || percentage > 200) return 0
    return Math.log(percentage / 100) / Math.log(1.2)
}
// function calculateZoomPercantage(level: number): number {
//   return Math.floor(Math.pow(1.2, level) * 100)
// }

export async function createDeleteDialog(animeName: string, type: string, func: any): Promise<JSX.Element> {
    return (
        <>
            <div className="dialog-Header">Do you want delete this anime from {type}</div>
            <div className="dialog-text">Anime: {animeName}</div>
            <div className="dialog-buttons-container">
                <Checkbox
                    title="Always ask"
                    classContainer="dialog-History-del "
                    checked={(await readConfig()).History.history.AlwaysAsk}
                    onClick={(event) => {
                        saveOneConfig("History.history.AlwaysAsk", event.currentTarget.checked)
                    }}
                />
                <Button value="Yes" className="dialog-button" onClick={() => {func(); closeDialog()}}/>
                <Button value="No" className="dialog-button" onClick={closeDialog}/>
            </div>
        </>
    )
}