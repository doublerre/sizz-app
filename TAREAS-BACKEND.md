# Tareas para el Agente del Backend

**Contexto:** Este documento describe los cambios necesarios en el backend de SIZZ para completar la integración con el frontend. Se generó tras la revisión del PR #19 del frontend (sizz-app).

---

## Tarea 1: Persistir campos adicionales de actividades (experiencias)

**Prioridad:** Alta
**Archivo afectado:** `ActivityService.java`, `ActivityRequest.java`, `ActivityResponse.java`, entidad `Activity`

### Problema
El frontend permite editar y guardar los siguientes campos en el formulario de experiencias/actividades, pero el backend actualmente solo persiste `name`, `description`, y `duration`. Los demás campos se ignoran al guardar, por lo que tras recargar se pierden los valores editados y el frontend vuelve a mostrar valores por defecto.

### Campos que el frontend envía en `ActivityRequest`

| Campo | Tipo | Descripción | Valor por defecto del frontend |
|---|---|---|---|
| `name` | String | Nombre de la actividad | — |
| `description` | String | Descripción | — |
| `duration` | Integer | Duración en minutos | 30 |
| `topic` | Enum | Categoría: FISICA, ASTRONOMIA, OPTICA, INFANTIL, AMBIENTE, TECNOLOGIA | FISICA |
| `status` | Enum | Estado: DRAFT, PUBLISHED, INACTIVE, REVIEW | DRAFT |
| `minAge` | Integer (nullable) | Edad mínima | null |
| `maxAge` | Integer (nullable) | Edad máxima | null |
| `maxCapacity` | Integer | Cupo máximo | 1 |
| `location` | String | Ubicación | "Sala principal" |
| `targetAudience` | String (nullable) | Público objetivo (lista separada por comas) | null |
| `catalogOrder` | Integer (nullable) | Orden en catálogo | null |
| `color` | String (nullable) | Color de etiqueta | null |
| `tag` | String (nullable) | Etiqueta/label | null |
| `showInCatalog` | Boolean | Visible en catálogo público | true |
| `isReservable` | Boolean | Disponible para reserva | true |

### Qué se requiere

1. **Actualizar la entidad `Activity`** para incluir las columnas faltantes:
   - `topic` (VARCHAR o ENUM)
   - `status` (VARCHAR o ENUM: DRAFT, PUBLISHED, INACTIVE, REVIEW)
   - `minAge` (INTEGER, nullable)
   - `maxAge` (INTEGER, nullable)
   - `maxCapacity` (INTEGER)
   - `location` (VARCHAR)
   - `targetAudience` (VARCHAR, nullable)
   - `catalogOrder` (INTEGER, nullable)
   - `color` (VARCHAR, nullable)
   - `tag` (VARCHAR, nullable)
   - `showInCatalog` (BOOLEAN)
   - `isReservable` (BOOLEAN)

2. **Actualizar `ActivityRequest`** DTO para recibir todos los campos listados arriba (actualmente solo tiene name, description, duration).

3. **Actualizar `ActivityService`** para:
   - Persistir todos los campos del request en la entidad.
   - En el método `update`, no forzar `active=true` — respetar el `status` enviado.
   - Soportar el cambio de estado (DRAFT → PUBLISHED, etc.).

4. **Actualizar `ActivityResponse`** DTO para devolver todos los campos (actualmente devuelve solo un subconjunto).

5. **Generar la migración de base de datos** correspondiente para las nuevas columnas.

### Contrato de la API (sin cambios en las URLs)
- `GET /api/catalog/activities` — devuelve lista con todos los campos
- `GET /api/catalog/activities/{id}` — devuelve una actividad con todos los campos
- `POST /api/catalog/activities` — crea con todos los campos del request
- `PUT /api/catalog/activities/{id}` — actualiza todos los campos, incluyendo status

### Validación
- Al editar el cupo, ubicación, estado, visibilidad o público desde el frontend, los valores deben persistir y volver al consultar de nuevo.
- El cambio de estado (borrador → publicada, etc.) debe reflejarse en la respuesta del backend.

---

## Tarea 2: Implementar endpoints de recuperación de contraseña

**Prioridad:** Media
**Archivo afectado:** `AuthController.java`, `AuthService.java`

### Problema
El frontend tiene páginas completas para recuperación de contraseña (`ForgotPasswordPage` y `ResetPasswordPage`), pero el backend no expone los endpoints necesarios. Actualmente el enlace de recuperación está deshabilitado temporalmente en el login.

### Flujo esperado (coherente con el flujo OTP existente)

El patrón ya existe en el backend para registro: se envía un código OTP por correo y luego se valida. La recuperación debe seguir el mismo patrón.

#### Endpoint 1: Solicitar código de recuperación

```
POST /api/auth/forgot-password
```

**Request body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Comportamiento esperado:**
- Si el email existe en la base de datos, generar un código OTP de 6 dígitos.
- Enviar el código por correo al usuario.
- Almacenar el código con un tiempo de expiración (ej. 10 minutos) asociado al email.
- Devolver `204 No Content` (no revelar si el email existe o no por seguridad).

**Request DTO sugerido:**
```java
public record ForgotPasswordRequest(String email) {}
```

#### Endpoint 2: Restablecer contraseña

```
POST /api/auth/reset-password
```

**Request body:**
```json
{
  "email": "usuario@ejemplo.com",
  "code": "123456",
  "newPassword": "nuevacontrasena123"
}
```

**Comportamiento esperado:**
- Validar que el código OTP sea correcto y no haya expirado.
- Verificar que el email coincida.
- Hashear y actualizar la contraseña del usuario.
- Invalidar cualquier código OTP usado.
- Devolver `204 No Content` en caso de éxito.
- Devolver `400 Bad Request` si el código es incorrecto o expirado.
- Devolver `404 Not Found` si el email no existe.

**Request DTO sugerido:**
```java
public record ResetPasswordRequest(String email, String code, String newPassword) {}
```

### Validación
- El código debe expirar tras el tiempo configurado (ej. 10 min).
- Un código usado una vez no debe poder reutilizarse.
- La nueva contraseña debe cumplir las mismas reglas de validación que el registro.
- Si el email no existe, no revelar que no existe (mismo comportamiento que login).

### Habilitación en el frontend
Una vez implementados y probados estos endpoints, el enlace "¿Olvidaste tu contraseña?" en `Login.tsx` puede reactivarse (actualmente está comentado temporalmente).

---

## Resumen de prioridades

| Tarea | Impacto | Descripción |
|---|---|---|
| 1. Campos de actividades | Alta | Sin esto, los datos editados se pierden al recargar |
| 2. Recuperación de contraseña | Media | Funcionalidad completa de autenticación |
