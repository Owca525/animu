import { formatTime } from '@renderer/utils/functions';
import React, { useEffect, useRef, useState } from 'react';

import "./css/seekBar.css"

interface SeekBarProps {
  maxValue: number | undefined;
  minValue?: number;
  currentValue: number | undefined;
  onSeek: (value: number) => void;
  type?: "value" | "float" | "time" | "procent"
  classes?: { container?: string, progress?: string, thumb?: string, box?: string }
  screen?: boolean
  secondBarValues?: { position: number, width: number }[]
}

const SeekBar: React.FC<SeekBarProps> = ({
  maxValue,
  minValue = 0,
  currentValue,
  onSeek,
  type = "value",
  classes,
  screen = false,
  secondBarValues
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

    if (screen) {
      if (percent > 98) seekbarBox.current.style.left = `98%`;
      if (percent < 1.5) seekbarBox.current.style.left = `1.5%`;
    }

    if (type === "value") seekbarBox.current.innerHTML = newValue.toFixed(0);
    if (type === "float") seekbarBox.current.innerHTML = newValue.toFixed(1);
    if (type === "time") seekbarBox.current.innerHTML = formatTime(newValue);
    if (type === "procent") seekbarBox.current.innerHTML = `${newValue.toFixed(0)}%`
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
      {/* {secondBarValue && <div className="seekbar-progress-second" style={{ width: `${secondBarValue}%` }} />} */}
      {secondBarValues && 
        <div className="seekbar-buffer-wrapper">
          {secondBarValues.map((buffer) => <div className="seekbar-buffer" style={{ left: `${buffer.position}%`, width: `${buffer.width}%` }}></div> )}
        </div>
      }
      
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