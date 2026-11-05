import { protectedAxios } from "@/requests";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts";
import {
  Card,
  Spinner,
  Alert,
  Badge,
  Row,
  Col,
  Tabs,
  Tab,
  Button,
  Form,
  Container,
} from "react-bootstrap";
import { CreateAddressModal } from "@/containers";
import { getStatusBadgeVariant } from "@/utils/statusHelper";
import type {
  OrderDto,
  UserDto,
  UpdateUserProfileDto,
} from "shared/types/dtos";

const fetchMyOrders = async (): Promise<OrderDto[]> => {
  const { data } = await protectedAxios.get<{ items: OrderDto[] }>(
    "/orders/my-orders",
  );
  return data.items;
};

const fetchUserProfile = async (): Promise<UserDto> => {
  const { data } = await protectedAxios.get<UserDto>("/account/me");
  return data;
};

export const Route = createFileRoute("/dashboard/account")({
  component: function AccountPage() {
    const { isAdmin } = useAuth();
    const queryClient = useQueryClient();

    const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
    const [profileForm, setProfileForm] = useState<UpdateUserProfileDto>({
      firstName: "",
      lastName: "",
      phoneNumber: "",
    });

    const {
      data: orders,
      isLoading: isLoadingOrders,
      error: ordersError,
    } = useQuery({
      queryKey: ["myOrders"],
      queryFn: fetchMyOrders,
    });

    const {
      data: userProfile,
      isLoading: isLoadingProfile,
      error: profileError,
    } = useQuery({
      queryKey: ["userProfile"],
      queryFn: fetchUserProfile,
    });

    useEffect(() => {
      if (!userProfile?.profile) return;
      setProfileForm({
        firstName: userProfile.profile.firstName,
        lastName: userProfile.profile.lastName,
        phoneNumber: userProfile.profile.phoneNumber,
      });
    }, [userProfile]);

    const setDefaultAddressMutation = useMutation({
      mutationFn: async (addressId: string) => {
        await protectedAxios.patch(
          `/account/me/addresses/${addressId}/default`,
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      },
    });

    const deleteAddressMutation = useMutation({
      mutationFn: async (addressId: string) => {
        await protectedAxios.delete(`/account/me/addresses/${addressId}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      },
    });

    const updateProfileMutation = useMutation({
      mutationFn: async (payload: UpdateUserProfileDto) => {
        await protectedAxios.patch("/account/me/profile", payload);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      },
    });

    const handleProfileSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      updateProfileMutation.mutate(profileForm);
    };

    const handleProfileChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const { name, value } = event.target;
      setProfileForm((previousState) => ({
        ...previousState,
        [name]: value,
      }));
    };

    if (isLoadingOrders || isLoadingProfile) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    } else if (ordersError || profileError) {
      return (
        <Alert variant="danger">Failed to load dashboard resources.</Alert>
      );
    }

    return (
      <section className="account-page mt-4">
        <Container>
          <div className="account-page__wrap">
        <h1 className="mb-4">My Dashboard</h1>

        <Tabs
          defaultActiveKey="orders"
          id="dashboard-tabs"
          className="mb-4 custom-tabs"
        >
          <Tab eventKey="orders" title="Order History">
            {orders?.length === 0 ? (
              <p className="text-muted fs-5 mt-3">
                You haven't placed any orders yet.
              </p>
            ) : (
              <div className="account-page__orders d-flex flex-column gap-4 mt-3">
                {orders?.map((order) => (
                  <Card key={order.id} className="shadow-sm border-0 bg-light">
                    <Card.Header className="bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center">
                      <div className="d-flex flex-column">
                        <span className="text-muted small">
                          Order ID: {order.id}
                        </span>
                        <span className="fw-medium">
                          Date: {new Date(order.orderDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge
                        bg={getStatusBadgeVariant(order.status)}
                        className="fs-6 text-capitalize"
                      >
                        {order.status}
                      </Badge>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row className="gy-3">
                        <Col md={8}>
                          <h4 className="fs-6 text-muted mb-3 text-uppercase">
                            Items
                          </h4>
                          <ul className="list-unstyled mb-0">
                            {order.items.map((item, index) => (
                              <li
                                key={index}
                                className="mb-2 pb-2 border-bottom d-flex justify-content-between"
                              >
                                <span>
                                  <span className="fw-semibold">
                                    {item.quantity}x
                                  </span>{" "}
                                  {item.name}
                                  <span className="text-muted small ms-2">
                                    ({item.condition})
                                  </span>
                                </span>
                                <span className="fw-medium">
                                  $
                                  {parseFloat(
                                    item.priceAtPurchase.toString(),
                                  ).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </Col>
                        <Col
                          md={4}
                          className="border-start border-md-0 ps-md-4 mt-4 mt-md-0"
                        >
                          <h4 className="fs-6 text-muted mb-3 text-uppercase">
                            Summary
                          </h4>
                          <div className="d-flex justify-content-between mb-1 small">
                            <span>Fulfillment:</span>
                            <span className="text-capitalize fw-medium">
                              {order.fulfillmentMethod}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-2 pb-2 border-bottom small">
                            <span>Shipping:</span>
                            <span>
                              $
                              {parseFloat(
                                order.financials.shippingTotal.toString(),
                              ).toFixed(2)}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between fw-bold fs-5">
                            <span>Total:</span>
                            <span>
                              $
                              {parseFloat(
                                order.financials.finalTotal.toString(),
                              ).toFixed(2)}
                            </span>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Tab>

          <Tab eventKey="addresses" title="My Addresses">
            <div className="mt-3">
              <Row className="gy-4">
                {userProfile?.addresses?.map((addressElement) => (
                  <Col md={6} lg={4} key={addressElement.id}>
                    <Card
                      className={`h-100 shadow-sm ${
                        addressElement.isDefault
                          ? "border-dark border-2"
                          : "border-0"
                      }`}
                    >
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="d-flex justify-content-between align-items-start mb-3 fs-5">
                          Saved Address
                          {addressElement.isDefault && (
                            <Badge bg="dark" className="ms-2 fw-normal">
                              Default
                            </Badge>
                          )}
                        </Card.Title>
                        <Card.Text className="mb-4">
                          <span className="d-block text-dark fw-medium">
                            {addressElement.street}
                          </span>
                          <span className="d-block text-muted">
                            {addressElement.city}, {addressElement.postalCode}
                          </span>
                          <span className="d-block text-muted">
                            {addressElement.country}
                          </span>
                        </Card.Text>
                        <div className="d-flex gap-2 mt-auto">
                          {!addressElement.isDefault && (
                            <Button
                              variant="outline-dark"
                              size="sm"
                              disabled={setDefaultAddressMutation.isPending}
                              onClick={() =>
                                setDefaultAddressMutation.mutate(
                                  addressElement.id || "",
                                )
                              }
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={deleteAddressMutation.isPending}
                            onClick={() =>
                              deleteAddressMutation.mutate(
                                addressElement.id || "",
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
                <Col md={6} lg={4}>
                  <Card
                    className="h-100 shadow-sm border-dashed text-center d-flex align-items-center justify-content-center cursor-pointer"
                    style={{
                      minHeight: "200px",
                      borderStyle: "dashed",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowAddressModal(true)}
                  >
                    <Card.Body className="d-flex flex-column align-items-center justify-content-center text-muted">
                      <span className="fs-1 mb-2">+</span>
                      <span className="fw-medium">Add New Address</span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Tab>

          {!isAdmin && (
            <Tab eventKey="profile" title="My Profile">
              <div className="mt-3">
                <Card className="shadow-sm border-0 bg-light p-4">
                  <Form onSubmit={handleProfileSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            required
                            value={profileForm.firstName}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            required
                            value={profileForm.lastName}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-4">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="phoneNumber"
                        required
                        value={profileForm.phoneNumber}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                    <Button
                      variant="dark"
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending
                        ? "Saving..."
                        : "Save Profile Changes"}
                    </Button>
                  </Form>
                </Card>
              </div>
            </Tab>
          )}
        </Tabs>

        <CreateAddressModal
          show={showAddressModal}
          onHide={() => setShowAddressModal(false)}
        />
          </div>
        </Container>
      </section>
    );
  },
});
