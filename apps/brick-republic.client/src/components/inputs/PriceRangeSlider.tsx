import { useRef, type KeyboardEvent } from "react";

export type PriceRange = {
  min: number;
  max: number;
};

type PriceRangeSliderProps = {
  min: number;
  max: number;
  value: PriceRange;
  onChange: (value: PriceRange) => void;
  onChangeComplete?: (value: PriceRange) => void;
};

export const SLIDER_STEP: number = 0.5;

export const snapMinToStep = (value: number, step = SLIDER_STEP): number =>
  Number((Math.floor(value / step) * step).toFixed(2));

export const snapMaxToStep = (value: number, step = SLIDER_STEP): number =>
  Number((Math.ceil(value / step) * step).toFixed(2));

const COMMIT_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  onChangeComplete,
}: PriceRangeSliderProps) {
  const latestValueRef = useRef<PriceRange>(value);
  latestValueRef.current = value;

  const alignedMin = snapMinToStep(min);
  const alignedMax = snapMaxToStep(max);

  const range = alignedMax - alignedMin;
  const minPercent =
    range > 0 ? ((value.min - alignedMin) / range) * 100 : 0;
  const maxPercent =
    range > 0 ? ((value.max - alignedMin) / range) * 100 : 100;

  const handleCommit = () => {
    onChangeComplete?.(latestValueRef.current);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (COMMIT_KEYS.has(event.key)) {
      handleCommit();
    }
  };

  return (
    <div className="price-range-slider">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-semibold">Price range</span>
        <span>
          ${value.min.toFixed(2)} - ${value.max.toFixed(2)}
        </span>
      </div>
      <div className="price-range-slider__track">
        <div
          className="price-range-slider__selection"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        <input
          aria-label="Minimum price"
          aria-valuetext={`$${value.min.toFixed(2)}`}
          className="price-range-slider__input price-range-slider__input--min"
          type="range"
          min={alignedMin}
          max={alignedMax}
          step={SLIDER_STEP}
          value={value.min}
          disabled={range <= 0}
          onChange={(event) => {
            const nextMin = Number(event.target.value);
            const nextRange = {
              min: nextMin,
              max: Math.max(nextMin, value.max),
            };
            latestValueRef.current = nextRange;
            onChange(nextRange);
          }}
          onPointerUp={handleCommit}
          onKeyUp={handleKeyUp}
        />
        <input
          aria-label="Maximum price"
          aria-valuetext={`$${value.max.toFixed(2)}`}
          className="price-range-slider__input price-range-slider__input--max"
          type="range"
          min={alignedMin}
          max={alignedMax}
          step={SLIDER_STEP}
          value={value.max}
          disabled={range <= 0}
          onChange={(event) => {
            const nextMax = Number(event.target.value);
            const nextRange = {
              min: Math.min(value.min, nextMax),
              max: nextMax,
            };
            latestValueRef.current = nextRange;
            onChange(nextRange);
          }}
          onPointerUp={handleCommit}
          onKeyUp={handleKeyUp}
        />
      </div>
    </div>
  );
}