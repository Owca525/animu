import { createSignal, createEffect, For, Show } from "solid-js";
import { formatTime } from '@renderer/utils/functions';
import type { Thumbnail } from '@renderer/utils/types';
import "./css/seekBar.css";

interface SeekBarProps {
  maxValue?: number;
  minValue?: number;
  currentValue?: number;
  onSeek: (value: number) => void;
  type?: "value" | "float" | "time" | "procent";
  classes?: { container?: string; progress?: string; thumb?: string; box?: string };
  screen?: boolean;
  secondBarValues?: { position: number; width: number }[];
  thumbnail?: Thumbnail;
  chapterList?: { left: number; width: number; name?: string; type: "opening" | "ending" | "other" }[];
}

export default function SeekBar(props: SeekBarProps) {
  const [value, setValue] = createSignal(props.currentValue);
  const [drag, setDrag] = createSignal(false);
  const [show, setShow] = createSignal(false);

  let seekBarRef: HTMLDivElement | undefined;
  let seekBarProgress: HTMLDivElement | undefined;
  let seekbarThumb: HTMLDivElement | undefined;
  let seekbarBox: HTMLDivElement | undefined;
  let seekbarThumbnail: HTMLDivElement | undefined;
  let seekbarChapterText: HTMLDivElement | undefined;

  createEffect(() => {
    setValue(props.currentValue);
    updateSeekBar(value());
  });

  function updateSeekBar(val: number | undefined) {
    if (!seekBarProgress || !seekbarThumb || !seekbarBox) return;
    if (val === undefined || props.maxValue === undefined) return;

    const clampedVal = Math.max(props.minValue ?? 0, Math.min(val, props.maxValue));
    const percent = ((clampedVal - (props.minValue ?? 0)) / ((props.maxValue ?? 1) - (props.minValue ?? 0))) * 100;

    seekBarProgress.style.width = `${percent}%`;
    seekbarThumb.style.left = `${percent}%`;
  }

  function setPosition(event: MouseEvent) {
    if (!props.maxValue || !seekBarRef) return;

    const rect = seekBarRef.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newValue = (offsetX / rect.width) * ((props.maxValue ?? 0) - (props.minValue ?? 0)) + (props.minValue ?? 0);

    if (newValue >= (props.minValue ?? 0) && newValue <= (props.maxValue ?? 0)) {
      setValue(newValue);
      props.onSeek(newValue);
      updateSeekBar(newValue);
    }
  }

  function setPositionBox(event: MouseEvent) {
    if (!props.maxValue || !seekBarRef || !seekbarBox) {
      setShow(false);
      return;
    }

    const rect = seekBarRef.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newValue = (offsetX / rect.width) * ((props.maxValue ?? 0) - (props.minValue ?? 0)) + (props.minValue ?? 0);

    if (newValue < (props.minValue ?? 0) || newValue > (props.maxValue ?? 0)) return;

    const percent = ((newValue - (props.minValue ?? 0)) / ((props.maxValue ?? 0) - (props.minValue ?? 0))) * 100;
    seekbarBox.style.left = `${percent}%`;
    setChapterBoxPosition(`${percent}%`, percent);

    if (props.screen) {
      if (percent > 98) {
        seekbarBox.style.left = `98%`;
        setChapterBoxPosition(`98%`, percent);
      }
      if (percent < 1.5) {
        seekbarBox.style.left = `1.5%`;
        setChapterBoxPosition(`1.5%`, percent);
      }
    }

    if (props.thumbnail) setThumbnailPosition(percent);

    if (props.type === "value") seekbarBox.innerHTML = newValue.toFixed(0);
    if (props.type === "float") seekbarBox.innerHTML = newValue.toFixed(1);
    if (props.type === "time") seekbarBox.innerHTML = formatTime(newValue);
    if (props.type === "procent") seekbarBox.innerHTML = `${newValue.toFixed(0)}%`;
  }

  function setThumbnailPosition(percent: number) {
    if (!props.thumbnail || !seekbarThumbnail || !props.maxValue) return;

    props.thumbnail.metadata.forEach((value) => {
      const startPercent = (value.start / props.maxValue!) * 100;
      const endPercent = (value.end / props.maxValue!) * 100;

      if (percent >= startPercent && percent <= endPercent && seekbarThumbnail) {
        const thumb = seekbarThumbnail;
        const container = thumb.parentElement;
        if (!container) return;

        thumb.style.backgroundPosition = `-${value.imgX}px -${value.imgY}px`;

        const containerWidth = container.clientWidth;
        const thumbWidth = thumb.offsetWidth;
        let centerPx = (percent / 100) * containerWidth;
        const halfThumb = thumbWidth / 2;
        if (centerPx < halfThumb) centerPx = halfThumb;
        if (centerPx > containerWidth - halfThumb) centerPx = containerWidth - halfThumb;

        if (centerPx > 0) {
          thumb.style.left = `${centerPx}px`;
          setChapterBoxPosition(`${centerPx}px`, percent);
        }
      }
    });
  }

  function setChapterBoxPosition(variable: string, percent: number) {
    if (!props.chapterList || !seekbarChapterText) return;

    for (let index = 0; index < props.chapterList.length; index++) {
      const element = props.chapterList[index];
      seekbarChapterText.innerHTML = "";
      seekbarChapterText.style.display = "none";

      if (percent >= element.left && percent <= element.left + element.width && element.name) {
        seekbarChapterText.style.left = variable;
        seekbarChapterText.innerHTML = element.name;
        seekbarChapterText.style.display = "";
        return;
      }
    }
  }

  function handleMouseMove(event: MouseEvent) {
    setPositionBox(event);
    if (drag()) setPosition(event);
  }

  return (
    <div tabIndex={-1} class={`seekBar-container ${props.classes?.container ?? ""}`}>
      <div
        class="seekbar-shadow"
        ref={seekBarRef}
        onClick={(e) => setPosition(e as MouseEvent)}
        onMouseDown={() => setDrag(true)}
        onMouseUp={() => setDrag(false)}
        onMouseLeave={() => { setDrag(false); setShow(false); }}
        onMouseEnter={() => setShow(true)}
        onMouseMove={(e) => handleMouseMove(e as MouseEvent)}
      />
      <Show when={props.secondBarValues}>
        <div class="seekbar-buffer-wrapper">
          <For each={props.secondBarValues}>
            {(buffer) => (
              <div class="seekbar-buffer" style={{ left: `${buffer.position}%`, width: `${buffer.width}%` }} />
            )}
          </For>
        </div>
      </Show>
      <Show when={props.chapterList && props.chapterList.length > 0}>
        <div class="seekbar-chapters-wrapper">
          <For each={props.chapterList}>
            {(chapter) => (
              <div
                class={`seekbar-chapters ${
                  chapter.type === "opening" || chapter.type === "ending"
                    ? "seekbar-chapters-opening-ending"
                    : ""
                }`}
                style={{ left: `${chapter.left}%`, width: `${chapter.width}%` }}
              />
            )}
          </For>
        </div>
      </Show>

      <div ref={seekBarProgress} class={`seekbar-progress ${props.classes?.progress ?? ""}`} />
      <div ref={seekbarThumb} class={`seekbar-thumb ${props.classes?.thumb ?? ""}`} />
      <div
        ref={seekbarBox}
        class={`seekbar-box ${props.classes?.box ?? ""}`}
        style={{ "display": show() ? "block" : "none" }}
      />
      <div class="seekbar-content-wrapper" style={{ "display": show() ? "block" : "none" }}>
        <Show when={props.thumbnail}>
          <div
            ref={seekbarThumbnail}
            class="seekbar-thumbnail"
            style={{
              "display": show() ? "block" : "none",
              "background-image": `url(${props.thumbnail!.src})`,
            }}
          />
        </Show>
        <Show when={props.chapterList && props.chapterList.length > 0}>
          <div
            ref={seekbarChapterText}
            class={`seekbar-box ${
              props.thumbnail ? "seekbar-chapter-box-thumbnails" : "seekbar-chapter-box"
            } ${props.classes?.box ?? ""}`}
          />
        </Show>
      </div>
    </div>
  );
}
