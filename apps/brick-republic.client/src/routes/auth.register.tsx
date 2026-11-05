import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AxiosError } from "axios";
import { baseAxios } from "@/requests";
import {
  Card,
  Form,
  Button,
  Alert,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import type { RegisterUserDto } from "shared/types/dtos";

export const Route = createFileRoute("/auth/register")({
  component: function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
    });
    const [errorMessage, setErrorMessage] = useState("");

    const registerMutation = useMutation({
      mutationFn: async (payload: RegisterUserDto) => {
        const requestData = {
          email: payload.email,
          password: payload.password,
          profile: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            phoneNumber: payload.phoneNumber,
          },
        };
        const { data } = await baseAxios.post("/account/register", requestData);
        return data;
      },
      onSuccess: () => {
        navigate({ to: "/auth/login" });
      },
      onError: (error: AxiosError<{ message: string }>) => {
        setErrorMessage(
          error.response?.data?.message ||
            "An error occurred during registration.",
        );
      },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");
      registerMutation.mutate(formData);
    };

    return (
      <section className="auth-page mt-5">
        <Container>
          <div className="auth-page__wrap">
          <Row className="justify-content-center">
            <Col md={7} lg={6}>
              <Card className="shadow-sm border-0">
                <Card.Body className="p-5">
                  <h1 className="text-center mb-4 fs-2">Create Account</h1>

                  {errorMessage && (
                    <Alert variant="danger">{errorMessage}</Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col sm={6}>
                        <Form.Group className="mb-3" controlId="firstName">
                          <Form.Label className="fw-medium">
                            First Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3" controlId="lastName">
                          <Form.Label className="fw-medium">
                            Last Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="phoneNumber">
                      <Form.Label className="fw-medium">
                        Phone Number
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label className="fw-medium">
                        Email address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="password">
                      <Form.Label className="fw-medium">Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        required
                        minLength={7}
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Button
                      variant="dark"
                      type="submit"
                      className="w-100 fw-bold py-2 mb-3"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending
                        ? "Registering..."
                        : "Register"}
                    </Button>
                  </Form>

                  <div className="text-center mt-4 border-top pt-3">
                    <span className="text-muted">
                      Already have an account?{" "}
                    </span>
                    <Link
                      to="/auth/login"
                      className="text-dark fw-bold text-decoration-none"
                    >
                      Sign in
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
