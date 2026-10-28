import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "../contexts/AuthProvider";
import { CartProvider, useCart } from "../contexts/CartProvider";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        background: "#f0f0f0",
      }}
    >
      <Link to="/" style={{ fontWeight: "bold" }}>
        Brick Republic
      </Link>
      <Link to="/cart">Cart ({cartCount})</Link>
      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <>
            <span style={{ marginRight: "1rem" }}>Hello, {user.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link> // Route to be implemented later
        )}
      </div>
    </nav>
  );
}

export const RouteLayout = createRootRoute({
  component: () => (
    <>
      <Navbar />
      <main className="main">
        <Outlet />
        <TanStackRouterDevtools />
      </main>
    </>
  ),
});
