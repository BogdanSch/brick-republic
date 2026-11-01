import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts";
import { baseAxios } from "@/requests";
import { Row, Col, Button, Form, Spinner, Alert, Badge } from "react-bootstrap";
import type { MinifigureDto } from "shared/types/dtos";

const fetchMinifigure = async (id: string): Promise<MinifigureDto> => {
  const { data } = await baseAxios.get<MinifigureDto>(`/minifigures/${id}`);
  return data;
};

export const Route = createFileRoute("/minifigures/detail/$id")({
  component: function ProductDetailsPage() {
    const { id } = Route.useParams();
    const { addToCart } = useCart();

    const [condition, setCondition] = useState<"new" | "used">("new");

    const {
      data: minifigure,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["minifigure", id],
      queryFn: () => fetchMinifigure(id),
    });

    if (isLoading)
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    if (error)
      return <Alert variant="danger">Error loading minifigure details.</Alert>;
    if (!minifigure)
      return <Alert variant="warning">Minifigure not found.</Alert>;

    const currentStock =
      condition === "new"
        ? minifigure.stock.newCondition
        : minifigure.stock.usedCondition;
    const isOutOfStock = currentStock === 0;

    const handleAddToCart = () => {
      addToCart({
        minifigureId: minifigure.id,
        name: minifigure.name,
        condition: condition,
        quantity: 1,
        priceAtPurchase: minifigure.pricing.retailPrice,
      });
    };

    return (
      <section className="product-detail mt-4">
        <Row className="gy-4">
          <Col md={6}>
            <div className="product-detail__image-wrapper bg-light rounded d-flex align-items-center justify-content-center p-5 border h-100">
              <img  />
            </div>
          </Col>

          <Col md={6}>
            <div className="product-detail__info d-flex flex-column h-100 ps-md-3">
              <Badge
                bg="secondary"
                className="align-self-start mb-2 text-capitalize"
              >
                {minifigure.theme.name}
              </Badge>
              <h1 className="mb-2">{minifigure.name}</h1>
              <p className="text-muted mb-4">
                Released: {minifigure.yearReleased}
              </p>

              <h2 className="fs-1 fw-bold mb-4">
                ${minifigure.pricing.retailPrice.toFixed(2)}
              </h2>

              <Form className="mb-4">
                <Form.Label className="fw-semibold">
                  Select Condition
                </Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    id="condition-new"
                    label={`New (${minifigure.stock.newCondition} in stock)`}
                    name="condition"
                    checked={condition === "new"}
                    onChange={() => setCondition("new")}
                  />
                  <Form.Check
                    type="radio"
                    id="condition-used"
                    label={`Used (${minifigure.stock.usedCondition} in stock)`}
                    name="condition"
                    checked={condition === "used"}
                    onChange={() => setCondition("used")}
                  />
                </div>
              </Form>

              <div className="mt-auto">
                <Button
                  variant="dark"
                  size="lg"
                  className="w-100 fw-bold py-3"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>

              {minifigure.tags && minifigure.tags.length > 0 && (
                <div className="mt-4 pt-4 border-top">
                  <span className="fw-semibold d-block mb-2">Tags:</span>
                  <div className="d-flex flex-wrap gap-2">
                    {minifigure.tags.map((tag) => (
                      <Badge
                        key={tag}
                        bg="light"
                        text="dark"
                        className="border"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </section>
    );
  },
});
