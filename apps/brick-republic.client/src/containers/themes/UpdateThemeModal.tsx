import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { protectedAxios } from "../../requests";
import type { ThemeDto, UpdateThemeDto } from "shared/types/dtos";

type EditThemeModalProps = {
  show: boolean;
  onHide: () => void;
  theme: ThemeDto | null;
};

export function EditThemeModal({ show, onHide, theme }: EditThemeModalProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<UpdateThemeDto>({
    name: "",
    description: "",
    visuals: { icon: "", heroBanner: "" },
  });

  useEffect(() => {
    if (theme) {
      setFormData({
        name: theme.name,
        description: theme.description,
        visuals: { ...theme.visuals },
      });
    }
  }, [theme]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await protectedAxios.put(`/themes/${theme?.id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      onHide();
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to update theme",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    updateMutation.mutate();
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Theme: {theme?.name}</Modal.Title>
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
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
