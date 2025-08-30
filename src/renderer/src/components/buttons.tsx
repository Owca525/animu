import "./css/buttons.css"

interface ButtonProps {
    icon?: string
    iconClassName?: string
    content?: string
    ButtonClass?: string
    onClick?: (event: any) => void
    titleButton?: string
}

const Button: React.FC<ButtonProps> = ({ icon, ButtonClass, onClick, content, iconClassName, titleButton }) => {
  return (
    <button tabIndex={-1} className={"button " + ButtonClass} onClick={onClick} title={titleButton ? titleButton : ""}>
        {icon && <span className={"material-symbols-outlined " + iconClassName}>{icon}</span>} {content}
    </button>
  )
}

export default Button
