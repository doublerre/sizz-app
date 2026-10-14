import { useToast } from "../../../context/useToast";
import { useCallback, useState } from "react";
import { scholarshipService as api } from "../../../services/scholarship.service";
import { apiMessage, useApiResource } from "../../../hooks/useApiResource";
import type { Category, Period } from "../../../services/scholarship.types";
import TableActions from "../../../components/scholarships/TableActions";
import DateInput from "../../../components/DateInput";
import { dateLabel, money } from "../../../data/scholarships";
import {
  AdminScholarshipNav,
  LoadState,
  ScholarshipButton,
  ScholarshipField,
  ScholarshipHeader,
} from "../../../components/scholarships/ScholarshipUI";

const emptyCategory = {
  code: "",
  name: "",
  monthlyAmount: 0,
  monthlyHours: 60,
  active: true,
};
export default function CatalogsPage() {
  const resource = useApiResource(
    useCallback(async () => {
      const [periods, categories] = await Promise.all([
        api.periods(),
        api.categories(),
      ]);
      return { periods, categories };
    }, []),
  );
  const [category, setCategory] = useState<Omit<Category, "id">>(emptyCategory);
  const [categoryId, setCategoryId] = useState("");
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function togglePeriod(period: Period) {
    setBusy(true);
    try {
      await api.setPeriodActive(period.id, !period.active);
      resource.reload();
      toast.success(
        `Periodo ${period.active ? "deshabilitado" : "habilitado"}.`,
      );
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function createPeriod(form: HTMLFormElement) {
    const fields = new FormData(form);
    const startDate = String(fields.get("startDate"));
    const endDate = String(fields.get("endDate"));
    if (startDate >= endDate) {
      toast.error("El periodo debe terminar después de su fecha de inicio.");
      return;
    }
    setBusy(true);
    try {
      await api.createPeriod({
        name: String(fields.get("name")),
        startDate,
        endDate,
      });
      form.reset();
      resource.reload();
      toast.success("Periodo creado.");
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function saveCategory() {
    setBusy(true);
    try {
      await api.saveCategory(category, categoryId || undefined);
      setCategory(emptyCategory);
      setCategoryId("");
      resource.reload();
      toast.success("Categoría guardada.");
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ScholarshipHeader
        title="Periodos y categorías"
        subtitle="Define semestres, apoyos mensuales y horas base antes de crear convocatorias."
      />
      <main className="sch-admin-content">
        <AdminScholarshipNav />
        <LoadState {...resource} retry={resource.reload} />
        <div className="sch-two-columns">
          <section className="sch-card">
            <h2>Periodos semestrales</h2>
            <div className="sch-table-wrap">
              <table className="sch-table sch-action-table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Fechas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.data?.periods.map((period) => (
                    <tr key={period.id}>
                      <td>
                        <strong>{period.name}</strong>
                      </td>
                      <td>
                        {dateLabel(period.startDate)}
                        <small>{dateLabel(period.endDate)}</small>
                      </td>
                      <td>{period.active ? "Habilitado" : "Deshabilitado"}</td>
                      <td>
                        <TableActions name={period.name}>
                          <button
                            type="button"
                            disabled={busy || resource.loading}
                            onClick={() => void togglePeriod(period)}
                          >
                            {period.active ? "Deshabilitar" : "Habilitar"}
                          </button>
                        </TableActions>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Nuevo periodo</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void createPeriod(e.currentTarget);
              }}
            >
              <div className="sch-fields">
                <ScholarshipField label="Nombre" wide>
                  <input name="name" maxLength={120} required />
                </ScholarshipField>
                <ScholarshipField label="Inicio">
                  <DateInput name="startDate" required disabled={busy} />
                </ScholarshipField>
                <ScholarshipField label="Fin">
                  <DateInput name="endDate" required disabled={busy} />
                </ScholarshipField>
              </div>
              <div className="sch-actions">
                <ScholarshipButton type="submit" disabled={busy}>
                  Crear periodo
                </ScholarshipButton>
              </div>
            </form>
          </section>
          <section className="sch-card">
            <h2>{categoryId ? "Editar categoría" : "Nueva categoría"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveCategory();
              }}
            >
              <div className="sch-fields">
                <ScholarshipField label="Código">
                  <input
                    required
                    maxLength={40}
                    value={category.code}
                    onChange={(e) =>
                      setCategory({ ...category, code: e.target.value })
                    }
                  />
                </ScholarshipField>
                <ScholarshipField label="Nombre">
                  <input
                    required
                    maxLength={100}
                    value={category.name}
                    onChange={(e) =>
                      setCategory({ ...category, name: e.target.value })
                    }
                  />
                </ScholarshipField>
                <ScholarshipField label="Monto mensual (MXN)">
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={category.monthlyAmount}
                    onChange={(e) =>
                      setCategory({
                        ...category,
                        monthlyAmount: e.target.valueAsNumber,
                      })
                    }
                  />
                </ScholarshipField>
                <ScholarshipField label="Horas base mensuales">
                  <input
                    required
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={category.monthlyHours}
                    onChange={(e) =>
                      setCategory({
                        ...category,
                        monthlyHours: e.target.valueAsNumber,
                      })
                    }
                  />
                </ScholarshipField>
              </div>
              <label className="sch-checkbox">
                <input
                  type="checkbox"
                  checked={category.active}
                  onChange={(e) =>
                    setCategory({ ...category, active: e.target.checked })
                  }
                />
                Activa
              </label>
              <div className="sch-actions">
                {categoryId && (
                  <ScholarshipButton
                    tone="secondary"
                    onClick={() => {
                      setCategory(emptyCategory);
                      setCategoryId("");
                    }}
                  >
                    Cancelar edición
                  </ScholarshipButton>
                )}
                <ScholarshipButton type="submit" disabled={busy}>
                  Guardar categoría
                </ScholarshipButton>
              </div>
            </form>
          </section>
        </div>
        <section className="sch-card" style={{ marginTop: 24 }}>
          <h2>Categorías de beca</h2>
          <div className="sch-table-wrap">
            <table className="sch-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Mensualidad</th>
                  <th>Horas base</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {resource.data?.categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.code}</td>
                    <td>{category.name}</td>
                    <td>{money(category.monthlyAmount)}</td>
                    <td>{category.monthlyHours} h</td>
                    <td>{category.active ? "Activa" : "Inactiva"}</td>
                    <td>
                      <ScholarshipButton
                        tone="secondary"
                        disabled={busy}
                        onClick={() => {
                          const { id, ...values } = category;
                          setCategory(values);
                          setCategoryId(id);
                        }}
                      >
                        Editar
                      </ScholarshipButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
