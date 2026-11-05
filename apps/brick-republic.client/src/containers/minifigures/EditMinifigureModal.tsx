import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { protectedAxios } from "@/requests";
import type {
  MinifigureDto,
  ThemeDto,
  UpdateMinifigureDto,
} from "shared/types/dtos";
import { CollectionInput } from "@/components";

type EditMinifigureModalProps = {
  show: boolean;
  onHide: () => void;
  themes: ThemeDto[];
  minifigure: MinifigureDto | null;
};

const getDefaultFormData = (): UpdateMinifigureDto => ({
  name: "",
  previewUrl: "",
  themeId: "",
  yearReleased: new Date().getFullYear(),
  retailPrice: 0,
  usedRetailPrice: 0,
  stock: { newCondition: 0, usedCondition: 0 },
  accessories: [],
  tags: [],
});

export function EditMinifigureModal({
  show,
  onHide,
  themes,
  minifigure,
}: EditMinifigureModalProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [formData, setFormData] =
    useState<UpdateMinifigureDto>(getDefaultFormData());

  useEffect(() => {
    if (minifigure) {
      setFormData({
        name: minifigure.name,
        previewUrl: minifigure.previewUrl || "",
        themeId: minifigure.theme.id,
        yearReleased: minifigure.yearReleased,
        retailPrice: parseFloat(minifigure.pricing.retailPrice.toString()),
        usedRetailPrice: parseFloat(
          minifigure.pricing.usedRetailPrice?.toString() ??
            minifigure.pricing.retailPrice.toString(),
        ),
        stock: { ...minifigure.stock },
        accessories: minifigure.accessories ? [...minifigure.accessories] : [],
        tags: minifigure.tags ? [...minifigure.tags] : [],
      });
    }
  }, [minifigure]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await protectedAxios.put(`/minifigures/${minifigure?.id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minifigures"] });
      onHide();
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to update minifigure",
      );
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("stock.")) {
      const stockKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        stock: { ...prev.stock, [stockKey]: Number(value) },
      }));
    } else if (
      name === "yearReleased" ||
      name === "retailPrice" ||
      name === "usedRetailPrice"
    ) {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    updateMutation.mutate();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Minifigure: {minifigure?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Row className="gy-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Theme</Form.Label>
                <Form.Select
                  required
                  name="themeId"
                  value={formData.themeId}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Select Theme...
                  </option>
                  {themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Preview Image URL</Form.Label>
                <Form.Control
                  type="url"
                  name="previewUrl"
                  value={formData.previewUrl}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>New Retail Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  required
                  name="retailPrice"
                  value={formData.retailPrice}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Used Retail Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  name="usedRetailPrice"
                  value={formData.usedRetailPrice}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Stock (New)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  required
                  name="stock.newCondition"
                  value={formData.stock.newCondition}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Stock (Used)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  required
                  name="stock.usedCondition"
                  value={formData.stock.usedCondition}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <CollectionInput
                  name={"accessories"}
                  items={formData.accessories || []}
                  setFormData={setFormData}
                  label={"Accessories (Press Enter to add)"}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <CollectionInput
                  name={"tags"}
                  items={formData.tags || []}
                  setFormData={setFormData}
                  label={"Tags (Press Enter to add)"}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="dark"
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
