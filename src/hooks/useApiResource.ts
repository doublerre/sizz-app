import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useToast } from "../context/useToast";

export function apiMessage(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "No se pudo completar la operación. Intenta de nuevo.";
}

export function useApiResource<T>(load: () => Promise<T>) {
  const toast = useToast();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    load: () => Promise<T>;
    revision: number;
    data: T | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setResult({ load, revision, data, error: "" });
      })
      .catch((error) => {
        if (active) {
          const message = apiMessage(error);
          setResult((previous) => ({
            load,
            revision,
            data: previous?.load === load ? previous.data : null,
            error: message,
          }));
          toast.error(message);
        }
      });
    return () => {
      active = false;
    };
  }, [load, revision, toast]);
  const current = result?.load === load && result.revision === revision;
  return {
    data: result?.load === load ? result.data : null,
    loading: !current,
    error: current ? result.error : "",
    reload: () => setRevision((value) => value + 1),
  };
}
