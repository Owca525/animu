import { formatTime } from '@renderer/utils/time';
import React, { useEffect, useRef, useState } from 'react';

import "../../css/ui/seekBar.css"

interface SeekBarProps {
  maxValue: number | undefined;
  currentValue: number | undefined;
  onSeek: (value: number) => void;
  type?: "value" | "float" | "time"
  classes?: { container?: string, progress?: string, thumb?: string, box?: string }
  screen?: boolean
}

const SeekBar: React.FC<SeekBarProps> = ({
  maxValue,
  currentValue,
  onSeek,
  type = "value",
  classes,
  screen = false
}) => {
  const [value, setValue] = useState(currentValue);
  const [drag, setdrage] = useState<boolean>(false);
  const [show, setshow] = useState<boolean>(false);

  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const seekBarProgress = useRef<HTMLDivElement | null>(null);
  const seekbarThumb = useRef<HTMLDivElement | null>(null);
  const seekbarBox = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setValue(currentValue);
    updateSeekBar(value)
  }, [currentValue]);

  function updateSeekBar(value: number | undefined) {
    if (!seekBarProgress.current) return
    if (!seekbarThumb.current) return
    if (!seekbarBox.current) return
    if (!value) return
    if (!maxValue) return

    const percent = (value / maxValue) * 100
    seekBarProgress.current.style.width = `${percent}%`
    seekbarThumb.current.style.left = `${percent}%`
  }

  function setPosition(event: React.MouseEvent<HTMLDivElement> | MouseEvent) {
    if (!maxValue) return
    if (seekBarRef.current) {
      const rect = seekBarRef.current.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const newTime = (offsetX / rect.width) * maxValue;
      if (newTime >= 0 && newTime <= maxValue) {
        setValue(newTime);
        onSeek(newTime);
        updateSeekBar(newTime)
      }
    }
  }

  function setPositionBox(event: React.MouseEvent<HTMLDivElement> | MouseEvent) {
    if (!maxValue) {
      setshow(() => false)
      return
    }
    if (!seekbarBox.current) return
    if (!seekBarRef.current) return

    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newTime = (offsetX / rect.width) * maxValue;
    if (!(newTime >= 0 && newTime <= maxValue)) return

    seekbarBox.current.style.left = `${Math.round(newTime / maxValue * 100)}%`
    if (screen) {
      if (Math.round(newTime / maxValue * 100) > 98) seekbarBox.current.style.left = `98%`
      if (Math.round(newTime / maxValue * 100) < 1.5) seekbarBox.current.style.left = `1.5%`
    }

    if (type === "value") seekbarBox.current.innerHTML = newTime.toFixed(0)
    if (type === "float") seekbarBox.current.innerHTML = newTime.toFixed(1)
    if (type === "time") seekbarBox.current.innerHTML = formatTime(newTime)
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement> | MouseEvent) {
    setPositionBox(event)
    if (drag) setPosition(event)
  };

  return (
    <div
      ref={seekBarRef}
      className={`seekBar-container ${classes?.container}`}
      onClick={setPosition}
      onMouseDown={() => setdrage(() => true)}
      onMouseUp={() => setdrage(() => false)}
      onMouseLeave={() => { setdrage(() => false); setshow(false) }}
      onMouseEnter={() => setshow(() => true)}
      onMouseMove={handleMouseMove}
    >
      <div
        ref={seekBarProgress}
        className={`seekbar-progress ${classes?.progress}`}
      />
      <div
        ref={seekbarThumb}
        className={`seekbar-thumb ${classes?.thumb}`}
      />
      <div ref={seekbarBox} style={show ? { display: "block" } : { display: "none" }} className={`seekbar-box ${classes?.box}`}></div>
    </div>
  );
};

export default SeekBar;