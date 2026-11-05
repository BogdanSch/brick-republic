import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AxiosError } from "axios";
import { baseAxios } from "@/requests";
import { useAuth } from "@/contexts";
import {
  Card,
  Form,
  Button,
  Alert,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import type { LoginUserDto } from "shared/types/dtos";

export const Route = createFileRoute("/auth/login")({
  component: function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState<LoginUserDto>({
      email: "",
      password: "",
    });
    const [authError, setAuthError] = useState<string>("");

    const loginMutation = useMutation({
      mutationFn: async (credentials: LoginUserDto) => {
        const { data } = await baseAxios.post<{ token: string }>(
          "/account/login",
          credentials,
        );
        return data.token;
      },
      onSuccess: (token) => {
        login(token);
        navigate({ to: "/" });
      },
      onError: (error: AxiosError<{ message: string }>) => {
        setAuthError(
          error.response?.data?.message || "Invalid email or password.",
        );
      },
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError("");
      loginMutation.mutate(formData);
    };

    return (
      <section className="auth-page mt-5">
        <Container>
          <div className="auth-page__wrap">
          <Row className="justify-content-center">
            <Col md={6} lg={5}>
              <Card className="shadow-sm border-0">
                <Card.Body className="p-5">
                  <h2 className="text-center mb-4 fs-2">Sign In</h2>
                  {authError && <Alert variant="danger">{authError}</Alert>}
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label className="fw-medium">
                        Email address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-4" controlId="password">
                      <Form.Label className="fw-medium">Password</Form.Label>
                      <Form.Control
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Button
                      variant="dark"
                      type="submit"
                      className="w-100 fw-bold py-2 mb-3"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </Form>
                  <div className="text-center mt-4 border-top pt-3">
                    <span className="text-muted">
                      Don't have an account?{" "}
                    </span>
                    <Link
                      to="/auth/register"
                      className="text-dark fw-bold text-decoration-none"
                    >
                      Register here
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          </div>
        </Container>
      </section>
    );
  },
});
