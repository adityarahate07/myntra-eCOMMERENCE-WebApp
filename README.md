# Myntra E-Commerce Web App

A responsive fashion and lifestyle storefront inspired by Myntra. This project is a learning/demo application built with plain HTML, CSS, and JavaScript, with a small Node.js backend for the product catalogue and simulated orders. It is not affiliated with or endorsed by Myntra.

## Features

- Browse a sample catalogue of apparel, footwear, accessories, and electronics.
- Search, filter by category, and sort products by price or rating.
- Add products to a shopping bag and manage a wishlist; both are saved in browser local storage.
- Complete a simulated checkout and view or cancel demo orders.
- Use the JSON REST API to retrieve products and persist demo orders locally.
- Responsive layouts for the catalogue and order history pages.

## Requirements

- Node.js 18 or newer
- npm (included with Node.js)

## Run locally

1. Clone the repository and open its directory.
2. Start the server:

   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in a browser. The order history page is available at [http://localhost:3000/orders.html](http://localhost:3000/orders.html).

No third-party npm packages are required.

## API

All endpoints are served by the same local Node.js server:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/products` | List products; supports `category`, `search`, and `sort` query parameters. |
| `GET` | `/api/products/:id` | Retrieve one product by ID. |
| `POST` | `/api/checkout` | Create a simulated order from submitted cart items. |
| `GET` | `/api/orders` | List saved orders. |
| `POST` | `/api/orders/:id/cancel` | Cancel a saved demo order. |

## Data and demo limitations

Cart and wishlist state are stored in the browser's local storage. The server stores demo orders in `orders.json` in the project directory; that file is intentionally excluded from Git because it can contain customer contact details. A fresh clone starts with an empty order history, and new demo orders are written locally.

Checkout does not process payments, and the sample catalogue and order tracking are for demonstration only. Do not enter real payment or personal information.

## Project files

- `index.html`, `style.css`, `script.js` — product catalogue and shopping experience.
- `orders.html`, `orders.js` — order history and cancellation interface.
- `server.js` — static file server and JSON API.
- `package.json` — project metadata and start command.
