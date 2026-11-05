import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth, useCart } from "../contexts";
import { baseAxios, protectedAxios } from "../requests";
import { Card, Form, Button, Alert, Row, Col, Spinner } from "react-bootstrap";
import type { CreateOrderDto, StoreDto } from "shared/types/dtos";

const fetchStores = async (): Promise<StoreDto[]> => {
  const { data } = await baseAxios.get<{ items: StoreDto[] }>("/stores");
  return data.items;
};

export const Route = createFileRoute("/checkout")({
  component: function () {
    const { user } = useAuth();
    const { items, itemsTotal, clearCart } = useCart();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const navigate = useNavigate();

    const [formData, setFormData] = useState<CreateOrderDto>({
      fulfillmentMethod: "delivery",
      items: items.map((item) => ({
        minifigureId: item.minifigureId,
        name: item.name,
        condition: item.condition,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
    });

    const { data: stores, isLoading: isLoadingStores } = useQuery({
      queryKey: ["stores"],
      queryFn: fetchStores,
      enabled: formData.fulfillmentMethod === "pickup",
    });

    const checkoutMutation = useMutation({
      mutationFn: async (payload: CreateOrderDto) => {
        const { data } = await protectedAxios.post("/orders", payload);
        return data;
      },
      onSuccess: () => {
        clearCart();
        navigate({ to: "/dashboard/account" });
      },
      onError: (error: any) => {
        setErrorMessage(
          error.response?.data?.message || "An error occurred during checkout.",
        );
      },
    });

    const handleMethodChange = (method: "delivery" | "pickup") => {
      setFormData((prev) => ({ ...prev, fulfillmentMethod: method }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const shipment = prev.shipment ?? {
          carrier: "",
          serviceLevel: "",
          shippingAddress: {
            street: "",
            city: "",
            postalCode: "",
            country: "",
          },
        };

        return {
          ...prev,
          shipment: {
            ...shipment,
            shippingAddress: {
              ...shipment.shippingAddress,
              [name]: value,
            },
          },
        };
      });
    };

    const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData((prev) => ({
        ...prev,
        pickup: {
          ...prev.pickup,
          storeId: e.target.value,
        },
      }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");

      if (items.length === 0) {
        setErrorMessage("Your cart is empty.");
        return;
      }
      checkoutMutation.mutate(formData);
    };

    if (user === null) {
      return (
        <div className="text-center mt-5">
          <h2 className="fs-3 mb-3">
            Before you can checkout, you must be logged in
          </h2>
          <Button
            variant="dark"
            onClick={() => navigate({ to: "/auth/login" })}
          >
            Go to Login
          </Button>
        </div>
      );
    } else if (items.length === 0) {
      return (
        <div className="text-center mt-5">
          <h2 className="fs-3 mb-3">Your cart is empty</h2>
          <Button variant="dark" onClick={() => navigate({ to: "/" })}>
            Return to Store
          </Button>
        </div>
      );
    }
    return (
      <section className="checkout-page mt-4">
        <h1 className="mb-4">Checkout</h1>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <Row className="gy-4">
          <Col lg={8}>
            <Card className="shadow-sm border-0 bg-light p-4">
              <Form onSubmit={handleSubmit}>
                <h3 className="fs-4 mb-4 pb-2 border-bottom">1. Fulfillment</h3>
                <Form.Group className="mb-4 d-flex gap-4">
                  <Form.Check
                    type="radio"
                    id="method-delivery"
                    label="Delivery ($4.60)"
                    checked={formData.fulfillmentMethod === "delivery"}
                    onChange={() => handleMethodChange("delivery")}
                  />
                  <Form.Check
                    type="radio"
                    id="method-pickup"
                    label="Store Pickup (Free)"
                    checked={formData.fulfillmentMethod === "pickup"}
                    onChange={() => handleMethodChange("pickup")}
                  />
                </Form.Group>
                <h3 className="fs-4 mb-4 pb-2 border-bottom">2. Details</h3>
                {formData.fulfillmentMethod === "delivery" && (
                  <div className="checkout-page__address-form">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">
                        Street Address
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="street"
                        required
                        value={formData.shipment?.shippingAddress.street}
                        onChange={handleAddressChange}
                      />
                    </Form.Group>
                    <Row>
                      <Col md={5}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">City</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            required
                            value={formData.shipment?.shippingAddress.city}
                            onChange={handleAddressChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">
                            Postal Code
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="postalCode"
                            required
                            value={
                              formData.shipment?.shippingAddress.postalCode
                            }
                            onChange={handleAddressChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Country</Form.Label>
                          <Form.Control
                            type="text"
                            name="country"
                            required
                            value={formData.shipment?.shippingAddress.country}
                            onChange={handleAddressChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}
                {formData.fulfillmentMethod === "pickup" && (
                  <div className="checkout-page__store-selector">
                    {isLoadingStores ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">
                          Select a Store
                        </Form.Label>
                        <Form.Select
                          required
                          value={formData.pickup?.storeId || ""}
                          onChange={handleStoreChange}
                        >
                          <option value="" disabled>
                            Choose a location...
                          </option>
                          {stores?.map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.name} - {store.address.street},{" "}
                              {store.address.city}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}
                  </div>
                )}
                <div className="mt-5 pt-4 border-top text-end">
                  <Button
                    variant="dark"
                    size="lg"
                    type="submit"
                    className="fw-bold px-5"
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending
                      ? "Processing..."
                      : "Place Order"}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm border-0 bg-light p-4">
              <h3 className="fs-4 mb-4 pb-2 border-bottom">Order Summary</h3>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Items Total:</span>
                <span className="fw-semibold">${itemsTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-4 pb-3 border-bottom">
                <span className="text-muted">Shipping:</span>
                <span className="fw-semibold">
                  {formData.fulfillmentMethod === "delivery"
                    ? "$4.60"
                    : "$0.00"}
                </span>
              </div>
              <div className="d-flex justify-content-between fs-4 fw-bold">
                <span>Total:</span>
                <span>
                  $
                  {(
                    itemsTotal +
                    (formData.fulfillmentMethod === "delivery" ? 4.6 : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </Card>
          </Col>
        </Row>
      </section>
    );
  },
});
