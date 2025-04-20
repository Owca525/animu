import { useNavigate } from "react-router-dom"

function home() {
    const navigate = useNavigate()
    
    return (
        <main className="container">
            Animu
            <button onClick={() => navigate("/info")}>information</button>
        </main>
    )
}

export default home