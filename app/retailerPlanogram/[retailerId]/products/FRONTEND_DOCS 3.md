# BlueCompute API — Frontend Developer Guide

---

## 1. Project Overview

The **BlueCompute API** is a backend service that manages store location data and product catalogue data. Frontend developers use this API to **list, view, search, create, update, and delete store and product records**.

| Item | Detail |
|---|---|
| API Name | BlueCompute API |
| Version | 1.0.0 |
| Base URL (local) | `http://localhost:8000` |
| Interactive Docs | `http://localhost:8000/docs` |
| Authentication | **Not implemented** |
| File Uploads | **Not implemented** |

> **Tip:** Open `http://localhost:8000/docs` in your browser to test every endpoint interactively — no code needed.

---

## 2. Database Tables

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

### `products`

Holds the product catalogue.

| Column | API Field Name | Type | Description |
|---|---|---|---|
| `UPC` | `upc` | String | **Primary key.** Universal Product Code. You must provide this when creating a product. |
| `Category_Desc` | `category_desc` | String | Category description (e.g. `"Carbonated Soft Drinks"`) |
| `Sub_Category_Desc` | `sub_category_desc` | String | Sub-category description |
| `Item_Desc` | `item_desc` | String | Product name / item description |
| `Size_Desc` | `size_desc` | String | Size description (e.g. `"20 OZ"`) |
| `Pack_Size` | `pack_size` | String | Pack size (e.g. `"24/20 OZ"`) |
| `Brand` | `brand` | String | Brand name |
| `Manufacturer` | `manufacturer` | String | Manufacturer name |
| `Consumption` | `consumption` | String | Consumption occasion (e.g. `"On Premise"`) |
| `Class` | `product_class` | String | Product class — note: the API field is `product_class` (not `class`) |
| `Category` | `category` | String | Category code/name |
| `Segment` | `segment` | String | Market segment |
| `Caloric` | `caloric` | String | Caloric designation (e.g. `"Regular"`, `"Diet"`) |
| `System` | `system` | String | Distribution system |
| `SubBrand` | `sub_brand` | String | Sub-brand name |
| `Trademark` | `trademark` | String | Trademark name |

**Relationships:** This table has no relationships with other tables.

---

## 2.5 Standard Response Format

All endpoints (except `/health`) wrap their response in a standard envelope:

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"success"` on a successful response |
| `message` | string | Human-readable description of what happened |
| `status_code` | integer | The HTTP status code mirrored in the body |
| `data` | object or null | The actual payload — a store object, a list, or `null` (delete) |

**Example:**

```json
{
  "status": "success",
  "message": "Store retrieved successfully",
  "status_code": 200,
  "data": { ... }
}
```

> **Note:** Error responses (`404`, `422`, `500`) do **not** use this envelope — they use FastAPI's default `{ "detail": "..." }` format. See section 6 for details.

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

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Stores retrieved successfully",
  "status_code": 200,
  "data": {
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
}
```

**Important Notes**
- `data.total` is the count of **all matching records**, not just the ones returned on this page. Use it to build pagination controls.
- Results are always sorted by store number (ascending).
- Filters are **exact match** — searching for `"ga"` will not match `"GA"`. Use `/stores/search` for partial/case-insensitive matching.

---

#### `GET /stores/search`

**Purpose**
Searches for stores across multiple text fields using a case-insensitive partial match. Use this when you need a keyword search rather than an exact filter.

**Authentication:** Not required

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `q` | string | **Yes** | — | Search term. Matched against `store_leader`, `address`, `city`, `county`, `kitchen`, `kitchen_manager`, `bottler`, `region`, and `district` |
| `skip` | integer | No | `0` | How many records to skip (for pagination) |
| `limit` | integer | No | `20` | How many records to return. Min: `1`, Max: `100` |

**Example Request**

```
GET /stores/search?q=atlanta
```

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Found 3 store(s) matching 'atlanta'",
  "status_code": 200,
  "data": {
    "stores": [
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
    ],
    "total": 3,
    "skip": 0,
    "limit": 20
  }
}
```

**Important Notes**
- The search is **case-insensitive** — `"atlanta"` matches `"Atlanta"`.
- The search is a **partial match** — `"atl"` matches `"Atlanta"`.
- `q` is required and must be at least 1 character.
- Supports the same `skip` and `limit` pagination parameters as `GET /stores`.
- `data.message` includes the match count: `"Found N store(s) matching '...'"`

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

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Store retrieved successfully",
  "status_code": 200,
  "data": {
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
  "status": "success",
  "message": "Store created successfully",
  "status_code": 201,
  "data": {
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
  "status": "success",
  "message": "Store updated successfully",
  "status_code": 200,
  "data": {
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

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Store deleted successfully",
  "status_code": 200,
  "data": null
}
```

**Important Notes**
- Returns `404 Not Found` if no store with that number exists.
- **This action is permanent** — there is no undo.

---

### 3.3 Products

---

#### `GET /products`

**Purpose**
Returns a paginated list of products. You can filter by category, brand, manufacturer, or segment.

**Authentication:** Not required

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `skip` | integer | No | `0` | How many records to skip (for pagination) |
| `limit` | integer | No | `20` | How many records to return. Min: `1`, Max: `100` |
| `category` | string | No | — | Filter products by category (exact match) |
| `brand` | string | No | — | Filter products by brand (exact match) |
| `manufacturer` | string | No | — | Filter products by manufacturer (exact match) |
| `segment` | string | No | — | Filter products by segment (exact match) |

**Example Request**

```
GET /products?limit=2&brand=Coca-Cola
```

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Products retrieved successfully",
  "status_code": 200,
  "data": {
    "products": [
      {
        "upc": "049000000443",
        "category_desc": "Carbonated Soft Drinks",
        "sub_category_desc": "Cola",
        "item_desc": "Coca-Cola Classic 20 OZ",
        "size_desc": "20 OZ",
        "pack_size": "24/20 OZ",
        "brand": "Coca-Cola",
        "manufacturer": "The Coca-Cola Company",
        "consumption": "On Premise",
        "product_class": "Flagship",
        "category": "CSD",
        "segment": "Regular Cola",
        "caloric": "Regular",
        "system": "Direct",
        "sub_brand": null,
        "trademark": "Coca-Cola"
      }
    ],
    "total": 48,
    "skip": 0,
    "limit": 2
  }
}
```

**Important Notes**
- `data.total` is the count of **all matching records**, not just the ones returned on this page.
- Results are always sorted by UPC (ascending).
- Filters are **exact match** — use `/products/search` for partial/case-insensitive matching.

---

#### `GET /products/search`

**Purpose**
Searches for products across multiple text fields using a case-insensitive partial match.

**Authentication:** Not required

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `q` | string | **Yes** | — | Search term. Matched against `item_desc`, `brand`, `manufacturer`, `category_desc`, `sub_category_desc`, `sub_brand`, `trademark`, `segment`, and `consumption` |
| `skip` | integer | No | `0` | How many records to skip (for pagination) |
| `limit` | integer | No | `20` | How many records to return. Min: `1`, Max: `100` |

**Example Request**

```
GET /products/search?q=diet
```

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Found 12 product(s) matching 'diet'",
  "status_code": 200,
  "data": {
    "products": [ ... ],
    "total": 12,
    "skip": 0,
    "limit": 20
  }
}
```

**Important Notes**
- Case-insensitive — `"diet"` matches `"Diet Coke"`.
- Partial match — `"col"` matches `"Cola"`.
- `q` is required and must be at least 1 character.

---

#### `GET /products/{upc}`

**Purpose**
Returns the details of a single product by its UPC.

**Authentication:** Not required

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `upc` | string | Yes | The UPC of the product |

**Example Request**

```
GET /products/049000000443
```

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Product retrieved successfully",
  "status_code": 200,
  "data": {
    "upc": "049000000443",
    "category_desc": "Carbonated Soft Drinks",
    "sub_category_desc": "Cola",
    "item_desc": "Coca-Cola Classic 20 OZ",
    "size_desc": "20 OZ",
    "pack_size": "24/20 OZ",
    "brand": "Coca-Cola",
    "manufacturer": "The Coca-Cola Company",
    "consumption": "On Premise",
    "product_class": "Flagship",
    "category": "CSD",
    "segment": "Regular Cola",
    "caloric": "Regular",
    "system": "Direct",
    "sub_brand": null,
    "trademark": "Coca-Cola"
  }
}
```

**Important Notes**
- The UPC is a **string** path parameter — include leading zeros if present.
- Returns `404 Not Found` if no product with that UPC exists.

---

#### `POST /products`

**Purpose**
Creates a new product record.

**Authentication:** Not required

**Request Body** — JSON (required)

```json
{
  "upc": "049000000443",
  "category_desc": "Carbonated Soft Drinks",
  "sub_category_desc": "Cola",
  "item_desc": "Coca-Cola Classic 20 OZ",
  "size_desc": "20 OZ",
  "pack_size": "24/20 OZ",
  "brand": "Coca-Cola",
  "manufacturer": "The Coca-Cola Company",
  "consumption": "On Premise",
  "product_class": "Flagship",
  "category": "CSD",
  "segment": "Regular Cola",
  "caloric": "Regular",
  "system": "Direct",
  "sub_brand": null,
  "trademark": "Coca-Cola"
}
```

**Example Response** — `201 Created`

```json
{
  "status": "success",
  "message": "Product created successfully",
  "status_code": 201,
  "data": { ... }
}
```

**Important Notes**
- `upc` is the **only required field**.
- All other fields are optional.
- You will get a `422` error if `upc` is missing.
- You will get an error if you try to create a product with a UPC that already exists.

---

#### `POST /products/{upc}`

**Purpose**
Updates one or more fields of an existing product. Only send the fields you want to change.

**Authentication:** Not required

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `upc` | string | Yes | The UPC of the product to update |

**Request Body** — JSON (only include fields you want to change)

```json
{
  "brand": "New Brand Name",
  "segment": "Premium"
}
```

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Product updated successfully",
  "status_code": 200,
  "data": { ... }
}
```

**Important Notes**
- This is a **partial update** — fields you leave out are not changed.
- Returns `404 Not Found` if no product with that UPC exists.
- You cannot change the `upc` (primary key) via this endpoint.

---

#### `DELETE /products/{upc}`

**Purpose**
Permanently deletes a product record.

**Authentication:** Not required

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `upc` | string | Yes | The UPC of the product to delete |

**Example Response** — `200 OK`

```json
{
  "status": "success",
  "message": "Product deleted successfully",
  "status_code": 200,
  "data": null
}
```

**Important Notes**
- Returns `404 Not Found` if no product with that UPC exists.
- **This action is permanent** — there is no undo.

---

## 4. Request & Response Models

### ApiResponse — wraps all successful responses

| Field | Type | Description |
|---|---|---|
| `status` | string | `"success"` |
| `message` | string | Human-readable result description |
| `status_code` | integer | HTTP status code mirrored in the body |
| `data` | object or null | The payload: a store, a list response, or `null` |

### ProductCreate — used when creating a product (`POST /products`)

| Field | Type | Required | Max Length | Description |
|---|---|---|---|---|
| `upc` | string | **Yes** | 30 | Universal Product Code — you choose this, it must be unique |
| `category_desc` | string | No | 100 | Category description |
| `sub_category_desc` | string | No | 150 | Sub-category description |
| `item_desc` | string | No | 255 | Product name / item description |
| `size_desc` | string | No | 50 | Size description |
| `pack_size` | string | No | 50 | Pack size |
| `brand` | string | No | 100 | Brand name |
| `manufacturer` | string | No | 150 | Manufacturer name |
| `consumption` | string | No | 50 | Consumption occasion |
| `product_class` | string | No | 100 | Product class (DB column is `Class`) |
| `category` | string | No | 100 | Category |
| `segment` | string | No | 100 | Market segment |
| `caloric` | string | No | 100 | Caloric designation |
| `system` | string | No | 100 | Distribution system |
| `sub_brand` | string | No | 100 | Sub-brand |
| `trademark` | string | No | 100 | Trademark |

### ProductUpdate — used when editing a product (`POST /products/{upc}`)

Same fields as `ProductCreate` **except `upc`**, which is taken from the URL path. All fields are optional — only send what you want to change.

### ProductResponse — returned inside `data` for single-product endpoints

Returns the complete product object with all 16 fields listed above.

### ProductListResponse — returned inside `data` for list and search endpoints

| Field | Type | Description |
|---|---|---|
| `products` | array | List of product objects |
| `total` | integer | Total number of matching records in the database |
| `skip` | integer | The skip value used for this request |
| `limit` | integer | The limit value used for this request |

---

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

### StoreResponse — returned inside `data` for single-store endpoints

Returns the complete store object with all 17 fields listed above.

### StoreListResponse — returned inside `data` for list and search endpoints

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

> **Note:** Errors do **not** use the `ApiResponse` wrapper. They use FastAPI's native error format.

| Status Code | Meaning | When it happens |
|---|---|---|
| `404 Not Found` | Record does not exist | `GET`, `POST` (update), or `DELETE` on a store or product that is not in the database |
| `422 Unprocessable Entity` | Validation error | Missing required fields, wrong data types, or values exceeding max length |
| `500 Internal Server Error` | Server crashed | Unexpected backend error — contact the backend team |

### 404 Example — store

```json
{
  "detail": "Store not found"
}
```

### 404 Example — product

```json
{
  "detail": "Product not found"
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

Use the `total` field inside `data` to calculate the total number of pages:

```js
const totalPages = Math.ceil(data.total / limit);
```

### Filtering vs Searching

This API offers two ways to find stores:

| Approach | Endpoint | Match Type | Case-Sensitive |
|---|---|---|---|
| Exact filter | `GET /stores?state=GA` | Exact | Yes |
| Keyword search | `GET /stores/search?q=atlanta` | Partial (contains) | No |

Use filters when you know the exact value (e.g. a dropdown selection). Use search when the user types a free-text query.

### Date Format

- All dates must be sent as strings in **`"YYYY-MM-DD"` format**.
- Example: `"1999-07-04"` for July 4, 1999.
- The API returns dates in the same format.

### Partial Updates (POST /stores/{store_id})

- Only include the fields you want to change.
- Fields you leave out will **not** be cleared — they keep their current values.
- To clear a field (set it to empty), send `null` explicitly: `{ "fax": null }`.

### Reading Responses

All successful responses (except `/health`) return a wrapper object. Access the actual data via the `data` key:

```js
const response = await fetch('/stores/1');
const json = await response.json();
const store = json.data;       // the store object
const message = json.message;  // e.g. "Store retrieved successfully"
```

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
   Call `GET /stores` to show a table or list view. Read the list from `response.data.stores`. Use `skip` and `limit` for pagination.

3. **Add filters (optional)**
   Let users filter by state, region, or district using query parameters. Filters are exact-match only.

4. **Add search (optional)**
   For free-text search, use `GET /stores/search?q=<term>`. The query is matched case-insensitively across store_leader, address, city, county, kitchen, kitchen_manager, bottler, region, and district.

5. **Show store details**
   When a user clicks a store, call `GET /stores/{store_id}`. The store object is at `response.data`.

6. **Create a new store**
   Show a form, collect input, and `POST /stores` with the `store` number (required) plus any other fields. On `201 Created`, read the saved store from `response.data`.

7. **Edit an existing store**
   Show a pre-filled form. On save, send only the changed fields to `POST /stores/{store_id}`. On success, read the updated store from `response.data`.

8. **Delete a store**
   Confirm with the user first, then call `DELETE /stores/{store_id}`. On `200 OK`, `response.data` will be `null` — use `response.message` to confirm success.

9. **Handle errors**
   - Show a "not found" message on `404`.
   - Show field-level validation errors on `422` — the `detail` array tells you exactly which field failed and why.
   - Show a generic error message on `500` and log the response for debugging.

---

## 9. Quick Reference

### Stores

| Action | Method | URL | Body | Success Code |
|---|---|---|---|---|
| Check API status | `GET` | `/health` | None | 200 |
| List all stores | `GET` | `/stores` | None | 200 |
| Filter stores | `GET` | `/stores?state=GA&region=REG1` | None | 200 |
| Paginate stores | `GET` | `/stores?skip=20&limit=20` | None | 200 |
| Search stores | `GET` | `/stores/search?q=<term>` | None | 200 |
| Get one store | `GET` | `/stores/{store_id}` | None | 200 |
| Create a store | `POST` | `/stores` | JSON with `store` field | 201 |
| Update a store | `POST` | `/stores/{store_id}` | JSON with fields to change | 200 |
| Delete a store | `DELETE` | `/stores/{store_id}` | None | 200 |

### Products

| Action | Method | URL | Body | Success Code |
|---|---|---|---|---|
| List all products | `GET` | `/products` | None | 200 |
| Filter products | `GET` | `/products?brand=Coca-Cola&category=CSD` | None | 200 |
| Paginate products | `GET` | `/products?skip=20&limit=20` | None | 200 |
| Search products | `GET` | `/products/search?q=<term>` | None | 200 |
| Get one product | `GET` | `/products/{upc}` | None | 200 |
| Create a product | `POST` | `/products` | JSON with `upc` field | 201 |
| Update a product | `POST` | `/products/{upc}` | JSON with fields to change | 200 |
| Delete a product | `DELETE` | `/products/{upc}` | None | 200 |
