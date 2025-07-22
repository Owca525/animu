import Dropdown from "@renderer/components/dropDown"
import "./css/Filter.css"
import Button from "@renderer/components/buttons"
import { useEffect, useRef, useState } from "react"
import { t } from "i18next"
import { FilterParams, homeData } from "@renderer/utils/GlobalInterface"
import { useSelector } from "react-redux"

const Filter: React.FC<{ onChange: (params?: FilterParams, removeParam?: string) => void, filter: { genres: string[], years: string[], seasons: string[], format: string[], airing: string[] } }> = ({ onChange, filter }) => {
    const [showFilter, setShowFilter] = useState<boolean>(false)
    const homeCache: homeData = useSelector((cache: any) => cache.home);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        let data = event.target as HTMLElement
        if (data.classList.contains("home-filter-button")) return
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setShowFilter(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    return (
        <>
            <Button ButtonClass="home-filter-button" icon="tune" onClick={() => setShowFilter((prev) => !prev)} />
            {showFilter &&
                <div className="home-filter-container" ref={containerRef}>
                    <div className="home-filter-space">
                        <div className="home-filter-title">{t("filter.genres")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "genres")} buttonText={homeCache.filterTags?.genres ? homeCache.filterTags.genres[0] : ""} options={filter.genres.map((element) => { return { label: element, onClick: (text) => onChange({ genres: [text] }) } })} placeholder={"Genres"} />
                    </div>
                    <div className="home-filter-space">
                        <div className="home-filter-title">{t("filter.year")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "years")} buttonText={homeCache.filterTags?.years ? homeCache.filterTags.years : ""} options={filter.years.map((element) => { return { label: element, onClick: (text) => onChange({ years: text }) } })} placeholder={"Years"} />
                    </div>
                    <div className="home-filter-space">
                        <div className="home-filter-title">{t("filter.season")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "seasons")} buttonText={homeCache.filterTags?.seasons ? homeCache.filterTags.seasons : ""} options={filter.years.map((element) => { return { label: element, onClick: (text) => onChange({ seasons: text }) } })} placeholder={"Season"} />
                    </div>
                    <div className="home-filter-space">
                        <div className="home-filter-title">{t("filter.format")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "format")} buttonText={homeCache.filterTags?.format ? homeCache.filterTags.format[0] : ""} options={filter.format.map((element) => { return { label: element, onClick: (text) => onChange({ format: [text] }) } })} placeholder={"Format"} />
                    </div>
                    <div className="home-filter-space">
                        <div className="home-filter-title">{t("filter.airing")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "airing")} buttonText={homeCache.filterTags?.airing ? homeCache.filterTags.airing : ""} options={filter.airing.map((element) => { return { label: element, onClick: (text) => onChange({ airing: text }) } })} placeholder={"Aring"} />
                    </div>
                </div>
            }
        </>
    )
}

export default Filter
