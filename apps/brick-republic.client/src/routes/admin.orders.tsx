import { protectedAxios } from "@/requests";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LoadingSpinner } from "@/components";
import {
  Table,
  Form,
  Badge,
  Toast,
  ToastContainer,
  Container,
  Button,
  Modal,
} from "react-bootstrap";
import type { OrderDto, PatchOrderDto } from "shared/types";

const fetchAllOrders = async (): Promise<OrderDto[]> => {
  const { data } = await protectedAxios.get<{ orders: OrderDto[] }>("/orders");
  return data.orders;
};

const toDateInputValue = (date?: Date): string => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toISOString().slice(0, 10);
};

export const Route = createFileRoute("/admin/orders")({
  component: function FulfillmentBoard() {
    const queryClient = useQueryClient();
    const [toastMessage, setToastMessage] = useState("");
    const [editingOrder, setEditingOrder] = useState<OrderDto | null>(null);
    const [patchFormData, setPatchFormData] = useState<PatchOrderDto | null>();

    const { data: orders, isLoading } = useQuery({
      queryKey: ["adminOrders"],
      queryFn: fetchAllOrders,
    });

    const updateOrderMutation = useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        await protectedAxios.patch(`/orders/${id}`, patchFormData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
        setEditingOrder(null);
        setPatchFormData(null);
        setToastMessage("Order updated successfully.");
      },
      onError: () => {
        setToastMessage("Error updating order. Please try again.");
      },
    });

    const openEditForm = (order: OrderDto) => {
      setEditingOrder(order);
      setPatchFormData({
        status: order.status,
        ...(order.fulfillmentMethod === "delivery"
          ? {
              shipment: {
                carrier: order.shipment?.carrier ?? "",
                trackingNumber: order.shipment?.trackingNumber ?? "",
                estimatedDeliveryDate: toDateInputValue(
                  order.shipment?.estimatedDeliveryDate,
                ),
              },
            }
          : {
              pickup: {
                expectedPickupDate: toDateInputValue(
                  order.pickup?.expectedPickupDate,
                ),
              },
            }),
      });
    };

    const closeEditForm = () => {
      if (updateOrderMutation.isPending) {
        return;
      }

      setEditingOrder(null);
      setPatchFormData(null);
    };

    if (isLoading) {
      return <LoadingSpinner />;
    }
    return (
      <section className="fulfillment-board mt-4">
        <Container>
          <div className="fulfillment-board__wrap">
            <h1 className="mb-4">Fulfillment Board</h1>

            <div className="table-responsive shadow-sm bg-white rounded border">
              <Table hover className="align-middle mb-0">
                <thead className="table-light border-bottom">
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Fulfillment</th>
                    <th>Total</th>
                    <th style={{ width: "200px" }}>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((order) => (
                    <tr key={order.id}>
                      <td>{new Date(order.orderDate).toLocaleString()}</td>
                      <td>
                        <div className="d-flex flex-column">
                          {order.customerProfile ? (
                            <span className="fw-medium">
                              {order.customerProfile.firstName}{" "}
                              {order.customerProfile.lastName}
                            </span>
                          ) : null}
                          <span className="text-muted small">
                            {order.customerEmail || "Unknown User"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge bg="secondary" className="text-capitalize">
                          {order.fulfillmentMethod}
                        </Badge>
                      </td>
                      <td className="fw-bold">
                        $
                        {parseFloat(
                          order.financials.finalTotal.toString(),
                        ).toFixed(2)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="secondary" className="text-capitalize">
                            {order.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openEditForm(order)}
                            disabled={updateOrderMutation.isPending}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <Modal show={!!editingOrder} onHide={closeEditForm} centered>
              <Modal.Header closeButton>
                <Modal.Title>Update order {editingOrder?.id}</Modal.Title>
              </Modal.Header>
              {editingOrder && patchFormData ? (
                <Form
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateOrderMutation.mutate({
                      id: editingOrder.id,
                    });
                  }}
                >
                  <Modal.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={patchFormData.status}
                        onChange={(event) =>
                          setPatchFormData((previous) =>
                            previous
                              ? {
                                  ...previous,
                                  status: event.target
                                    .value as PatchOrderDto["status"],
                                }
                              : previous,
                          )
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Form.Select>
                    </Form.Group>
                    {editingOrder.fulfillmentMethod === "delivery" &&
                    patchFormData.shipment ? (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Carrier</Form.Label>
                          <Form.Control
                            value={patchFormData.shipment.carrier ?? ""}
                            onChange={(event) =>
                              setPatchFormData((previous) =>
                                previous?.shipment
                                  ? {
                                      ...previous,
                                      shipment: {
                                        ...previous.shipment,
                                        carrier: event.target.value,
                                      },
                                    }
                                  : previous,
                              )
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Tracking number</Form.Label>
                          <Form.Control
                            value={patchFormData.shipment.trackingNumber ?? ""}
                            onChange={(event) =>
                              setPatchFormData((previous) =>
                                previous?.shipment
                                  ? {
                                      ...previous,
                                      shipment: {
                                        ...previous.shipment,
                                        trackingNumber: event.target.value,
                                      },
                                    }
                                  : previous,
                              )
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Estimated delivery date</Form.Label>
                          <Form.Control
                            type="date"
                            value={
                              patchFormData.shipment.estimatedDeliveryDate ?? ""
                            }
                            onChange={(event) =>
                              setPatchFormData((previous) =>
                                previous?.shipment
                                  ? {
                                      ...previous,
                                      shipment: {
                                        ...previous.shipment,
                                        estimatedDeliveryDate:
                                          event.target.value,
                                      },
                                    }
                                  : previous,
                              )
                            }
                          />
                        </Form.Group>
                      </>
                    ) : null}
                    {editingOrder.fulfillmentMethod === "pickup" &&
                    patchFormData.pickup ? (
                      <Form.Group className="mb-3">
                        <Form.Label>Expected pickup date</Form.Label>
                        <Form.Control
                          type="date"
                          value={patchFormData.pickup.expectedPickupDate ?? ""}
                          onChange={(event) =>
                            setPatchFormData((previous) =>
                              previous?.pickup
                                ? {
                                    ...previous,
                                    pickup: {
                                      ...previous.pickup,
                                      expectedPickupDate: event.target.value,
                                    },
                                  }
                                : previous,
                            )
                          }
                        />
                      </Form.Group>
                    ) : null}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={closeEditForm}
                      disabled={updateOrderMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateOrderMutation.isPending}
                    >
                      {updateOrderMutation.isPending
                        ? "Saving..."
                        : "Save changes"}
                    </Button>
                  </Modal.Footer>
                </Form>
              ) : null}
            </Modal>
            <ToastContainer
              position="bottom-end"
              className="p-3 position-fixed"
            >
              <Toast
                onClose={() => setToastMessage("")}
                show={!!toastMessage}
                delay={3000}
                autohide
                bg="dark"
              >
                <Toast.Body className="text-white fw-medium">
                  {toastMessage}
                </Toast.Body>
              </Toast>
            </ToastContainer>
          </div>
        </Container>
      </section>
    );
  },
});
