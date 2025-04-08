import React from 'react'
import Card from '../../components/ui/card'
import { contentData } from '../../utils/interface'
import '../../css/elements/card-content.css'
import { useTranslation } from 'react-i18next'

export interface ContainerProps {
  data: contentData[],
}

const content: React.FC<ContainerProps> = ({ data }) => {
  const { t } = useTranslation()

  return (
    <div className="content-container home-content">
      {data.map((value) => (
        <>
          <div className="content-title">{value.title}</div>
          <div className={value.horizont ? "content" : ""}>
            <div className={'card-content-container ' + (value.horizont ? "card-content-container-horizont" : "")}>
              {value.Cards && value.Cards.length > 0 ? (
                value.Cards.map((card) => (
                  <Card
                    AnimeID={card.AnimeID ? card.AnimeID : ''}
                    data={card.data}
                    player={card.player}
                    BottomText={card.BottomText}
                    deletion={card.deletion}
                  />
                ))
              ) : (
                <div className="no-data-message">{t('errors.emptyMessage')}</div>
              )}
            </div>
          </div>
        </>
      ))}
    </div>
  )
}

export default content
