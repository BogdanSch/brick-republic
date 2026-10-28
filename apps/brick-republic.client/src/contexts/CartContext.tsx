import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";

export type CartItem = {
  minifigureId: string;
  name: string;
  condition: "new" | "used";
  quantity: number;
  priceAtPurchase: number;
};

type CartContextType = {
  items: CartItem[];
  itemsTotal: number;
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: string, condition: string, delta: number) => void;
  removeFromCart: (id: string, condition: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const itemsTotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.priceAtPurchase * item.quantity,
      0,
    );
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.minifigureId === newItem.minifigureId &&
          i.condition === newItem.condition,
      );
      if (existing) {
        return prev.map((i) =>
          i === existing
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i,
        );
      }
      return [...prev, newItem];
    });
  };

  const updateQuantity = (id: string, condition: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.minifigureId === id && item.condition === condition) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string, condition: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.minifigureId === id && i.condition === condition)),
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemsTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
