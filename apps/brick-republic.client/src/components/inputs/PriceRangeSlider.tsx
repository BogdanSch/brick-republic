export type PriceRange = {
  min: number;
  max: number;
};

type PriceRangeSliderProps = {
  min: number;
  max: number;
  value: PriceRange;
  onChange: (value: PriceRange) => void;
};

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: PriceRangeSliderProps) {
  const range = max - min;
  const minPercent = range > 0 ? ((value.min - min) / range) * 100 : 0;
  const maxPercent = range > 0 ? ((value.max - min) / range) * 100 : 100;

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
          min={min}
          max={max}
          step={0.05}
          value={value.min}
          disabled={range <= 0}
          onChange={(event) => {
            const nextMin = Number(event.target.value);
            onChange({ min: nextMin, max: Math.max(nextMin, value.max) });
          }}
        />
        <input
          aria-label="Maximum price"
          aria-valuetext={`$${value.max.toFixed(2)}`}
          className="price-range-slider__input price-range-slider__input--max"
          type="range"
          min={min}
          max={max}
          step={0.05}
          value={value.max}
          disabled={range <= 0}
          onChange={(event) => {
            const nextMax = Number(event.target.value);
            onChange({ min: Math.min(value.min, nextMax), max: nextMax });
          }}
        />
      </div>
    </div>
  );
}
