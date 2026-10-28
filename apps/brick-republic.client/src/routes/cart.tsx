import { createFileRoute } from "@tanstack/react-router";
import { useCart } from "../contexts/CartProvider";

function CartPage() {
  const { items, itemsTotal, updateQuantity, removeFromCart, clearCart } =
    useCart();

  if (items.length === 0) {
    return <div style={{ padding: "1rem" }}>Your cart is empty.</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Your Cart</h1>
      <table
        style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc" }}>
            <th>Item</th>
            <th>Condition</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={`${item.minifigureId}-${item.condition}`}
              style={{ borderBottom: "1px solid #eee" }}
            >
              <td>{item.name}</td>
              <td>{item.condition}</td>
              <td>${item.priceAtPurchase.toFixed(2)}</td>
              <td>
                <button
                  onClick={() =>
                    updateQuantity(item.minifigureId, item.condition, -1)
                  }
                >
                  -
                </button>
                <span style={{ margin: "0 10px" }}>{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.minifigureId, item.condition, 1)
                  }
                >
                  +
                </button>
              </td>
              <td>${(item.priceAtPurchase * item.quantity).toFixed(2)}</td>
              <td>
                <button
                  onClick={() =>
                    removeFromCart(item.minifigureId, item.condition)
                  }
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "2rem", textAlign: "right" }}>
        <h2>Total: ${itemsTotal.toFixed(2)}</h2>
        <button onClick={clearCart} style={{ marginRight: "1rem" }}>
          Clear Cart
        </button>
        <button
          style={{
            padding: "0.5rem 2rem",
            background: "black",
            color: "white",
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/cart")({
  component: CartPage,
});
