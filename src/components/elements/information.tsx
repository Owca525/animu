import { useEffect, useRef, useState } from "react";
import { InformationProps, InformationData } from "../../utils/interface";
import { get_information } from "../../utils/backend";
import "../../css/elements/information.css";
import { useNavigate } from "react-router-dom";

export const Information: React.FC<InformationProps> = ({ id_anime, showPopup, toggle, }) => {
  const modalRef: any = useRef();
  const [data, setData] = useState<InformationData>({ id: "", title: "", description: "", img: "", episodes: [] });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchData = async () => {
    const anime_data = await get_information(id_anime);
    console.log(anime_data)
    setData(anime_data);
    setLoading(false);
  };

  const handleClickOutside = (event: any) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      toggle();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape") {
        toggle();
      }
    };

    if (showPopup) {
      document.addEventListener("keydown", handleKeyDown);
    } else document.removeEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPopup]);

  useEffect(() => {
    if (showPopup) {
      document.addEventListener("click", handleClickOutside);
      fetchData();
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showPopup]);

  // Loading animation
  if (loading) {
    return (
      <div className="modal-backdrop" style={{ visibility: showPopup ? "visible" : "hidden" }}>
      <div className="box" ref={modalRef}>
        <div className="box-img" style={{width: "200px", height: "290px", display: "flex", justifyContent: "center", alignItems: "center"}}>
          <div className="animation material-symbols-outlined" style={{animation: "spin 1s linear infinite"}}>
            progress_activity
          </div>
        </div>
        <div className="box-info">
          <div className="box-text" style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <div className="description material-symbols-outlined" style={{animation: "spin 1s linear infinite"}}>progress_activity</div>
          </div>
          <div className="box-episode">
            <div className="text-episode">Availble Episodes:</div>
            <div className="box-episodes material-symbols-outlined" style={{display: "flex", justifyContent: "center", animation: "spin 1s linear infinite"}}>
              progress_activity
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="modal-backdrop" style={{ visibility: showPopup ? "visible" : "hidden" }}>
      <div className="box" ref={modalRef}>
        <div className="box-img">
          <img src={data.img} />
        </div>
        <div className="box-info">
          <div className="box-text">
            <div className="header-text">{data.title}</div>
            <div className="description" dangerouslySetInnerHTML={{ __html: data.description }}></div>
          </div>
          <div className="box-episode">
            <div className="text-episode">Availble Episodes:</div>
            <div className="box-episodes">
              {data.episodes.length > 0 ? (
                data.episodes.map((ep) => <div className="episode" onClick={() => navigate("/player", {state: { id: data.id, title: data.title, episodes: data.episodes, ep: ep }})}>{ep}</div>)
              ) : (
                <div className="no-data-message">No Episodes</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
