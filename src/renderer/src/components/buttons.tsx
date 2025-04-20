import "./css/buttons.css"

interface ButtonProps {
    icon?: string
    content?: string
    ButtonClass?: string
    onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({ icon, ButtonClass, onClick, content }) => {
  return (
    <button className={"button " + ButtonClass} onClick={onClick}>
        {icon && <span className="material-symbols-outlined">{icon}</span>} {content}
    </button>
  )
}

export default Button
