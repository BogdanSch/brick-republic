import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../contexts";
import { baseAxios } from "../requests";
import { Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import type { MinifigureDto, ThemeDto } from "shared/types/dtos";

const fetchThemes = async (): Promise<ThemeDto[]> => {
  const { data } = await baseAxios.get<{ items: ThemeDto[] }>("/themes");
  return data.items;
};

const fetchMinifigures = async (): Promise<MinifigureDto[]> => {
  const { data } = await baseAxios.get<{ items: MinifigureDto[] }>(
    "/minifigures",
  );
  return data.items;
};

export const Route = createFileRoute("/")({
  component: function HomePage() {
    const { addToCart } = useCart();

    const {
      data: themes,
      isLoading: isLoadingThemes,
      error: errorThemes,
    } = useQuery({
      queryKey: ["themes"],
      queryFn: fetchThemes,
    });

    const {
      data: minifigures,
      isLoading: isLoadingMinifigures,
      error: errorMinifigures,
    } = useQuery({
      queryKey: ["minifigures"],
      queryFn: fetchMinifigures,
    });

    if (isLoadingThemes || isLoadingMinifigures) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    }
    if (errorThemes || errorMinifigures) {
      return <Alert variant="danger">Error loading catalog data.</Alert>;
    }

    return (
      <section className="catalog">
        <h1 className="mb-4">Minifigure Catalog</h1>

        {themes?.map((theme) => {
          const themeMinifigures =
            minifigures?.filter((mf) => mf.theme.slug === theme.slug) || [];

          return (
            <div key={theme.id} className="catalog__theme-section mb-5">
              <div className="catalog__theme-header mb-3 pb-2 border-bottom">
                <h2 className="fs-3 mb-1">{theme.name}</h2>
                <p className="text-muted mb-0">{theme.description}</p>
              </div>

              {themeMinifigures.length === 0 ? (
                <p className="text-muted italic fs-6">
                  No minifigures currently available for this theme.
                </p>
              ) : (
                <div className="catalog__grid">
                  {themeMinifigures.map((mf) => (
                    <Card
                      key={mf.id}
                      className="catalog__item h-100 shadow-sm border-0 bg-light overflow-hidden"
                    >
                      {mf.previewUrl && (
                        <Link
                          to="/minifigures/detail/$id"
                          params={{ id: mf.id }}
                        >
                          <Card.Img
                            variant="top"
                            src={mf.previewUrl}
                            alt={mf.name}
                            className="catalog__item-image"
                            style={{
                            }}
                          />
                        </Link>
                      )}

                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="fs-5">
                          <Link
                            to="/minifigures/detail/$id"
                            params={{ id: mf.id }}
                            className="text-dark text-decoration-none"
                          >
                            {mf.name}
                          </Link>
                        </Card.Title>
                        <Card.Subtitle className="mb-3 text-muted small">
                          Year: {mf.yearReleased}
                        </Card.Subtitle>

                        <Card.Text className="mb-1 fw-semibold fs-4">
                          ${mf.pricing.retailPrice.toFixed(2)}
                        </Card.Text>

                        <Card.Text className="mb-4">
                          <Badge
                            bg={
                              mf.stock.newCondition > 0 ? "success" : "danger"
                            }
                          >
                            In Stock (New): {mf.stock.newCondition}
                          </Badge>
                        </Card.Text>

                        <Button
                          variant="dark"
                          className="mt-auto fw-medium"
                          disabled={mf.stock.newCondition === 0}
                          onClick={() =>
                            addToCart({
                              minifigureId: mf.id,
                              name: mf.name,
                              condition: "new",
                              quantity: 1,
                              priceAtPurchase: mf.pricing.retailPrice,
                            })
                          }
                        >
                          Add to Cart
                        </Button>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    );
  },
});
