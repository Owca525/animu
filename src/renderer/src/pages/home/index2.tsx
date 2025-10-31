import Button from "@renderer/components/buttons";
import { getGlobalCache } from "@renderer/utils/stores/global";
import { useNavigate } from "@solidjs/router";

export default function Home() {
    const navigate = useNavigate();

    return <>
        <Button content="Settings" onClick={() => navigate("/settings")} />
        <Button content="Information" onClick={() => {
            const his = JSON.parse(JSON.stringify(getGlobalCache()))
            navigate("/info", {
                state: { anime: his.history.continue[0].AnimeData, saveData: his.history.continue[0].saveData },
            })
        }} />
    </>
}