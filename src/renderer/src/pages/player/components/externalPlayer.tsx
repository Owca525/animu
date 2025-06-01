// import Button from "@renderer/components/ui/button"

// import "../../css/pages/player.css"
// import Drop from "@renderer/components/ui/drop"

// const ExternalPlayer = () => {

//     function makeButtons(episode: number[]) {
//         return (
//           <div className='information-buttons-episode-container'>
//             {episode.map((num) => (
//               <div className='information-episode-button'>{num}</div>
//             ))}
//           </div>
//         )
//       }

//     return (
//         <div className="external-container">
//             <div className="external-title">Episode 8 of Oshi No ko</div>
//             <div className="external-player-container">
//                 <Button value='skip_previous' className="material-symbols-outlined player-buttons" />
//                 <Button value='replay' className="material-symbols-outlined player-buttons" />
//                 <Button value='skip_next' className="material-symbols-outlined player-buttons" />
//             </div>
//             <Drop content={makeButtons([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,])} LeftHeader={"Episodes"} RightHeader={""} />
//         </div>
//     )
// }

// export default ExternalPlayer