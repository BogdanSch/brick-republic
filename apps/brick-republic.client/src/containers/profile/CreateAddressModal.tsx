import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { protectedAxios } from "@/requests";
import type { CreateUserAddressDto } from "shared/types/dtos";

const getDefaultAddressForm = (): CreateUserAddressDto => ({
  street: "",
  city: "",
  postalCode: "",
  country: "",
  isDefault: false,
});

type CreateAddressModalProps = {
  show: boolean;
  onHide: () => void;
};

export function CreateAddressModal({ show, onHide }: CreateAddressModalProps) {
  const queryClient = useQueryClient();
  const [newAddressForm, setNewAddressForm] = useState<CreateUserAddressDto>(
    getDefaultAddressForm(),
  );

  const createAddressMutation = useMutation({
    mutationFn: async (payload: CreateUserAddressDto) => {
      await protectedAxios.post("/account/me/addresses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      onHide();
      setNewAddressForm(getDefaultAddressForm());
    },
  });

  const handleAddressSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createAddressMutation.mutate(newAddressForm);
  };

  const handleNewAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value, type, checked } = event.target;
    setNewAddressForm((previousState) => ({
      ...previousState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Form onSubmit={handleAddressSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Street Address</Form.Label>
            <Form.Control
              type="text"
              name="street"
              required
              value={newAddressForm.street}
              onChange={handleNewAddressChange}
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  required
                  value={newAddressForm.city}
                  onChange={handleNewAddressChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Postal Code</Form.Label>
                <Form.Control
                  type="text"
                  name="postalCode"
                  required
                  value={newAddressForm.postalCode}
                  onChange={handleNewAddressChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Country</Form.Label>
            <Form.Control
              type="text"
              name="country"
              required
              value={newAddressForm.country}
              onChange={handleNewAddressChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="isDefault"
              label="Set as default address"
              checked={newAddressForm.isDefault}
              onChange={handleNewAddressChange}
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
            disabled={createAddressMutation.isPending}
          >
            {createAddressMutation.isPending ? "Saving..." : "Save Address"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
