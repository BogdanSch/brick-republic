import { createFileRoute } from "@tanstack/react-router";
import { useCart } from "../contexts";
import { Table, Button, ButtonGroup } from "react-bootstrap";

export const Route = createFileRoute("/cart")({
  component: function CartPage() {
    const { items, itemsTotal, updateQuantity, removeFromCart, clearCart } =
      useCart();

    if (items.length === 0) {
      return (
        <div className="text-center mt-5 fs-5 text-muted">
          Your cart is empty.
        </div>
      );
    }

    return (
      <section className="cart-page">
        <h1 className="mb-4">Your Cart</h1>
        <Table responsive hover className="align-middle shadow-sm">
          <thead className="table-light">
            <tr>
              <th>Item</th>
              <th>Condition</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.minifigureId}-${item.condition}`}>
                <td className="fw-medium">{item.name}</td>
                <td className="text-capitalize text-muted">{item.condition}</td>
                <td>${item.priceAtPurchase.toFixed(2)}</td>
                <td>
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-secondary"
                      onClick={() =>
                        updateQuantity(item.minifigureId, item.condition, -1)
                      }
                    >
                      -
                    </Button>
                    <Button
                      variant="outline-secondary"
                      disabled
                      className="px-3 text-dark fw-bold border-secondary"
                    >
                      {item.quantity}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() =>
                        updateQuantity(item.minifigureId, item.condition, 1)
                      }
                    >
                      +
                    </Button>
                  </ButtonGroup>
                </td>
                <td className="fw-semibold">
                  ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                </td>
                <td className="text-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() =>
                      removeFromCart(item.minifigureId, item.condition)
                    }
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="cart-page__actions border-top pt-4">
          <h2 className="mb-0 me-auto">Total: ${itemsTotal.toFixed(2)}</h2>
          <Button variant="outline-secondary" onClick={clearCart}>
            Clear Cart
          </Button>
          <Button variant="dark" size="lg" className="fw-medium px-4">
            Proceed to Checkout
          </Button>
        </div>
      </section>
    );
  },
});
