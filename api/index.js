// Vercel Serverless Function - All API Routes
import express from 'express';
import cors from 'cors';
import * as db from '../server/database.js';

const app = express();
const BOT_ID = parseInt(process.env.BOT_ID);

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// POST: Verifikasi password login
app.post('/api/auth/check', (req, res) => {
    try {
        const { password } = req.body;
        const correctPassword = process.env.PASSWORD;

        if (!password) {
            return res.status(400).json({ success: false, error: 'Password diperlukan.' });
        }

        if (password === correctPassword) {
            res.json({ success: true, message: 'Password benar' });
        } else {
            res.status(401).json({ success: false, error: 'Password salah' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Mendapatkan Statistik (Total Transaksi & Pendapatan)
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await db.totalTransaksi(BOT_ID);
        res.json({
            success: true,
            data: {
                totalPcs: stats.totalPcs || 0,
                totalPendapatan: stats.totalPendapatan || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Mendapatkan Riwayat Transaksi
app.get('/api/transactions', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 0;
        const result = await db.getTransactionHistory(BOT_ID, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// POST: Buat transaksi manual (digunakan untuk menandai stok sebagai terjual dari dashboard)
app.post('/api/transactions', async (req, res) => {
    try {
        const { userId = 0, productId, productName, quantity, price, status, paymentMethod, snk, reffId } = req.body;
        if (!productId || !productName || !quantity || !price || !reffId) {
            return res.status(400).json({ success: false, error: 'productId, productName, quantity, price, dan reffId diperlukan.' });
        }
        const result = await db.addTransactionHistory(userId, BOT_ID, productId, productName, quantity, price, status, paymentMethod, snk, reffId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Mendapatkan Riwayat Transaksi User Tertentu
app.get('/api/transactions/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await db.getUserTransactionHistory(parseInt(userId), limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Mendapatkan transaksi berdasarkan refId
app.get('/api/transactions/ref/:refId', async (req, res) => {
    try {
        const { refId } = req.params;
        const result = await db.getTransactionByRefId(refId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Mendapatkan Daftar User
app.get('/api/users', async (req, res) => {
    try {
        const { userId, limit } = req.query;
        if (userId) {
            const result = await db.getUserById(userId);
            return res.json(result);
        }

        const lim = limit ? parseInt(limit) : 50;
        const result = await db.getAllUsers(lim);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Cari user berdasarkan ID
app.get('/api/users/search/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.getUserById(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// PUT: Edit role, saldo, dan username user
app.put('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, role, balance, username } = req.body;
        const result = await db.updateUserRoleAndBalance(userId, name, role, balance, username);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Ambil daftar stok untuk produk tertentu (belum terjual)
app.get('/api/products/:productId/stock', async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await db.getProductStockList(BOT_ID, productId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// DELETE: Menghapus satu atau lebih akun stok dari produk (menerima `accounts` atau `ids`)
app.delete('/api/products/:productId/stock', async (req, res) => {
    try {
        const { productId } = req.params;
        const { accounts, ids } = req.body;
        if ((!accounts || !Array.isArray(accounts) || accounts.length === 0) && (!ids || !Array.isArray(ids) || ids.length === 0)) {
            return res.status(400).json({ success: false, error: 'Data `accounts` atau `ids` (array) diperlukan.' });
        }
        let result;
        if (ids && Array.isArray(ids) && ids.length > 0) {
            result = await db.delStockByIds(BOT_ID, productId, ids);
        } else {
            result = await db.delStock(BOT_ID, productId, accounts);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// POST: Tandai stok terpilih sebagai terjual
app.post('/api/products/:productId/stock/mark-sold', async (req, res) => {
    try {
        const { productId } = req.params;
        const { ids, trxRefId } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Data `ids` (array) diperlukan.' });
        }
        const result = await db.markStockAsSold(BOT_ID, productId, ids, trxRefId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// GET: Mendapatkan semua data bot
app.get('/api/bot', async (req, res) => {
    try {
        const result = await db.dbBot(BOT_ID);
        if (result.success) {
            const botData = result.data;

            // Konversi Map product menjadi Object
            let productObj = {};
            if (botData.product instanceof Map) {
                for (const [key, value] of botData.product) {
                    productObj[key] = value;
                }
            } else {
                productObj = botData.product || {};
            }

            // Konversi Map product_view menjadi Object
            let product_viewObj = {};
            if (botData.product_view instanceof Map) {
                for (const [key, value] of botData.product_view) {
                    product_viewObj[key] = value;
                }
            } else {
                product_viewObj = botData.product_view || {};
            }

            // Return dengan struktur yang rapi
            res.json({
                success: true,
                data: {
                    ...botData,
                    product: productObj,
                    product_view: product_viewObj
                }
            });
        } else {
            console.log(result)
            res.status(404).json(result);
        }
    } catch (error) {
        console.log('[ERROR] /api/bot:', error);
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// POST: Menambahkan produk baru
app.post('/api/products', async (req, res) => {
    try {
        const { id, name, price, desc } = req.body;
        if (!id || !name || !price) {
            return res.status(400).json({ success: false, error: 'ID, Name, dan Price diperlukan.' });
        }
        const result = await db.addProduct(BOT_ID, { id, name, price, desc });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// PUT: Mengedit produk yang ada
app.put('/api/products/:productId', async (req, res) => {
    try {
        const { productId: oldId } = req.params;
        const { newId, name, price, desc, snk } = req.body;
        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Name dan Price diperlukan.' });
        }

        let result;
        if (newId && newId !== oldId) {
            result = await db.editProductId(BOT_ID, oldId, newId, { name, price, desc, snk });
        } else {
            result = await db.editProduct(BOT_ID, oldId, { name, price, desc, snk });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// DELETE: Menghapus produk
app.delete('/api/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await db.delProduct(BOT_ID, productId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// POST: Menambahkan stok ke produk
app.post('/api/products/:productId/stock', async (req, res) => {
    try {
        const { productId } = req.params;
        const { accounts } = req.body;
        if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({ success: false, error: 'Data `accounts` (array) diperlukan.' });
        }
        const result = await db.addStock(BOT_ID, productId, accounts);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// DELETE: Menghapus satu atau lebih akun stok dari produk
app.delete('/api/products/:productId/stock', async (req, res) => {
    try {
        const { productId } = req.params;
        const { accounts } = req.body;
        if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({ success: false, error: 'Data `accounts` (array) diperlukan.' });
        }
        const result = await db.delStock(BOT_ID, productId, accounts);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// POST: Mengelola (membuat/update) Product View (Kategori)
app.post('/api/product-view', async (req, res) => {
    try {
        const { title, productIds } = req.body;
        if (!title || !productIds) {
            return res.status(400).json({ success: false, error: 'Title dan productIds diperlukan.' });
        }
        const result = await db.manageProductView(BOT_ID, title, productIds);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// DELETE: Menghapus seluruh kategori Product View
app.delete('/api/product-view/:title', async (req, res) => {
    try {
        const { title } = req.params;
        const result = await db.delProductView(BOT_ID, title);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// DELETE: Menghapus satu produk dari kategori Product View
app.delete('/api/product-view/:title/products/:productId', async (req, res) => {
    try {
        const { title, productId } = req.params;
        const result = await db.delIdFromProductView(BOT_ID, title, productId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
});

// Export Express app as Vercel handler
export default app;
