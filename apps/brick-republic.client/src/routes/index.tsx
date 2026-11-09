import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCart } from "../contexts";
import { PriceRangeSlider, type PriceRange } from "../components";
import { baseAxios } from "../requests";
import {
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Container,
} from "react-bootstrap";
import type { MinifigureCollectionDto, ThemeDto } from "shared/types/dtos";
import "@/scss/templates/catalog.scss";

const fetchThemes = async (): Promise<ThemeDto[]> => {
  const { data } = await baseAxios.get<{ items: ThemeDto[] }>("/themes");
  return data.items;
};

const fetchMinifigures = async (
  minPrice?: number,
  maxPrice?: number,
): Promise<MinifigureCollectionDto> => {
  const { data } = await baseAxios.get<MinifigureCollectionDto>(
    "/minifigures",
    {
      params:
        minPrice !== undefined && maxPrice !== undefined
          ? { minPrice: minPrice, maxPrice: maxPrice }
          : undefined,
    },
  );
  return data;
};

export const Route = createFileRoute("/")({
  component: function HomePage() {
    const { addToCart } = useCart();
    const [priceRange, setPriceRange] = useState<{
      min: number;
      max: number;
    } | null>(null);

    const {
      data: themes,
      isLoading: isLoadingThemes,
      error: errorThemes,
    } = useQuery({
      queryKey: ["themes"],
      queryFn: fetchThemes,
    });

    const {
      data: minifiguresCollection,
      isLoading: isLoadingCatalog,
      error: errorCatalog,
      refetch: refetchMinifigures,
    } = useQuery({
      queryKey: ["minifigures"],
      queryFn: () => fetchMinifigures(priceRange?.min, priceRange?.max),
    });

    useEffect(() => {
      setPriceRange({
        min: minifiguresCollection?.minPrice ?? 0,
        max: minifiguresCollection?.maxPrice ?? 0,
      });
    }, [minifiguresCollection]);

    if (isLoadingThemes || isLoadingCatalog) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    }
    if (errorThemes || errorCatalog) {
      return <Alert variant="danger">Error loading catalog data.</Alert>;
    }

    return (
      <section className="catalog">
        <Container>
          <div className="catalog__wrapper">
            <h1 className="mt-5 mb-4">Minifigure Catalog</h1>
            <div className="mb-5">
              <PriceRangeSlider
                min={0}
                max={minifiguresCollection?.maxPrice ?? 0}
                value={priceRange ?? { min: 0, max: 0 }}
                onChange={(value: PriceRange) => {
                  setPriceRange(value);
                  refetchMinifigures();
                }}
              />
            </div>
            {themes?.map((theme) => {
              const themeMinifigures =
                minifiguresCollection?.items?.filter(
                  (mf) => mf.theme.slug === theme.slug,
                ) || [];
              return (
                <div key={theme.id} className="catalog__theme-section mb-5">
                  <div className="catalog__theme-header mb-3 pb-2 border-bottom">
                    <img
                      src={theme.visuals.icon}
                      alt={theme.name}
                      className="catalog__theme-icon img-fluid mt-3"
                    />
                    <h2 className="fs-3 mb-1">{theme.name}</h2>
                    <p className="text-muted mb-0">{theme.description}</p>
                  </div>
                  {themeMinifigures.length === 0 ? (
                    <p className="text-muted italic fs-6 mb-5">
                      No minifigures currently available for this theme.
                    </p>
                  ) : (
                    <div className="catalog__grid mb-5">
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
                                style={{}}
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
                                  mf.stock.newCondition > 0
                                    ? "success"
                                    : "danger"
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
          </div>
        </Container>
      </section>
    );
  },
});
