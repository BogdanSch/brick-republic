import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../contexts/CartProvider";
import type { MinifigureDto } from "shared/types/dtos";

const fetchMinifigures = async (): Promise<MinifigureDto[]> => {
  const res = await fetch("http://localhost:3000/api/minifigures");
  if (!res.ok) throw new Error("Failed to fetch catalog");
  const data = await res.json();
  return data.minifigures;
};

function HomePage() {
  const { addToCart } = useCart();
  const {
    data: minifigures,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["minifigures"],
    queryFn: fetchMinifigures,
  });

  if (isLoading) return <div>Loading catalog...</div>;
  if (error) return <div>Error loading catalog.</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Minifigure Catalog</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem",
        }}
      >
        {minifigures?.map((mf) => (
          <div
            key={mf.id}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <h3>{mf.name}</h3>
            <p>Theme: {mf.theme.name}</p>
            <p>Price: ${mf.pricing.retailPrice.toFixed(2)}</p>
            <p>In Stock (New): {mf.stock.newCondition}</p>

            <button
              disabled={mf.stock.newCondition === 0}
              onClick={() =>
                addToCart({
                  minifigureId: mf.id,
                  name: mf.name,
                  condition: "new",
                  quantity: 1,
                  priceAtPurchase: mf.pricing.retailPrice,
                })
              }
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
