import { useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, () => void, boolean] {
  const [value, setValue] = useState<T>(() => {
    const jsonValue = localStorage.getItem(key);
    if (jsonValue) 
        return JSON.parse(jsonValue) as T;
    return defaultValue;
  });

  useEffect(() => {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  const removeItem = () => {
    localStorage.removeItem(key);
    setValue(defaultValue);
  };

  return [value, setValue, removeItem, true];
}

export default useLocalStorage;
