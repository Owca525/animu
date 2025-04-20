import { ChangeEvent, FC } from 'react'
import HelpIcon from './helpIcon'

interface inputprops extends React.HtmlHTMLAttributes<HTMLInputElement> {
  title: string
  placeholder: string
  value: string | number
  char?: string
  type?: "text" | "number"
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  helpDescription?: string
}

const input: FC<inputprops> = ({ title, placeholder, value, onChange, char = "d", helpDescription, type = "text" }) => {
  return (
    <div className="same-space">
      <div className="text-space">
        {title}
        {helpDescription && <HelpIcon description={helpDescription} />}
      </div>
      <div className="settings-input-container">
        <input
          type={type}
          className="settings-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {char === "d" ? (
          <div className='settings-input-type settings-input-type-none' style={{ color: "rgb(0, 0, 0, 0.0)"}}>{char}</div>
        ) : (
          <div className='settings-input-type'>{char}</div>
        )}
      </div>
    </div>
  )
}

export default input
