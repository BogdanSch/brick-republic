import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { protectedAxios } from "../requests";
import { Card, Spinner, Alert, Badge, Row, Col } from "react-bootstrap";
import type { OrderDto } from "shared/types/dtos";
import { getStatusBadgeVariant } from "../utils/statusHelper";

const fetchMyOrders = async (): Promise<OrderDto[]> => {
  const { data } = await protectedAxios.get<{ items: OrderDto[] }>(
    "/orders/my-orders",
  );
  return data.items;
};

export const Route = createFileRoute("/dashboard/account")({
  component: function AccountPage() {
    const {
      data: orders,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["myOrders"],
      queryFn: fetchMyOrders,
    });

    if (isLoading) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    }
    if (error) {
      return <Alert variant="danger">Failed to load order history.</Alert>;
    }
    return (
      <section className="account-page mt-4">
        <h1 className="mb-4">My Dashboard</h1>
        <h2 className="fs-4 mb-4">Order History</h2>xx
        {orders?.length === 0 ? (
          <p className="text-muted fs-5">You haven't placed any orders yet.</p>
        ) : (
          <div className="account-page__orders d-flex flex-column gap-4">
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
                        {order.items.map((item, idx) => (
                          <li
                            key={idx}
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
      </section>
    );
  },
});
