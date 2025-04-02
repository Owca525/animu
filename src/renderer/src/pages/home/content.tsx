import React from 'react'
import Card from '../../components/ui/card'
import { CardProps } from '../../utils/interface'
import '../../css/elements/card-content.css'
import { useTranslation } from 'react-i18next'

export interface ContainerProps {
  title: string
  data?: CardProps[]
  className?: string
  horizont?: boolean
}

const content: React.FC<ContainerProps> = ({ title, data = [], className = '', horizont = false }) => {
  const { t } = useTranslation()

  return (
    <div className={className + ' content-container'}>
      <div className="content-title">{title}</div>
      <div className={horizont ? "content" : ""}>
        <div className={'card-content-container ' + (horizont ? "card-content-container-horizont" : "") + (data.length > 0 ? '' : ' message-content')}>
          {data.length > 0 ? (
            data.map((card) => (
              <Card
                id={card.id}
                title={card.title}
                img={card.img}
                player={card.player}
                text={card.text}
                deletion={card.deletion}
              />
            ))
          ) : (
            <div className="no-data-message">{t('errors.emptyMessage')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default content
