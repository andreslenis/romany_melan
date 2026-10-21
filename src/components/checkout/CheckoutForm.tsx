"use client";

import { useMemo, useState, type FormEvent } from "react";

import { ciudadesPorDepartamento, DEPARTAMENTOS } from "@/lib/colombia";
import type { DireccionEnvio } from "@/lib/types";

export type ModoRegistro = "invitado" | "miembro";

interface Props {
  datos: DireccionEnvio;
  modo: ModoRegistro;
  onDatosChange: (datos: DireccionEnvio) => void;
  onModoChange: (modo: ModoRegistro) => void;
  onSubmit: () => void;
}

const DATOS_VACIOS: DireccionEnvio = {
  nombre: "",
  email: "",
  telefono: "",
  departamento: "",
  ciudad: "",
  direccion: "",
  barrio: "",
  codigoPostal: "",
  notas: "",
};

export function datosIniciales(): DireccionEnvio {
  return { ...DATOS_VACIOS };
}

export default function CheckoutForm({
  datos,
  modo,
  onDatosChange,
  onModoChange,
  onSubmit,
}: Props) {
  const [errores, setErrores] = useState<Record<string, string>>({});

  const ciudades = useMemo(
    () => ciudadesPorDepartamento(datos.departamento),
    [datos.departamento]
  );

  const set = <K extends keyof DireccionEnvio>(
    campo: K,
    valor: DireccionEnvio[K]
  ) => {
    onDatosChange({
      ...datos,
      [campo]: valor,
      ...(campo === "departamento" ? { ciudad: "" } : {}),
    });
  };

  const validar = (): boolean => {
    const err: Record<string, string> = {};

    if (!datos.nombre.trim()) err.nombre = "Ingresa tu nombre completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.email.trim()))
      err.email = "Ingresa un correo válido para enviarte el certificado.";
    if (datos.telefono.replace(/\D/g, "").length < 7)
      err.telefono = "Ingresa un número de contacto válido.";
    if (!datos.departamento) err.departamento = "Selecciona tu departamento.";
    if (!datos.ciudad) err.ciudad = "Selecciona tu ciudad.";
    if (!datos.direccion.trim()) err.direccion = "Ingresa la dirección de entrega.";
    if (!datos.barrio.trim()) err.barrio = "Ingresa el barrio o la descripción de la zona.";

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validar()) onSubmit();
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      <section className="checkout-block">
        <h3 className="checkout-block-title">Datos de contacto</h3>
        <div className="form-grid">
          <label className="form-field form-field--full">
            <span className="form-label">Nombre completo</span>
            <input
              className="form-input"
              value={datos.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Nombre y apellido"
              autoComplete="name"
            />
            {errores.nombre && <span className="form-error">{errores.nombre}</span>}
          </label>

          <label className="form-field">
            <span className="form-label">Email</span>
            <input
              className="form-input"
              type="email"
              value={datos.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
            {errores.email && <span className="form-error">{errores.email}</span>}
          </label>

          <label className="form-field">
            <span className="form-label">Teléfono</span>
            <input
              className="form-input"
              value={datos.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              placeholder="300 123 4567"
              autoComplete="tel"
            />
            {errores.telefono && <span className="form-error">{errores.telefono}</span>}
          </label>
        </div>
      </section>

      <section className="checkout-block">
        <h3 className="checkout-block-title">Identificación</h3>
        <div className="register-options">
          <label className="register-option">
            <input
              type="checkbox"
              checked={modo === "invitado"}
              onChange={() => onModoChange("invitado")}
            />
            <span className="register-option-body">
              <span className="register-option-label">Comprar como invitado</span>
              <span className="register-option-desc">
                Finalizas la compra sin crear un perfil. No podrás consultar Mis
                Historias después.
              </span>
            </span>
          </label>

          <label className="register-option">
            <input
              type="checkbox"
              checked={modo === "miembro"}
              onChange={() => onModoChange("miembro")}
            />
            <span className="register-option-body">
              <span className="register-option-label">
                Crear mi Perfil en el Círculo Romany Melan
              </span>
              <span className="register-option-desc register-option-desc--quote">
                &ldquo;Deseo registrarme para recibir acceso privado a la futura
                Línea Singular (Oro Macizo 18K) y colecciones de edición
                limitada.&rdquo;
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="checkout-block">
        <h3 className="checkout-block-title">Dirección de entrega</h3>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Departamento</span>
            <select
              className="form-input"
              value={datos.departamento}
              onChange={(e) => set("departamento", e.target.value)}
            >
              <option value="">Selecciona un departamento</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d.nombre} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
            </select>
            {errores.departamento && (
              <span className="form-error">{errores.departamento}</span>
            )}
          </label>

          <label className="form-field">
            <span className="form-label">Ciudad</span>
            <select
              className="form-input"
              value={datos.ciudad}
              onChange={(e) => set("ciudad", e.target.value)}
              disabled={!datos.departamento}
            >
              <option value="">
                {datos.departamento ? "Selecciona una ciudad" : "Elige un departamento"}
              </option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errores.ciudad && <span className="form-error">{errores.ciudad}</span>}
          </label>

          <label className="form-field form-field--full">
            <span className="form-label">Dirección</span>
            <input
              className="form-input"
              value={datos.direccion}
              onChange={(e) => set("direccion", e.target.value)}
              placeholder="Calle 10 # 20-30, apartamento 402"
              autoComplete="street-address"
            />
            {errores.direccion && (
              <span className="form-error">{errores.direccion}</span>
            )}
          </label>

          <label className="form-field">
            <span className="form-label">Barrio</span>
            <input
              className="form-input"
              value={datos.barrio}
              onChange={(e) => set("barrio", e.target.value)}
              placeholder="Chapinero"
            />
            {errores.barrio && <span className="form-error">{errores.barrio}</span>}
          </label>

          <label className="form-field">
            <span className="form-label">Código postal <em>(opcional)</em></span>
            <input
              className="form-input"
              value={datos.codigoPostal}
              onChange={(e) => set("codigoPostal", e.target.value)}
              placeholder="110111"
              inputMode="numeric"
            />
          </label>

          <label className="form-field form-field--full">
            <span className="form-label">Cuadro de observaciones</span>
            <span className="form-hint">
              ¿Necesitas otra talla, cambiar el color del hilo o un ajuste
              especial? Déjanoslo por escrito y lo tejemos a tu medida. También
              puedes indicarlo aquí horario de entrega o referencias de la puerta.
            </span>
            <textarea
              className="form-input form-textarea"
              value={datos.notas}
              onChange={(e) => set("notas", e.target.value)}
              placeholder="Ej: el anillo es talla 6 y quiero el hilo color vino, entregar por la mañana..."
              rows={4}
            />
          </label>
        </div>
      </section>

      <button type="submit" className="pdp-add-btn checkout-submit">
        Continuar al Pago
      </button>
    </form>
  );
}
