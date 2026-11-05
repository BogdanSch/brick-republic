import { useState } from "react";
import { Badge, Form } from "react-bootstrap";

type CollectionInputProps = {
  name: string;
  items: string[];
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  label: string;
  placeholder?: string;
};

export function CollectionInput({
  name,
  items,
  setFormData,
  label,
  placeholder,
}: CollectionInputProps) {
  const [inputValue, setInputValue] = useState<string>("");

  const handleAddListItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed || items.includes(trimmed)) return;

      setFormData((prev: any) => ({
        ...prev,
        [name]: [...(prev[name] || []), trimmed],
      }));
      setInputValue("");
    }
  };

  const handleRemoveListItem = (itemToRemove: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: prev[name].filter((item: string) => item !== itemToRemove),
    }));
  };

  return (
    <>
      <Form.Label>{label} (Press Enter to add)</Form.Label>
      <div
        className="p-2 border rounded bg-light mb-2 d-flex flex-wrap gap-2"
        style={{ minHeight: "45px" }}
      >
        {items?.map((item) => (
          <Badge
            key={item}
            bg="dark"
            className="d-flex align-items-center fs-6 fw-normal px-2 py-1"
          >
            {item}
            <span
              style={{ cursor: "pointer", paddingLeft: "8px" }}
              onClick={() => handleRemoveListItem(item)}
            >
              &times;
            </span>
          </Badge>
        ))}
      </div>
      <Form.Control
        name={name}
        type="text"
        placeholder={placeholder || `Type...`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
          handleAddListItem(e)
        }
      />
    </>
  );
}
