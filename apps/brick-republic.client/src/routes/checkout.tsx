import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth, useCart } from "@/contexts";
import { baseAxios, protectedAxios } from "@/requests";
import {
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Spinner,
  Container,
} from "react-bootstrap";
import type { CreateOrderDto, StoreDto, UserDto } from "shared/types/dtos";

const fetchStores = async (): Promise<StoreDto[]> => {
  const { data } = await baseAxios.get<{ items: StoreDto[] }>("/stores");
  return data.items;
};

const fetchUserProfile = async (): Promise<UserDto> => {
  const { data } = await protectedAxios.get<UserDto>("/account/me");
  return data;
};

export const Route = createFileRoute("/checkout")({
  component: function CheckoutPage() {
    const { user } = useAuth();
    const { items, itemsTotal, clearCart } = useCart();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const navigate = useNavigate();

    const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
    const [saveNewAddress, setSaveNewAddress] = useState<boolean>(false);

    const [formData, setFormData] = useState<CreateOrderDto>({
      fulfillmentMethod: "delivery",
      items: items.map((item) => ({
        minifigureName: item.name,
        minifigureId: item.minifigureId,
        condition: item.condition,
        quantity: item.quantity,
      })),
    });

    const { data: stores, isLoading: isLoadingStores } = useQuery({
      queryKey: ["stores"],
      queryFn: fetchStores,
      enabled: formData.fulfillmentMethod === "pickup",
    });

    const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
      queryKey: ["userProfile"],
      queryFn: fetchUserProfile,
      enabled: !!user,
    });

    useEffect(() => {
      if (
        userProfile &&
        userProfile.addresses &&
        userProfile.addresses.length > 0
      ) {
        const defaultAddress =
          userProfile.addresses.find(
            (addressElement) => addressElement.isDefault,
          ) || userProfile.addresses[0];

        const addressId = defaultAddress.id || "new";
        setSelectedAddressId(addressId);

        if (addressId !== "new") {
          setFormData((prev) => ({
            ...prev,
            shipment: {
              shippingAddress: {
                street: defaultAddress.street,
                city: defaultAddress.city,
                postalCode: defaultAddress.postalCode,
                country: defaultAddress.country,
              },
            },
          }));
        }
      }
    }, [userProfile]);

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
      setFormData((previousState) => ({
        ...previousState,
        fulfillmentMethod: method,
      }));
    };

    const handleAddressSelect = (
      event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
      const value = event.target.value;
      setSelectedAddressId(value);

      if (value === "new") {
        setFormData((prev) => ({
          ...prev,
          shipment: {
            shippingAddress: {
              street: "",
              city: "",
              postalCode: "",
              country: "",
            },
          },
        }));
      } else {
        const selectedAddress = userProfile?.addresses?.find(
          (addressElement) => addressElement.id === value,
        );
        if (selectedAddress) {
          setFormData((prev) => ({
            ...prev,
            shipment: {
              shippingAddress: {
                street: selectedAddress.street,
                city: selectedAddress.city,
                postalCode: selectedAddress.postalCode,
                country: selectedAddress.country,
              },
            },
          }));
        }
      }
    };

    const handleAddressChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const { name, value } = event.target;
      setFormData((prev) => {
        const shipment = prev.shipment ?? {
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

    const handleStoreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData((previousState) => ({
        ...previousState,
        pickup: {
          ...previousState.pickup,
          storeId: event.target.value,
        },
      }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      setErrorMessage("");

      if (items.length === 0) {
        setErrorMessage("Your cart is empty.");
        return;
      }

      if (
        formData.fulfillmentMethod === "delivery" &&
        selectedAddressId === "new" &&
        saveNewAddress
      ) {
        try {
          await protectedAxios.post("/account/me/addresses", {
            ...formData.shipment?.shippingAddress,
            isDefault: true,
          });
        } catch (error: any) {
          console.error("Failed to save address to profile", error);
        }
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

    if (isLoadingProfile) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    }

    const hasSavedAddresses =
      userProfile?.addresses && userProfile.addresses.length > 0;

    return (
      <section className="checkout-page mt-4">
        <Container>
          <div className="checkout-page__wrap">
            <h1 className="mb-4">Checkout</h1>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Row className="gy-4">
              <Col lg={8}>
                <Card className="shadow-sm border-0 bg-light p-4">
                  <Form onSubmit={handleSubmit}>
                    <h3 className="fs-4 mb-4 pb-2 border-bottom">
                      1. Fulfillment
                    </h3>
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
                        {hasSavedAddresses && (
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-medium">
                              Select Delivery Address
                            </Form.Label>
                            <Form.Select
                              value={selectedAddressId}
                              onChange={handleAddressSelect}
                            >
                              {userProfile?.addresses?.map((addressElement) => (
                                <option
                                  key={addressElement.id}
                                  value={addressElement.id}
                                >
                                  {addressElement.street}, {addressElement.city}
                                </option>
                              ))}
                              <option value="new">
                                + Enter a new address...
                              </option>
                            </Form.Select>
                          </Form.Group>
                        )}

                        {selectedAddressId === "new" ? (
                          <>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-medium">
                                Street Address
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="street"
                                required
                                value={
                                  formData.shipment?.shippingAddress.street
                                }
                                onChange={handleAddressChange}
                              />
                            </Form.Group>
                            <Row>
                              <Col md={5}>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-medium">
                                    City
                                  </Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="city"
                                    required
                                    value={
                                      formData.shipment?.shippingAddress.city
                                    }
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
                                      formData.shipment?.shippingAddress
                                        .postalCode
                                    }
                                    onChange={handleAddressChange}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-medium">
                                    Country
                                  </Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="country"
                                    required
                                    value={
                                      formData.shipment?.shippingAddress.country
                                    }
                                    onChange={handleAddressChange}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <div className="p-3 mt-3 bg-white border rounded">
                              <Form.Group>
                                <Form.Check
                                  type="checkbox"
                                  id="save-address-flag"
                                  label="Save this address to my profile and set as default"
                                  checked={saveNewAddress}
                                  onChange={(event) =>
                                    setSaveNewAddress(event.target.checked)
                                  }
                                />
                              </Form.Group>
                            </div>
                          </>
                        ) : (
                          <div className="p-3 bg-white border rounded">
                            <p className="mb-1 text-muted small text-uppercase fw-bold">
                              Shipping To:
                            </p>
                            <p className="mb-1 fw-medium fs-5">
                              {formData.shipment?.shippingAddress.street}
                            </p>
                            <p className="mb-0">
                              {formData.shipment?.shippingAddress.city},{" "}
                              {formData.shipment?.shippingAddress.postalCode}
                            </p>
                            <p className="mb-0 text-muted">
                              {formData.shipment?.shippingAddress.country}
                            </p>
                          </div>
                        )}
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
                  <h3 className="fs-4 mb-4 pb-2 border-bottom">
                    Order Summary
                  </h3>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Items Total:</span>
                    <span className="fw-semibold">
                      ${itemsTotal.toFixed(2)}
                    </span>
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
          </div>
        </Container>
      </section>
    );
  },
});
