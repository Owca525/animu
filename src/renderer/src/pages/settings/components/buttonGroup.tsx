import "./css/buttonGroup.css"

interface ButtonGroupProps {
    selectedValue: string,
    listValues: { value: string, onClick: () => void }[]
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ listValues, selectedValue }) => {
  return (
    <div className="button-group-container">
        {listValues.map((element) => (
            <div className={`button-group-button ${element.value == selectedValue ? "active" : ""}`} onClick={element.onClick}>{element.value}</div>
        ))}
    </div>
  )
}

export default ButtonGroup
