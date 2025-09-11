import { formatTime } from '@renderer/utils/functions';
import React, { useEffect, useRef, useState } from 'react';

import "./css/seekBar.css"
import { Thumbnail } from '@renderer/utils/GlobalInterface';

interface SeekBarProps {
  maxValue: number | undefined;
  minValue?: number;
  currentValue: number | undefined;
  onSeek: (value: number) => void;
  type?: "value" | "float" | "time" | "procent"
  classes?: { container?: string, progress?: string, thumb?: string, box?: string }
  screen?: boolean
  secondBarValues?: { position: number, width: number }[]
  thumbnail?: Thumbnail
  chapterList?: { left: number, width: number, name?: string }[]
}

const SeekBar: React.FC<SeekBarProps> = ({
  maxValue,
  minValue = 0,
  currentValue,
  onSeek,
  type = "value",
  classes,
  screen = false,
  secondBarValues,
  thumbnail,
  chapterList
}) => {
  const [value, setValue] = useState(currentValue);
  const [drag, setdrage] = useState<boolean>(false);
  const [show, setshow] = useState<boolean>(false);

  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const seekBarProgress = useRef<HTMLDivElement | null>(null);
  const seekbarThumb = useRef<HTMLDivElement | null>(null);
  const seekbarBox = useRef<HTMLDivElement | null>(null);
  const seekbarThumbnail = useRef<HTMLImageElement | null>(null);
  const seekbarChapterText = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setValue(currentValue);
    updateSeekBar(value)
  }, [currentValue]);

  function updateSeekBar(val: number | undefined) {
    if (!seekBarProgress.current || !seekbarThumb.current || !seekbarBox.current) return;
    if (val === undefined || maxValue === undefined) return;

    const clampedVal = Math.max(minValue, Math.min(val, maxValue));
    const percent = ((clampedVal - minValue) / (maxValue - minValue)) * 100;
    seekBarProgress.current.style.width = `${percent}%`;
    seekbarThumb.current.style.left = `${percent}%`;
  }

  function setPosition(event: React.MouseEvent<HTMLDivElement> | MouseEvent) {
    if (!maxValue || !seekBarRef.current) return;

    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newValue = (offsetX / rect.width) * (maxValue - minValue) + minValue;

    if (newValue >= minValue && newValue <= maxValue) {
      setValue(newValue);
      onSeek(newValue);
      updateSeekBar(newValue);
    }
  }

  function setPositionBox(event: React.MouseEvent<HTMLDivElement> | MouseEvent) {
    if (!maxValue || !seekBarRef.current || !seekbarBox.current) {
      setshow(false);
      return;
    }

    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newValue = (offsetX / rect.width) * (maxValue - minValue) + minValue;

    if (newValue < minValue || newValue > maxValue) return;

    const percent = ((newValue - minValue) / (maxValue - minValue)) * 100;
    seekbarBox.current.style.left = `${percent}%`;
    setChapterBoxPosition(`${percent}%`, percent)

    if (screen) {
      if (percent > 98) {
        seekbarBox.current.style.left = `98%`
        setChapterBoxPosition(`98%`, percent)
      };
      if (percent < 1.5) {
        seekbarBox.current.style.left = `1.5%`
        setChapterBoxPosition(`1.5%`, percent)
      };
    }
    if (thumbnail) setThumbnailPosition(percent)
    if (type === "value") seekbarBox.current.innerHTML = newValue.toFixed(0);
    if (type === "float") seekbarBox.current.innerHTML = newValue.toFixed(1);
    if (type === "time") seekbarBox.current.innerHTML = formatTime(newValue);
    if (type === "procent") seekbarBox.current.innerHTML = `${newValue.toFixed(0)}%`
  }

  function setThumbnailPosition(percent: number) {
    if (!thumbnail) return
    if (!maxValue) return

    thumbnail.metadata.forEach((value) => {
      let startPercent = (value.start / maxValue) * 100
      let endPercent = (value.end / maxValue) * 100

      if (
        percent >= startPercent &&
        percent <= endPercent &&
        seekbarThumbnail.current
      ) {
        const thumb = seekbarThumbnail.current
        const container = thumb.parentElement
        if (!container) return

        thumb.style.backgroundPosition = `-${value.imgX}px -${value.imgY}px`

        const containerWidth = container.clientWidth
        const thumbWidth = thumb.offsetWidth
        let centerPx = (percent / 100) * containerWidth
        const halfThumb = thumbWidth / 2
        if (centerPx < halfThumb) centerPx = halfThumb
        if (centerPx > containerWidth - halfThumb) {
          centerPx = containerWidth - halfThumb
        }
        thumb.style.left = `${centerPx}px`
        setChapterBoxPosition(`${centerPx}px`, percent)
      }
    })
  }

  function setChapterBoxPosition(variable: string, percent: number) {
    if (!chapterList) return
    if (!seekbarChapterText.current) return
    for (let index = 0; index < chapterList.length; index++) {
      const element = chapterList[index];
      seekbarChapterText.current.innerHTML = ""
      seekbarChapterText.current.style.display = "none"
      if (percent >= element.left && percent <= (element.left + element.width) && element.name) {
        seekbarChapterText.current.style.left = variable
        seekbarChapterText.current.innerHTML = element.name
        seekbarChapterText.current.style.display = ""
        return
      }
    }
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement> | MouseEvent) {
    setPositionBox(event)
    if (drag) setPosition(event)
  };

  return (
    <div
      tabIndex={-1}
      ref={seekBarRef}
      className={`seekBar-container ${classes?.container}`}
      onClick={setPosition}
      onMouseDown={() => setdrage(() => true)}
      onMouseUp={() => setdrage(() => false)}
      onMouseLeave={() => { setdrage(() => false); setshow(false) }}
      onMouseEnter={() => setshow(() => true)}
      onMouseMove={handleMouseMove}
    >
      {/* {secondBarValue && <div className="seekbar-progress-second" style={{ width: `${secondBarValue}%` }} />} */}
      {secondBarValues &&
        <div className="seekbar-buffer-wrapper">
          {secondBarValues.map((buffer) => <div className="seekbar-buffer" style={{ left: `${buffer.position}%`, width: `${buffer.width}%` }}></div>)}
        </div>
      }
      {chapterList && chapterList.length > 0 &&
        <div className="seekbar-chapters-wrapper">
          {chapterList.map((buffer) => <div className="seekbar-chapters" style={{ left: `${buffer.left}%`, width: `${buffer.width}%` }}></div>)}
        </div>
      }

      <div
        tabIndex={-1}
        ref={seekBarProgress}
        className={`seekbar-progress ${classes?.progress}`}
      />
      <div
        tabIndex={-1}
        ref={seekbarThumb}
        className={`seekbar-thumb ${classes?.thumb}`}
      />
      <div tabIndex={-1} ref={seekbarBox} style={show ? { display: "block" } : { display: "none" }} className={`seekbar-box ${classes?.box}`}></div>
      {thumbnail && 
        <div
          tabIndex={-1}
          ref={seekbarThumbnail}
          style={show ? { display: "block", backgroundImage: `url(${thumbnail.src})` } : { display: "none" }}
          className="seekbar-thumbnail"
        />
      }

      {chapterList && chapterList.length > 0 && 
        <div tabIndex={-1} ref={seekbarChapterText} style={show ? { display: "block" } : { display: "none" }} className={`seekbar-box seekbar-chapter-box ${classes?.box}`}></div>
      }
    </div>
  );
};

export default SeekBar;