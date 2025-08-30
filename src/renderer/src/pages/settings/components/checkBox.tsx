import "./css/checkBox.css"

interface checkBoxProps {
    onChecked?: (check: boolean) => void,
    checked?: boolean
}

const checkBox: React.FC<checkBoxProps> = ({ onChecked = () => {}, checked }) => {
  return <input tabIndex={-1} className="checkbox" type="checkbox" checked={checked} onChange={(event) => onChecked(event.target.checked)}/>
}

export default checkBox
