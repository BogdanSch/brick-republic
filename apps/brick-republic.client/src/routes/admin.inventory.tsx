import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { baseAxios, protectedAxios } from "@/requests";
import {
  Table,
  Button,
  Spinner,
  Badge,
  Card,
  Row,
  Col,
  Container,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  CreateMinifigureModal,
  EditMinifigureModal,
  CreateThemeModal,
  EditThemeModal,
} from "@/containers";
import type { MinifigureDto, ThemeDto } from "shared/types/dtos";
import "@/scss/templates/inventory.scss";

const fetchMinifigures = async (
  themeId: string | null,
): Promise<MinifigureDto[]> => {
  const url = themeId ? `/minifigures?themeId=${themeId}` : "/minifigures";
  const { data } = await baseAxios.get<{ items: MinifigureDto[] }>(url);
  return data.items;
};

const fetchThemes = async (): Promise<ThemeDto[]> => {
  const { data } = await baseAxios.get<{ items: ThemeDto[] }>("/themes");
  return data.items;
};

export const Route = createFileRoute("/admin/inventory")({
  component: function InventoryManager() {
    const queryClient = useQueryClient();
    const [showCreateTheme, setShowCreateTheme] = useState<boolean>(false);
    const [editTheme, setEditTheme] = useState<ThemeDto | null>(null);
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);

    const [showCreateMinifigure, setShowCreateMinifigure] =
      useState<boolean>(false);
    const [editMinifigure, setEditMinifigure] = useState<MinifigureDto | null>(
      null,
    );

    const [inflationRate, setInflationRate] = useState<string>("3.5");

    const { data: themes, isLoading: isLoadingThemes } = useQuery({
      queryKey: ["themes"],
      queryFn: fetchThemes,
    });

    const { data: minifigures, isLoading: isLoadingMinifigures } = useQuery({
      queryKey: ["minifigures", activeThemeId],
      queryFn: () => fetchMinifigures(activeThemeId),
      enabled: !!activeThemeId,
    });

    const adjustPricesMutation = useMutation({
      mutationFn: async (percentage: number) => {
        await protectedAxios.patch("/minifigures/batch/inflation", {
          inflationPercentage: percentage,
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["minifigures"] });
      },
    });

    const handleInflationSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      const parsedRate = parseFloat(inflationRate);
      if (!isNaN(parsedRate)) {
        adjustPricesMutation.mutate(parsedRate);
      }
    };

    if (isLoadingThemes) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    }

    const activeThemeData = themes?.find(
      (themeElement) => themeElement.id === activeThemeId,
    );

    return (
      <section className="inventory-board mt-4">
        <Container>
          <div className="inventory-board__wrap">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
              <h1 className="mb-0">Theme Manager</h1>

              <div className="d-flex align-items-center gap-3">
                <Form
                  onSubmit={handleInflationSubmit}
                  className="d-flex align-items-center gap-2"
                >
                  <InputGroup size="sm">
                    <Form.Control
                      type="number"
                      step="0.1"
                      value={inflationRate}
                      onChange={(event) => setInflationRate(event.target.value)}
                      aria-label="Inflation rate percentage"
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                  <Button
                    variant="outline-dark"
                    size="sm"
                    type="submit"
                    disabled={adjustPricesMutation.isPending}
                  >
                    {adjustPricesMutation.isPending
                      ? "Applying..."
                      : "Apply Global Inflation"}
                  </Button>
                </Form>

                <Button variant="dark" onClick={() => setShowCreateTheme(true)}>
                  + Add Theme
                </Button>
              </div>
            </div>

            <Row className="mb-5 gy-3">
              {themes?.map((theme) => (
                <Col md={4} lg={3} key={theme.id}>
                  <Card
                    className={`h-100 shadow-sm inventory-board__card ${
                      activeThemeId === theme.id
                        ? "border-dark border-2"
                        : "border-0 bg-light"
                    }`}
                    onClick={() => setActiveThemeId(theme.id)}
                  >
                    <Card.Img
                      variant="top"
                      src={theme.visuals.icon}
                      alt={theme.name}
                    />
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="fs-5 mb-0">
                          {theme.name}
                        </Card.Title>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditTheme(theme);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      <Card.Text className="text-muted small mb-0 text-truncate">
                        {theme.description}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {activeThemeId ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4 pt-4 border-top">
                  <div>
                    <h2 className="mb-0 fs-3">Minifigures</h2>
                    <p className="text-muted mb-0">
                      Currently viewing:{" "}
                      <strong>{activeThemeData?.name}</strong>
                    </p>
                  </div>
                  <Button
                    variant="dark"
                    onClick={() => setShowCreateMinifigure(true)}
                  >
                    + Add Minifigure
                  </Button>
                </div>

                <div className="table-responsive shadow-sm bg-white rounded border">
                  {isLoadingMinifigures ? (
                    <Spinner
                      animation="border"
                      className="d-block mx-auto my-4"
                    />
                  ) : (
                    <Table hover className="align-middle mb-0">
                      <thead className="table-light border-bottom">
                        <tr>
                          <th className="inventory-board__col-image">Image</th>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Stock (N/U)</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {minifigures?.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-4 text-muted"
                            >
                              No minifigures found in this theme.
                            </td>
                          </tr>
                        ) : (
                          minifigures?.map((minifigure) => (
                            <tr key={minifigure.id}>
                              <td className="inventory-board__col-image">
                                {minifigure.previewUrl ? (
                                  <img
                                    src={minifigure.previewUrl}
                                    alt="preview"
                                    className="inventory-board__preview-img"
                                  />
                                ) : (
                                  <span className="text-muted small">None</span>
                                )}
                              </td>
                              <td className="fw-medium">{minifigure.name}</td>
                              <td>
                                <div>
                                  New: $
                                  {minifigure.pricing.retailPrice.toFixed(2)}
                                </div>
                                <div>
                                  Used: $
                                  {minifigure.pricing.usedRetailPrice.toFixed(
                                    2,
                                  )}
                                </div>
                              </td>
                              <td>
                                <Badge
                                  bg={
                                    minifigure.stock.newCondition > 0
                                      ? "success"
                                      : "danger"
                                  }
                                  className="me-2"
                                >
                                  New: {minifigure.stock.newCondition}
                                </Badge>
                                <Badge
                                  bg={
                                    minifigure.stock.usedCondition > 0
                                      ? "info"
                                      : "warning"
                                  }
                                  text="dark"
                                >
                                  Used: {minifigure.stock.usedCondition}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <Button
                                  variant="outline-dark"
                                  size="sm"
                                  onClick={() => setEditMinifigure(minifigure)}
                                >
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-5 border-top text-muted">
                <h3 className="fs-4">
                  Select a theme above to view its minifigures
                </h3>
              </div>
            )}

            <CreateThemeModal
              show={showCreateTheme}
              onHide={() => setShowCreateTheme(false)}
            />
            <EditThemeModal
              show={!!editTheme}
              onHide={() => setEditTheme(null)}
              theme={editTheme}
            />
            <CreateMinifigureModal
              show={showCreateMinifigure}
              onHide={() => setShowCreateMinifigure(false)}
              themes={themes || []}
            />
            <EditMinifigureModal
              show={!!editMinifigure}
              onHide={() => setEditMinifigure(null)}
              themes={themes || []}
              minifigure={editMinifigure}
            />
          </div>
        </Container>
      </section>
    );
  },
});
