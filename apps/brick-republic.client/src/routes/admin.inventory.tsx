import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { baseAxios } from "@/requests";
import { Table, Button, Spinner, Badge } from "react-bootstrap";
import {
  CreateMinifigureModal,
  EditMinifigureModal,
} from "@/containers";
import type { MinifigureDto, ThemeDto } from "shared/types/dtos";

const fetchMinifigures = async (): Promise<MinifigureDto[]> => {
  const { data } = await baseAxios.get<{ items: MinifigureDto[] }>(
    "/minifigures",
  );
  return data.items;
};

const fetchThemes = async (): Promise<ThemeDto[]> => {
  const { data } = await baseAxios.get<{ items: ThemeDto[] }>("/themes");
  return data.items;
};

export const Route = createFileRoute("/admin/inventory")({
  component: function InventoryManager() {
    const [showCreate, setShowCreate] = useState(false);
    const [editMinifigure, setEditMinifigure] = useState<MinifigureDto | null>(
      null,
    );

    const { data: minifigures, isLoading: isLoadingMf } = useQuery({
      queryKey: ["minifigures"],
      queryFn: fetchMinifigures,
    });

    const { data: themes, isLoading: isLoadingThemes } = useQuery({
      queryKey: ["themes"],
      queryFn: fetchThemes,
    });

    if (isLoadingMf || isLoadingThemes) {
      return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    }

    return (
      <section className="inventory-board mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="mb-0">Inventory Manager</h1>
          <Button variant="dark" onClick={() => setShowCreate(true)}>
            + Add Minifigure
          </Button>
        </div>

        <div className="table-responsive shadow-sm bg-white rounded border">
          <Table hover className="align-middle mb-0">
            <thead className="table-light border-bottom">
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Theme</th>
                <th>Price</th>
                <th>Stock (N/U)</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {minifigures?.map((mf) => (
                <tr key={mf.id}>
                  <td style={{ width: "80px" }}>
                    {mf.previewUrl ? (
                      <img
                        src={mf.previewUrl}
                        alt="preview"
                        style={{ height: "40px", objectFit: "contain" }}
                      />
                    ) : (
                      <span className="text-muted small">None</span>
                    )}
                  </td>
                  <td className="fw-medium">{mf.name}</td>
                  <td>
                    <Badge bg="secondary">{mf.theme.name}</Badge>
                  </td>
                  <td>
                    ${parseFloat(mf.pricing.retailPrice.toString()).toFixed(2)}
                  </td>
                  <td>
                    <Badge
                      bg={mf.stock.newCondition > 0 ? "success" : "danger"}
                      className="me-2"
                    >
                      New: {mf.stock.newCondition}
                    </Badge>
                    <Badge
                      bg={mf.stock.usedCondition > 0 ? "info" : "warning"}
                      text="dark"
                    >
                      Used: {mf.stock.usedCondition}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => setEditMinifigure(mf)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <CreateMinifigureModal
          show={showCreate}
          onHide={() => setShowCreate(false)}
          themes={themes || []}
        />
        <EditMinifigureModal
          show={!!editMinifigure}
          onHide={() => setEditMinifigure(null)}
          themes={themes || []}
          minifigure={editMinifigure}
        />
      </section>
    );
  },
});
