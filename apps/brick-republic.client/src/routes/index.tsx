import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCart } from "../contexts";
import {
  LoadingSpinner,
  PriceRangeSlider,
  snapMaxToStep,
  type PriceRange,
} from "@/components";
import { baseAxios } from "@/requests";
import {
  Card,
  Button,
  Alert,
  Badge,
  Container,
  Form,
  InputGroup,
} from "react-bootstrap";
import type { MinifigureCollectionDto, ThemeDto } from "shared/types/dtos";
import "@/scss/templates/catalog.scss";

const fetchThemes = async (): Promise<ThemeDto[]> => {
  const { data } = await baseAxios.get<{ items: ThemeDto[] }>("/themes");
  return data.items;
};

const fetchMinifigures = async (
  priceRange: PriceRange | null,
  search: string,
): Promise<MinifigureCollectionDto> => {
  const { data } = await baseAxios.get<MinifigureCollectionDto>(
    "/minifigures",
    {
      params: {
        ...(priceRange
          ? { minPrice: priceRange.min, maxPrice: priceRange.max }
          : {}),
        searchQuery: search,
      },
    },
  );
  return data;
};

export const Route = createFileRoute("/")({
  component: function HomePage() {
    const { addToCart } = useCart();
    const [catalogMax, setCatalogMax] = useState<number | null>(null);
    const [sliderRange, setSliderRange] = useState<PriceRange | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [committedRange, setCommittedRange] = useState<PriceRange | null>(
      null,
    );

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
      isFetching: isFetchingCatalog,
      error: errorCatalog,
    } = useQuery({
      queryKey: ["minifigures", committedRange, search],
      queryFn: () => fetchMinifigures(committedRange, search),
      placeholderData: keepPreviousData,
    });

    useEffect(() => {
      if (!minifiguresCollection || catalogMax !== null) return;

      const alignedMax = snapMaxToStep(minifiguresCollection.maxPrice ?? 0);
      setCatalogMax(alignedMax);
      setSliderRange({ min: 0, max: alignedMax });
    }, [minifiguresCollection, catalogMax]);

    if (isLoadingThemes || (isLoadingCatalog && !minifiguresCollection)) {
      return <LoadingSpinner />;
    }
    if (errorThemes || errorCatalog) {
      return <Alert variant="danger">Error loading catalog data.</Alert>;
    }
    const sliderMax = catalogMax ?? 0;
    return (
      <section className="catalog">
        <Container>
          <div className="catalog__wrapper">
            <h1 className="mt-5 mb-4">Minifigure Catalog</h1>
            <div className="row justify-content-center mb-1">
              <div className="col-12 col-md-8 col-lg-6">
                <Form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSearch(searchInput);
                  }}
                >
                  <InputGroup>
                    <Form.Control
                      name="searchQuery"
                      type="search"
                      aria-label="Search minifigures"
                      placeholder="Search minifigures..."
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                    />
                    <Button type="submit" variant="dark" aria-label="Search">
                      <i className="bi bi-search-heart" aria-hidden="true" />
                    </Button>
                  </InputGroup>
                </Form>
              </div>
            </div>
            <div className="mb-5">
              <PriceRangeSlider
                min={0}
                max={sliderMax}
                value={sliderRange ?? { min: 0, max: sliderMax }}
                onChange={setSliderRange}
                onChangeComplete={setCommittedRange}
              />
            </div>
            <div className={isFetchingCatalog ? "opacity-50" : undefined}>
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
                        className="catalog__theme-icon mt-3"
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
          </div>
        </Container>
      </section>
    );
  },
});
