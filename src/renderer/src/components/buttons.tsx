import "./css/buttons.css"

interface ButtonProps {
    icon?: string
    iconClassName?: string
    content?: string
    ButtonClass?: string
    onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({ icon, ButtonClass, onClick, content, iconClassName }) => {
  return (
    <button className={"button " + ButtonClass} onClick={onClick}>
        {icon && <span className={"material-symbols-outlined " + iconClassName}>{icon}</span>} {content}
    </button>
  )
}

export default Button
