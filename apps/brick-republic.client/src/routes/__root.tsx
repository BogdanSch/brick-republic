import {
  Outlet,
  Link,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuth, useCart, type AuthContextType } from "../contexts";
import { Navbar, Nav, Container, Badge, Button } from "react-bootstrap";

function Navigation() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header shadow-sm border-bottom">
      <Container>
        <Navbar>
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
            Brick Republic
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
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
            </Nav>
            <Nav className="align-items-center gap-3">
              {user ? (
                <>
                  <Navbar.Text className="text-dark fw-medium">
                    Hello, {user.email}
                  </Navbar.Text>
                  <Button variant="outline-dark" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Nav.Link as={Link} to="/auth/login">
                  Login
                </Nav.Link>
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
      <Container as="main" className="mb-5">
        <Outlet />
        <TanStackRouterDevtools />
      </Container>
    </>
  ),
});
