import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { protectedAxios } from "../../requests";
import type { CreateThemeDto } from "shared/types/dtos";

type CreateThemeModalProps = {
  show: boolean;
  onHide: () => void;
};

export function CreateThemeModal({ show, onHide }: CreateThemeModalProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<CreateThemeDto>({
    name: "",
    description: "",
    visuals: { icon: "", heroBanner: "" },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await protectedAxios.post("/themes", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      onHide();
      setFormData({
        name: "",
        description: "",
        visuals: { icon: "", heroBanner: "" },
      });
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create theme",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    createMutation.mutate();
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Theme</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Icon URL</Form.Label>
            <Form.Control
              type="url"
              required
              value={formData.visuals.icon}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  visuals: { ...formData.visuals, icon: e.target.value },
                })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Hero Banner URL (Optional)</Form.Label>
            <Form.Control
              type="url"
              value={formData.visuals.heroBanner}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  visuals: { ...formData.visuals, heroBanner: e.target.value },
                })
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="dark"
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Saving..." : "Create Theme"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
