import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { baseAxios } from "@/requests";
import {
  Table,
  Spinner,
  Form,
  Badge,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { useState } from "react";
import type { OrderDto } from "shared/types/dtos";

const fetchAllOrders = async (): Promise<OrderDto[]> => {
  const { data } = await baseAxios.get<{ orders: OrderDto[] }>("/orders");
  return data.orders;
};

export const Route = createFileRoute("/admin/orders")({
  component: function FulfillmentBoard() {
    const queryClient = useQueryClient();
    const [toastMessage, setToastMessage] = useState("");

    const { data: orders, isLoading } = useQuery({
      queryKey: ["adminOrders"],
      queryFn: fetchAllOrders,
    });

    const updateStatusMutation = useMutation({
      mutationFn: async ({ id, status }: { id: string; status: string }) => {
        await baseAxios.patch(`/orders/${id}/status`, { status });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
        setToastMessage("Order status updated successfully.");
      },
      onError: () => {
        setToastMessage("Error updating status. Please try again.");
      },
    });

    if (isLoading) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    }

    return (
      <section className="fulfillment-board mt-4">
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
                    {parseFloat(order.financials.finalTotal.toString()).toFixed(
                      2,
                    )}
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={order.status}
                      disabled={updateStatusMutation.isPending}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: order.id,
                          status: e.target.value,
                        })
                      }
                      className="shadow-none border-secondary"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <ToastContainer position="bottom-end" className="p-3 position-fixed">
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
      </section>
    );
  },
});
