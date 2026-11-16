const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// product catalogue database for backend api
const products = [
  {
    id: 1,
    brand: "ROADSTER",
    name: "Pure Cotton Relaxed Fit Casual Shirt",
    price: 799,
    mrp: 1499,
    category: "Apparel",
    rating: "4.2",
    reviews: "2.1k",
    icon: "👔",
    bg: "#fee2e2"
  },
  {
    id: 2,
    brand: "HRX BY HRITHIK",
    name: "Rapid-Dry Performance Training Tee",
    price: 499,
    mrp: 999,
    category: "Apparel",
    rating: "4.4",
    reviews: "5.8k",
    icon: "👕",
    bg: "#e0f2fe"
  },
  {
    id: 3,
    brand: "HIGHLANDER",
    name: "Slim Fit Stretch Denim Jeans",
    price: 1199,
    mrp: 2299,
    category: "Apparel",
    rating: "4.1",
    reviews: "1.9k",
    icon: "👖",
    bg: "#dbeafe"
  },
  {
    id: 4,
    brand: "PUMA",
    name: "Men Smashic Leather Casual Sneakers",
    price: 2499,
    mrp: 4499,
    category: "Footwear",
    rating: "4.5",
    reviews: "3.4k",
    icon: "👟",
    bg: "#fef3c7"
  },
  {
    id: 5,
    brand: "RED TAPE",
    name: "Classic Low-Top Retro Trainers",
    price: 1399,
    mrp: 3299,
    category: "Footwear",
    rating: "4.3",
    reviews: "4.2k",
    icon: "👞",
    bg: "#f3e8ff"
  },
  {
    id: 6,
    brand: "BOAT",
    name: "Rockerz 450 Pro Wireless Headphones",
    price: 1699,
    mrp: 3990,
    category: "Electronics",
    rating: "4.3",
    reviews: "12.6k",
    icon: "🎧",
    bg: "#ffedd5"
  },
  {
    id: 7,
    brand: "NOISE",
    name: "ColorFit Pro 4 Max Smartwatch",
    price: 2199,
    mrp: 5999,
    category: "Electronics",
    rating: "4.2",
    reviews: "8.1k",
    icon: "⌚",
    bg: "#e0e7ff"
  },
  {
    id: 8,
    brand: "URBAN MONKEY",
    name: "Vintage Corduroy Snapback Cap",
    price: 449,
    mrp: 999,
    category: "Accessories",
    rating: "4.6",
    reviews: "890",
    icon: "🧢",
    bg: "#ecfdf5"
  },
  {
    id: 9,
    brand: "WILDHORN",
    name: "Genuine Leather Bi-Fold RFID Wallet",
    price: 389,
    mrp: 899,
    category: "Accessories",
    rating: "4.3",
    reviews: "1.5k",
    icon: "👛",
    bg: "#fef9c3"
  },
  {
    id: 10,
    brand: "FASTTRACK",
    name: "Aviator UV-Protected Polarized Sunglasses",
    price: 899,
    mrp: 1799,
    category: "Accessories",
    rating: "4.1",
    reviews: "2.3k",
    icon: "🕶️",
    bg: "#f1f5f9"
  }
];

// load persistent orders from json file
function getStoredOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // fallback if file read fails
  }
  return [];
}

// save orders back to json file
function saveOrdersToDisk(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write orders file:', err.message);
  }
}

// map extensions to correct response mime types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// helper to parse json request payload
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // enable cors for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // api: get products with search, category, and sort support
  if (pathname === '/api/products' && method === 'GET') {
    let result = [...products];
    const category = parsedUrl.query.category;
    const search = parsedUrl.query.search ? parsedUrl.query.search.toLowerCase().trim() : '';
    const sort = parsedUrl.query.sort;

    if (category && category !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    }

    // sort products based on client query
    if (sort === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      result.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: result.length, data: result }));
    return;
  }

  // api: get single product by id
  if (pathname.startsWith('/api/products/') && method === 'GET') {
    const id = parseInt(pathname.split('/')[3], 10);
    const item = products.find(p => p.id === id);

    if (!item) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Product not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: item }));
    return;
  }

  // api: process demo checkout and save order
  if (pathname === '/api/checkout' && method === 'POST') {
    try {
      const payload = await parseRequestBody(req);
      const cartItems = payload.items || [];

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Cart cannot be empty' }));
        return;
      }

      // recalculate totals on server to prevent price tampering
      let subtotal = 0;
      let totalMrp = 0;
      const orderItems = [];

      for (const cartItem of cartItems) {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
          const qty = Math.max(1, parseInt(cartItem.quantity, 10) || 1);
          const lineTotal = product.price * qty;
          subtotal += lineTotal;
          totalMrp += product.mrp * qty;
          orderItems.push({
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            mrp: product.mrp,
            icon: product.icon,
            bg: product.bg,
            quantity: qty,
            lineTotal
          });
        }
      }

      // free delivery above 500, flat 40 for smaller carts
      const deliveryFee = (subtotal > 0 && subtotal < 500) ? 40 : 0;
      const discount = totalMrp - subtotal;
      const grandTotal = subtotal + deliveryFee;

      const now = new Date();
      const arrival = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const arrivalString = arrival.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      // generate demo order id and timestamp
      const orderRecord = {
        orderId: `MYN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`,
        createdAt: now.toISOString(),
        deliveryEstimate: `${arrivalString} by 8:00 PM`,
        items: orderItems,
        totalItems: orderItems.reduce((acc, i) => acc + i.quantity, 0),
        totalMrp,
        discount,
        subtotal,
        deliveryFee,
        grandTotal,
        customer: {
          name: payload.customerName || "Aditya Rahate",
          pincode: payload.pincode || "400001",
          city: "Mumbai",
          phone: "+91 98765 43210"
        },
        paymentMethod: "Demo Checkout (COD / Simulation)",
        status: "Confirmed"
      };

      const orders = getStoredOrders();
      orders.unshift(orderRecord);
      saveOrdersToDisk(orders);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Order confirmed successfully!',
        order: orderRecord
      }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
      return;
    }
  }

  // api: get past orders list
  if (pathname === '/api/orders' && method === 'GET') {
    const orders = getStoredOrders();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: orders.length, orders }));
    return;
  }

  // api: cancel an order
  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/cancel') && method === 'POST') {
    const parts = pathname.split('/');
    const orderId = parts[3];

    const orders = getStoredOrders();
    const target = orders.find(o => o.orderId === orderId);

    if (!target) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Order not found' }));
      return;
    }

    target.status = "Cancelled";
    target.cancelledAt = new Date().toISOString();
    saveOrdersToDisk(orders);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Order cancelled successfully', order: target }));
    return;
  }

  // serve static frontend files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Myntra full-stack app running at: http://localhost:${PORT}`);
});
