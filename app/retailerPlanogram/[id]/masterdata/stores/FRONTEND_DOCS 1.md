# BlueCompute Stores API — Frontend Developer Guide

---

## 1. Project Overview

The **BlueCompute Stores API** is a backend service that manages store location data. Frontend developers use this API to **list, view, create, update, and delete store records**.

| Item | Detail |
|---|---|
| API Name | BlueCompute Stores API |
| Version | 1.0.0 |
| Base URL (local) | `http://localhost:8000` |
| Interactive Docs | `http://localhost:8000/docs` |
| Authentication | **Not implemented** |
| File Uploads | **Not implemented** |

> **Tip:** Open `http://localhost:8000/docs` in your browser to test every endpoint interactively — no code needed.

---

## 2. Database Table

### `stores`

Holds information about each physical store location.

| Column | API Field Name | Type | Description |
|---|---|---|---|
| `Store` | `store` | Integer | **Primary key.** Unique store number. You must provide this when creating a store. |
| `Region` | `region` | String | Sales region (e.g. `"REG1"`) |
| `District` | `district` | String | District within the region (e.g. `"DISTA"`) |
| `Store Leader` | `store_leader` | String | Name of the store manager |
| `Kitchen` | `kitchen` | String | Whether the store has a kitchen (e.g. `"Yes"`) |
| `Kitchen Manager` | `kitchen_manager` | String | Name of the kitchen manager |
| `Address` | `address` | String | Street address |
| `City` | `city` | String | City name |
| `State` | `state` | String | 2-letter state code (e.g. `"GA"`, `"TX"`) |
| `County` | `county` | String | County name |
| `Zip` | `zip_code` | String | ZIP code |
| `Phone` | `phone` | String | Store phone number |
| `Fax` | `fax` | String | Store fax number |
| `Opened` | `opened` | Date | Date the store opened — format: `"YYYY-MM-DD"` |
| `Comp Store` | `comp_store` | String | Comparable store status (e.g. `">365 Days"`) |
| `Bottler` | `bottler` | String | Bottler/distributor name |
| `Same Store Sales` | `same_store_sales` | String | Same-store sales label |

**Relationships:** This table has no relationships with other tables.

---

## 3. API Endpoints

### 3.1 Health Check

---

#### `GET /health`

**Purpose**
Checks if the API server is running. Use this to verify the backend is reachable before making other calls.

**Authentication:** Not required

**Request:** No parameters.

**Example Response**

```json
{
  "status": "ok"
}
```

---

### 3.2 Stores

---

#### `GET /stores`

**Purpose**
Returns a paginated list of stores. You can filter by region, state, or district.

**Authentication:** Not required

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `skip` | integer | No | `0` | How many records to skip (for pagination) |
| `limit` | integer | No | `20` | How many records to return. Min: `1`, Max: `100` |
| `region` | string | No | — | Filter stores by region (exact match) |
| `state` | string | No | — | Filter stores by state code (exact match, e.g. `GA`) |
| `district` | string | No | — | Filter stores by district (exact match) |

**Example Request**

```
GET /stores?limit=2&state=GA
```

**Example Response**

```json
{
  "stores": [
    {
      "region": "REG1",
      "district": "DISTA",
      "store_leader": "Yolima John",
      "kitchen": null,
      "kitchen_manager": null,
      "address": "13740 Oglethorpe Hwy.",
      "city": "Midway",
      "state": "GA",
      "county": "Liberty",
      "zip_code": "31320",
      "phone": "912-884-5665",
      "fax": "912-884-2036",
      "opened": "1976-01-01",
      "comp_store": ">365 Days",
      "bottler": "United",
      "same_store_sales": "Same Store Sales",
      "store": 1
    }
  ],
  "total": 114,
  "skip": 0,
  "limit": 2
}
```

**Important Notes**
- `total` is the count of **all matching records**, not just the ones returned on this page. Use it to build pagination controls.
- Results are always sorted by store number (ascending).
- Filters are **exact match** — searching for `"ga"` will not match `"GA"`.

---

#### `GET /stores/{store_id}`

**Purpose**
Returns the details of a single store by its store number.

**Authentication:** Not required

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store_id` | integer | Yes | The store number |

**Example Request**

```
GET /stores/1
```

**Example Response**

```json
{
  "region": "REG1",
  "district": "DISTA",
  "store_leader": "Yolima John",
  "kitchen": null,
  "kitchen_manager": null,
  "address": "13740 Oglethorpe Hwy.",
  "city": "Midway",
  "state": "GA",
  "county": "Liberty",
  "zip_code": "31320",
  "phone": "912-884-5665",
  "fax": "912-884-2036",
  "opened": "1976-01-01",
  "comp_store": ">365 Days",
  "bottler": "United",
  "same_store_sales": "Same Store Sales",
  "store": 1
}
```

**Important Notes**
- Returns `404 Not Found` if no store with that number exists.

---

#### `POST /stores`

**Purpose**
Creates a new store record.

**Authentication:** Not required

**Request Body** — JSON (required)

```json
{
  "store": 200,
  "region": "REG2",
  "district": "DISTB",
  "store_leader": "Jane Smith",
  "kitchen": "Yes",
  "kitchen_manager": "Bob Johnson",
  "address": "123 Main Street",
  "city": "Atlanta",
  "state": "GA",
  "county": "Fulton",
  "zip_code": "30301",
  "phone": "404-555-0100",
  "fax": "404-555-0101",
  "opened": "2024-03-15",
  "comp_store": "<365 Days",
  "bottler": "Coca-Cola",
  "same_store_sales": "New Store"
}
```

**Example Response** — `201 Created`

```json
{
  "region": "REG2",
  "district": "DISTB",
  "store_leader": "Jane Smith",
  "kitchen": "Yes",
  "kitchen_manager": "Bob Johnson",
  "address": "123 Main Street",
  "city": "Atlanta",
  "state": "GA",
  "county": "Fulton",
  "zip_code": "30301",
  "phone": "404-555-0100",
  "fax": "404-555-0101",
  "opened": "2024-03-15",
  "comp_store": "<365 Days",
  "bottler": "Coca-Cola",
  "same_store_sales": "New Store",
  "store": 200
}
```

**Important Notes**
- `store` (the store number) is the **only required field**.
- All other fields are optional — you can send only the ones you have.
- You will get a `422` error if `store` is missing.
- You will get an error if you try to create a store with a number that already exists.
- Dates must be in `"YYYY-MM-DD"` format.

---

#### `POST /stores/{store_id}`

**Purpose**
Updates one or more fields of an existing store. You only need to send the fields you want to change.

**Authentication:** Not required

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store_id` | integer | Yes | The store number to update |

**Request Body** — JSON (only include fields you want to change)

```json
{
  "store_leader": "New Manager Name",
  "phone": "404-555-9999"
}
```

**Example Response** — `200 OK`

```json
{
  "region": "REG2",
  "district": "DISTB",
  "store_leader": "New Manager Name",
  "kitchen": "Yes",
  "kitchen_manager": "Bob Johnson",
  "address": "123 Main Street",
  "city": "Atlanta",
  "state": "GA",
  "county": "Fulton",
  "zip_code": "30301",
  "phone": "404-555-9999",
  "fax": "404-555-0101",
  "opened": "2024-03-15",
  "comp_store": "<365 Days",
  "bottler": "Coca-Cola",
  "same_store_sales": "New Store",
  "store": 200
}
```

**Important Notes**
- This is a **partial update** — fields you leave out are not changed.
- Returns `404 Not Found` if no store with that number exists.
- You cannot change the `store` number (primary key) via this endpoint.

---

#### `DELETE /stores/{store_id}`

**Purpose**
Permanently deletes a store record.

**Authentication:** Not required

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store_id` | integer | Yes | The store number to delete |

**Example Request**

```
DELETE /stores/200
```

**Example Response** — `204 No Content`

_(No response body is returned.)_

**Important Notes**
- Returns `404 Not Found` if no store with that number exists.
- **This action is permanent** — there is no undo.

---

## 4. Request & Response Models

### StoreCreate — used when creating a store (`POST /stores`)

| Field | Type | Required | Max Length | Description |
|---|---|---|---|---|
| `store` | integer | **Yes** | — | Store number — you choose this, it must be unique |
| `region` | string | No | 50 | Sales region |
| `district` | string | No | 50 | District name |
| `store_leader` | string | No | 100 | Store manager name |
| `kitchen` | string | No | 100 | Kitchen availability (e.g. `"Yes"`) |
| `kitchen_manager` | string | No | 100 | Kitchen manager name |
| `address` | string | No | 255 | Street address |
| `city` | string | No | 100 | City |
| `state` | string | No | 10 | State code (e.g. `"GA"`) |
| `county` | string | No | 100 | County name |
| `zip_code` | string | No | 20 | ZIP / postal code |
| `phone` | string | No | 25 | Phone number |
| `fax` | string | No | 25 | Fax number |
| `opened` | date | No | — | Opening date — format `"YYYY-MM-DD"` |
| `comp_store` | string | No | 50 | Comparable store label |
| `bottler` | string | No | 100 | Bottler / distributor |
| `same_store_sales` | string | No | 100 | Same-store sales label |

### StoreUpdate — used when editing a store (`POST /stores/{id}`)

Same fields as `StoreCreate`, but **all fields are optional** — only send what you want to change.

### StoreResponse — returned by all endpoints

Returns the complete store object with all 17 fields listed above.

### StoreListResponse — returned by `GET /stores`

| Field | Type | Description |
|---|---|---|
| `stores` | array | List of store objects |
| `total` | integer | Total number of matching records in the database |
| `skip` | integer | The skip value that was used for this request |
| `limit` | integer | The limit value that was used for this request |

---

## 5. Authentication

**Not implemented.** All endpoints are currently open — no login or token is required.

---

## 6. Common Error Responses

| Status Code | Meaning | When it happens |
|---|---|---|
| `404 Not Found` | Store does not exist | `GET`, update (`POST /stores/{store_id}`), or `DELETE` with a store number that is not in the database |
| `422 Unprocessable Entity` | Validation error | Missing required fields, wrong data types, or values exceeding max length |
| `500 Internal Server Error` | Server crashed | Unexpected backend error — contact the backend team |

### 404 Example

```json
{
  "detail": "Store not found"
}
```

### 422 Example — missing required field

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "store"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

### 422 Example — value too long

```json
{
  "detail": [
    {
      "type": "string_too_long",
      "loc": ["body", "state"],
      "msg": "String should have at most 10 characters",
      "input": "Georgia (Full Name)"
    }
  ]
}
```

---

## 7. Frontend Notes

### Required vs Optional Fields

- **Only `store` (store number) is required** when creating a record.
- All other fields are optional — send `null` or simply leave them out.
- When a field has no value in the database, the API returns `null` for that field.

### Pagination

Use `skip` and `limit` together to page through results.

| Page | skip | limit |
|---|---|---|
| Page 1 | 0 | 20 |
| Page 2 | 20 | 20 |
| Page 3 | 40 | 20 |

```
GET /stores?skip=20&limit=20
```

Use the `total` field in the response to calculate the total number of pages:

```js
const totalPages = Math.ceil(total / limit);
```

### Filtering

You can combine filters with pagination:

```
GET /stores?state=GA&region=REG1&skip=0&limit=50
```

- Filters are **exact match only** — there is no partial or fuzzy search.
- Filters are **case-sensitive** — `"GA"` and `"ga"` are treated differently.

### Date Format

- All dates must be sent as strings in **`"YYYY-MM-DD"` format**.
- Example: `"1999-07-04"` for July 4, 1999.
- The API returns dates in the same format.

### Partial Updates (POST /stores/{store_id})

- Only include the fields you want to change.
- Fields you leave out will **not** be cleared — they keep their current values.
- To clear a field (set it to empty), send `null` explicitly: `{ "fax": null }`.

### No Enums

- There are no fixed dropdown values enforced by the API for fields like `region`, `district`, `kitchen`, or `comp_store`.
- The values are free-text strings. Check existing store records to understand common values used in the database.

### No File Uploads

- This API does not handle file or image uploads.

---

## 8. Frontend Development Flow

Follow these steps when building a frontend for this API:

1. **Check the API is running**
   Call `GET /health`. If you get `{"status": "ok"}`, the server is up.

2. **Load the list of stores**
   Call `GET /stores` to show a table or list view. Use `skip` and `limit` for pagination.

3. **Add filters (optional)**
   Let users filter by state, region, or district using query parameters.

4. **Show store details**
   When a user clicks a store, call `GET /stores/{store_id}` to fetch and display the full record.

5. **Create a new store**
   Show a form, collect input, and `POST /stores` with the `store` number (required) plus any other fields.

6. **Edit an existing store**
   Show a pre-filled form. On save, send only the changed fields to `POST /stores/{store_id}`.

7. **Delete a store**
   Confirm with the user first, then call `DELETE /stores/{store_id}`. Expect no response body — a `204` means success.

8. **Handle errors**
   - Show a "not found" message on `404`.
   - Show field-level validation errors on `422` — the `detail` array tells you exactly which field failed and why.
   - Show a generic error message on `500` and log the response for debugging.

---

## 9. Quick Reference

| Action | Method | URL | Body |
|---|---|---|---|
| Check API status | `GET` | `/health` | None |
| List all stores | `GET` | `/stores` | None |
| Filter stores | `GET` | `/stores?state=GA&region=REG1` | None |
| Paginate stores | `GET` | `/stores?skip=20&limit=20` | None |
| Get one store | `GET` | `/stores/{store_id}` | None |
| Create a store | `POST` | `/stores` | JSON with `store` field |
| Update a store | `POST` | `/stores/{store_id}` | JSON with fields to change |
| Delete a store | `DELETE` | `/stores/{store_id}` | None |
