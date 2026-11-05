import {
  Outlet,
  Link,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuth, useCart, type AuthContextType } from "../contexts";
import { Navbar, Nav, Container, Badge, Button } from "react-bootstrap";

function Navigation() {
  const { user, logout, isAdmin } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header shadow-sm border-bottom">
      <Container>
        <Navbar expand="lg">
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
            Brick Republic
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto align-items-lg-center">
              <Nav.Link
                as={Link}
                to="/cart"
                className="d-flex align-items-center gap-2"
              >
                Cart{" "}
                <Badge bg="dark" pill>
                  {cartCount}
                </Badge>
              </Nav.Link>
              {user && (
                <Nav.Link as={Link} to="/dashboard/account">
                  Dashboard
                </Nav.Link>
              )}
              {isAdmin && (
                <>
                  <Nav.Link as={Link} to="/admin/inventory">
                    Inventory Manager
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/orders">
                    Fulfillment Board
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="align-items-lg-center gap-3 mt-3 mt-lg-0">
              {user ? (
                <>
                  <Navbar.Text className="text-dark fw-medium mb-2 mb-lg-0">
                    Hello, {user.email}
                  </Navbar.Text>
                  <Button variant="outline-dark" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/auth/login">
                    Login
                  </Nav.Link>
                  <Nav.Link as={Link} to="/auth/register">
                    Register
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </Container>
    </header>
  );
}

export interface IRouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<IRouterContext>()({
  component: () => (
    <>
      <Navigation />
      <main className="main">
        <Outlet />
        <TanStackRouterDevtools />
      </main>
    </>
  ),
});
