import { FC, useState } from 'react'
import '../../css/ui/checkbox.css'
import HelpIcon from '../../pages/settings/helpIcon'

interface checkboxProps extends React.HtmlHTMLAttributes<HTMLInputElement> {
  title: string
  classContainer?: string
  classCheckbox?: string
  checked?: boolean
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void
  ref?: any
  helpDescription?: string
}

const Checkbox: FC<checkboxProps> = ({
  title,
  classContainer,
  classCheckbox,
  checked = false,
  onClick,
  ref,
  helpDescription,
}) => {
  const [check, setCheck] = useState<boolean>(checked)
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!onClick) return

    onClick(e)
    setCheck(e.currentTarget.checked)
  }

  return (
    <div className={classContainer + ' checkbox-container'}>
      <div className="text-space">
        {title}
        {helpDescription && <HelpIcon description={helpDescription} />}
      </div>
      <input
        type="checkbox"
        className={classCheckbox + ' checkbox'}
        checked={check}
        onClick={handleClick}
        ref={ref}
      />
    </div>
  )
}

export default Checkbox
