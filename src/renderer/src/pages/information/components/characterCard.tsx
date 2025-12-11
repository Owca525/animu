import "./css/characterCard.css"

interface characterCardsProps {
    id: string,
    name: string,
    image: string,
    role: string,
    onClick?: () => void
}

export default function CharacterCards(props: characterCardsProps) {
    return (
        <div class="information-characters-card" onClick={props.onClick}>
            <img class="information-characters-card-cover" src={props.image}></img>
            <div class="information-characters-card-description">
                <span class="information-character-name">{props.name}</span>
                <span class="information-character-role">{props.role}</span>
            </div>
        </div>
    );
}