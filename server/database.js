import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import chalk from "chalk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env file dari root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const url = process.env.MONGODB_URL || "mongodb://localhost:27017/MannDB";

const poolOptions = {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 5,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 0,
  connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  family: 4,
  appName: process.env.APP_NAME || "kelola-produk-v2",
  monitorCommands: process.env.MONGO_MONITOR === "true",
  retryWrites: true,
};

mongoose.set("strictQuery", true);
if (process.env.NODE_ENV === "development" && process.env.MONGO_DEBUG === "true") {
  mongoose.set("debug", true);
}

const mongooseOptions = {
  dbName: process.env.MONGO_DBNAME || "MannDB",
  bufferCommands: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production",
  ...poolOptions,
};

async function runStartInitOnce() {
  if (global.__MONGO_INIT_DONE__) return;
  global.__MONGO_INIT_DONE__ = true;
  try {
    await startInit();
  } catch (err) {
    console.warn("Warning during model/index init:", err.message || err);
  }
}

export function connectDB() {
  if (global.__MONGO_CONN_PROMISE__) return global.__MONGO_CONN_PROMISE__;
  global.__MONGO_CONN_PROMISE__ = mongoose.connect(url, mongooseOptions).then(async () => {
    console.log(chalk.green(`✓ Connected to MongoDB (${mongooseOptions.dbName})`));
    await runStartInitOnce();
    return mongoose;
  }).catch((err) => {
    global.__MONGO_CONN_PROMISE__ = null;
    console.error(chalk.red('x MongoDB connect error:'), err.message || err);
    throw err;
  });
  return global.__MONGO_CONN_PROMISE__;
}

if (typeof process !== "undefined") {
  process.once("SIGINT", async () => {
    console.log(chalk.yellow("SIGINT received: closing MongoDB connection..."));
    try {
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error("Error during mongoose disconnect:", err);
      process.exit(1);
    }
  });
  process.once("SIGTERM", async () => {
    console.log(chalk.yellow("SIGTERM received: closing MongoDB connection..."));
    try {
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error("Error during mongoose disconnect:", err);
      process.exit(1);
    }
  });
}

export function getNativeDb() {
  return mongoose.connection.db;
}

// ----------------- Schema & Model Baru (Terpisah) -----------------

// 1. User Schema (Collection: users)
const userSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, default: "No Name" },
    username: { type: String, default: null },
    role: { type: String, default: "member" },
    status: { type: String, default: "member" },
    isAdmin: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    transaksi: { type: Number, default: 0 },
    membeli: { type: Number, default: 0 },
    isTelegram: { type: Boolean, default: true },
    total_nominal_transaksi: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const botSchema = new mongoose.Schema(
  {
    botId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    terjual: { type: Number, default: 0 },
    transaksi: { type: Number, default: 0 },
    soldtoday: { type: Number, default: 0 },
    trxtoday: { type: Number, default: 0 },
    total_nominal_transaksi: { type: Number, default: 0 },
    nominaltoday: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    botId: { type: Number, required: true, index: true },
    productId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    desc: { type: String, default: "" },
    snk: { type: String, default: "" },
    terjual: { type: Number, default: 0 },
    // Maintain a stock counter to avoid expensive counts
    stock: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
// Unique compound index to speed lookups and ensure uniqueness per bot
productSchema.index({ botId: 1, productId: 1 }, { unique: true });

const productStockSchema = new mongoose.Schema(
  {
    botId: { type: Number, required: true, index: true },
    productId: { type: String, required: true, index: true },
    accountData: { type: String, required: true },
    isSold: { type: Boolean, default: false, index: true },

    trxRefId: { type: String, default: null },
  },
  { timestamps: true }
);
// Compound index for common queries. Also create a partial index for available (isSold: false)
productStockSchema.index({ botId: 1, productId: 1, createdAt: 1 });
productStockSchema.index({ botId: 1, productId: 1 }, { partialFilterExpression: { isSold: false }, name: 'stockIndex' });
productStockSchema.index(
  { trxRefId: 1 },
  { name: "uniqueTrxRefId", sparse: true }
);

const categorySchema = new mongoose.Schema(
  {
    botId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    products: [String],
  },
  { timestamps: true }
);
categorySchema.index({ botId: 1, name: 1 }, { unique: true });

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, index: true },
    botId: { type: Number, required: true, index: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    status: { type: String, default: "completed" },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "balance" },
    snk: { type: String, default: "" },
    reffId: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);
// Indexes to optimize list and history queries
transactionSchema.index({ botId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

const authUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, sparse: true },
    password: { type: String, required: true },
    telegramId: { type: Number, required: true, unique: true },
  },
  { timestamps: true }
);

authUserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

authUserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export Models
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Bot = mongoose.models.Bot || mongoose.model("Bot", botSchema);
export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
export const AuthUser =
  mongoose.models.AuthUser || mongoose.model("AuthUser", authUserSchema);
// Export Model ProductStock yang baru
export const ProductStock =
  mongoose.models.ProductStock ||
  mongoose.model("ProductStock", productStockSchema);

export async function startInit() {
  // Initialize models in parallel to reduce startup time
  try {
    await Promise.all([
      User.init(),
      Bot.init(),
      Product.init(),
      Category.init(),
      Transaction.init(),
      ProductStock.init(),
    ]);
  } catch (err) {
    // Index build errors are logged but shouldn't crash the process
    console.warn("Warning during model/index init:", err.message || err);
  }
}

// ====================================================================
// =================== FORMATTER FUNCTIONS ============================
// ====================================================================

function normalizeRole(roleInput) {
  const value = String(roleInput ?? "").trim().toLowerCase();

  if (["admin", "administrator", "owner", "superadmin", "super_admin"].includes(value)) {
    return "admin";
  }

  if (["vip", "premium", "gold"].includes(value)) {
    return "vip";
  }

  return "member";
}

function buildRoleUpdates(roleInput) {
  const normalizedRole = normalizeRole(roleInput);
  return {
    role: normalizedRole,
    status: normalizedRole,
    isAdmin: normalizedRole === "admin",
  };
}

/**
 * Format user data untuk frontend - convert userId menjadi id
 */
function formatUserForFrontend(user) {
  if (!user) return null;
  const normalizedRole = normalizeRole(user.role ?? user.status);
  return {
    ...user,
    role: normalizedRole,
    status: user.status || normalizedRole,
    isAdmin: user.isAdmin ?? normalizedRole === "admin",
    id: user.userId, // Add id property dari userId
  };
}

/**
 * Format multiple users
 */
function formatUsersForFrontend(users) {
  return users.map((user) => formatUserForFrontend(user));
}

// ====================================================================
// ================== FUNGSI CRUD (Telah Diperbaiki) ==================
// ====================================================================

// ----------------- Fungsi CRUD User -----------------
export async function userRegister(id, name) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan userId
    const exist = await User.findOne({ userId: id });
    if (exist) return { success: false, error: "ID sudah digunakan." };

    // PERBAIKAN: Gunakan userId
    const create = await User.create({
      userId: id,
      name,
      ...buildRoleUpdates("member"),
    });
    return { success: true, data: create };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editBalance(id, amount) {
  await connectDB();
  try {
    if (!id || amount == null) throw new Error("Masukan data id dan amount!");
    if (isNaN(amount)) throw new Error("Nominal harus berupa angka!");

    // PERBAIKAN: Gunakan userId
    const update = await User.findOneAndUpdate(
      { userId: id },
      { $inc: { balance: amount } },
      { new: true }
    );

    if (!update) return { success: false, error: "ID tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editRole(id, role) {
  await connectDB();
  try {
    if (!id || !role) throw new Error("Masukan data id dan role!");

    const roleUpdates = buildRoleUpdates(role);

    // PERBAIKAN: Gunakan userId
    const update = await User.findOneAndUpdate(
      { userId: id },
      { $set: roleUpdates },
      { new: true }
    );

    if (!update) return { success: false, error: "ID tidak ditemukan." };
    return { success: true, data: formatUserForFrontend(update) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function checkUser(id) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan userId
    const exist = await User.findOne({ userId: id }).lean();
    return { success: true, data: !!exist };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function dbUser(id) {
  await connectDB();
  try {
    const exist = await User.findOne({ userId: id }).lean();
    return { success: true, data: formatUserForFrontend(exist) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Alias untuk kompatibilitas dengan app.js
export async function getUserById(userId) {
  return await dbUser(userId);
}

// Update user data (role, name, balance)
export async function updateUserRoleAndBalance(userId, name, role, balance, username) {
  await connectDB();
  try {
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (role !== undefined) Object.assign(updates, buildRoleUpdates(role));
    if (balance !== undefined) updates.balance = Number(balance);
    if (username !== undefined) {
      const normalizedUsername = String(username ?? "").trim();
      updates.username = normalizedUsername || null;
    }

    const updated = await User.findOneAndUpdate(
      { userId: Number(userId) },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return { success: false, error: "User tidak ditemukan." };
    }

    return { success: true, data: formatUserForFrontend(updated) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------- Fungsi CRUD Bot -----------------
export async function checkDbBot(id) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const exist = await Bot.findOne({ botId: id }).lean();
    return { success: true, data: !!exist };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createDbBot(id, name) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const exist = await Bot.findOne({ botId: id });
    if (exist) return { success: false, error: "ID bot sudah terdaftar." };

    // PERBAIKAN: Gunakan botId
    const create = await Bot.create({ botId: id, name });
    return { success: true, data: create };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function dbBot(botId) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const bot = await Bot.findOne({ botId }).lean();
    if (!bot) return { success: false, message: "Bot not found" };

    const products = await Product.find({ botId }).lean();
    const categories = await Category.find({ botId }).lean();

    // Use aggregation to compute per-product stock counts and a small sample of accounts
    const stockAgg = await ProductStock.aggregate([
      { $match: { botId, isSold: false } },
      { $group: { _id: "$productId", count: { $sum: 1 }, accounts: { $push: "$accountData" } } },
      { $project: { count: 1, accounts: { $slice: ["$accounts", 50] } } },
    ]);

    const stockMap = {};
    const accountMap = {};
    for (const row of stockAgg) {
      stockMap[row._id] = row.count;
      accountMap[row._id] = row.accounts || [];
    }

    // PERBAIKAN DATA RETURN: Mapping array products ke Object Map dengan stok dan account
    const productMap = {};
    products.forEach((p) => {
      // Tambahkan stok dan account array untuk backward compatibility
      const productData = {
        ...p,
        id: p.productId, // Backward compatibility
        stock: stockMap[p.productId] || 0, // Total stok tersedia
        account: accountMap[p.productId] || [], // Daftar akun (backward compat)
      };
      productMap[p.productId] = productData;
    });

    // Mapping categories ke struktur lama product_view
    const viewMap = {};
    categories.forEach((c) => {
      viewMap[c.name] = { id: c.products };
    });

    // Menggabungkan data virtual
    bot.product = new Map(Object.entries(productMap));
    bot.product_view = new Map(Object.entries(viewMap));

    return { success: true, data: bot };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------- Fungsi CRUD Kategori (Category) -----------------
export async function createProductView(botId, title) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const botExists = await Bot.exists({ botId });
    if (!botExists) return { success: false, error: "Bot tidak ditemukan." };

    // Cek apakah kategori sudah ada
    const exist = await Category.findOne({ botId, name: title });
    if (exist) return { exist: true };

    // Buat Kategori Baru
    await Category.create({
      botId,
      name: title,
      products: [],
    });

    return { success: true, data: { id: [] } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addProductView(botId, title, accounts = []) {
  // NOTE: 'accounts' disini sebenarnya adalah array Product ID (productId)
  await connectDB();
  try {
    const category = await Category.findOne({ botId, name: title });
    if (!category)
      return {
        success: false,
        error: "Kategori tidak ditemukan.",
      };

    // Menggunakan $push sesuai behavior lama
    category.products.push(...accounts);
    await category.save();

    return { success: true, data: { id: category.products } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getCategory(botId) {
  await connectDB();
  try {
    const categories = await Category.find({ botId }).lean();

    // Format agar sesuai dengan return value kode lama (Object key-value)
    let data = {};
    for (let cat of categories) {
      data[cat.name] = cat.products;
    }
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Manage Product View (Create jika belum ada, atau update jika sudah ada)
 * @param {number} botId
 * @param {string} title - Nama kategori
 * @param {string[]} productIds - Array product IDs
 */
export async function manageProductView(botId, title, productIds = []) {
  await connectDB();
  try {
    // Pastikan bot ada
    const botExists = await Bot.exists({ botId });
    if (!botExists) return { success: false, error: "Bot tidak ditemukan." };

    // Cek apakah kategori sudah ada
    let category = await Category.findOne({ botId, name: title });

    if (!category) {
      // Jika belum ada, buat kategori baru
      category = await Category.create({
        botId,
        name: title,
        products: productIds || [],
      });
    } else {
      // Jika sudah ada, update dengan productIds baru
      category.products = productIds || [];
      await category.save();
    }

    return { success: true, data: { id: category.products } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------- Fungsi CRUD Produk (Product) -----------------
export async function getProductDetails(botId, productId) {
  await connectDB();
  try {
    const product = await Product.findOne({ botId, productId }).lean();
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    // Prefer counter field (faster) and fall back to counting if not present
    const stockCount = product.stock ?? (await ProductStock.countDocuments({ botId, productId, isSold: false }));
    product.stock = stockCount;

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fungsi untuk menambahkan stok akun ke koleksi ProductStock yang baru.
 * @param {number} botId
 * @param {string} productId
 * @param {string[]} accounts - Array string akun ("Email: X\nPassword: Y")
 */
export async function addStock(botId, productId, accounts = []) {
  await connectDB();
  try {
    const product = await Product.findOne({ botId, productId }).select('name stock').lean();
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return { success: false, error: "Daftar akun tidak valid atau kosong." };
    }

    // 2. Buat dokumen ProductStock untuk setiap akun
    const stockDocs = accounts.map((accountData) => ({
      botId,
      productId,
      accountData, // Data akun dalam bentuk string
      isSold: false, // Default: tersedia
    }));

    // 3. Bulk insert (unordered to maximize throughput) and update product counter atomically
    const result = await ProductStock.insertMany(stockDocs, { ordered: false });
    const insertedCount = Array.isArray(result) ? result.length : 0;

    // 4. Update stock counter on Product (fast read later)
    if (insertedCount > 0) {
      await Product.updateOne({ botId, productId }, { $inc: { stock: insertedCount } });
    }

    // 5. Calculate totalStock using the counter (fallback to countDocuments if absent)
    const updatedProduct = await Product.findOne({ botId, productId }).select("stock name").lean();
    const totalStock = updatedProduct?.stock ?? (await ProductStock.countDocuments({ botId, productId, isSold: false }));

    return {
      success: true,
      data: {
        insertedCount,
        productId,
        name: updatedProduct?.name || product.name,
        totalStock,
      },
    };
  } catch (err) {
    console.error("❌ Gagal menambahkan stok:", err);
    return { success: false, error: err.message };
  }
}

export async function delProduct(botId, productId) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan productId
    const result = await Product.deleteOne({ botId, productId });
    if (result.deletedCount === 0)
      return { success: false, error: "Produk tidak ditemukan." };

    // Hapus juga stok akun yang terkait dari ProductStock
    await ProductStock.deleteMany({ botId, productId });

    // Hapus juga referensi produk ini dari semua Kategori milik bot tersebut
    await Category.updateMany({ botId }, { $pull: { products: productId } });

    return { success: true, data: `Produk ${productId} berhasil dihapus.` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductName(botId, productId, newName) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan productId
    const product = await Product.findOneAndUpdate(
      { botId, productId },
      { name: newName },
      { new: true }
    );
    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductPrice(botId, productId, newPrice) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan productId
    const product = await Product.findOneAndUpdate(
      { botId, productId },
      { price: Number(newPrice) },
      { new: true }
    );
    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductDesk(botId, productId, newDesc) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan productId
    const product = await Product.findOneAndUpdate(
      { botId, productId },
      { desc: newDesc },
      { new: true }
    );
    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductSnk(botId, productId, newSnk) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan productId
    const product = await Product.findOneAndUpdate(
      { botId, productId },
      { snk: newSnk },
      { new: true }
    );
    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Edit product dengan multiple fields (name, price, desc, snk)
 * @param {number} botId
 * @param {string} productId
 * @param {object} updates - Object berisi { name, price, desc, snk }
 */
export async function editProduct(botId, productId, updates = {}) {
  await connectDB();
  try {
    const updateData = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.price = Number(updates.price);
    if (updates.desc !== undefined) updateData.desc = updates.desc;
    if (updates.snk !== undefined) updateData.snk = updates.snk;

    const product = await Product.findOneAndUpdate(
      { botId, productId },
      { $set: updateData },
      { new: true }
    );

    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductID(botId, oldId, newId) {
  await connectDB();
  try {
    // 1. Cek ID baru
    const checkNew = await Product.findOne({ botId, productId: newId });
    if (checkNew) return { success: false, error: "ID baru sudah digunakan." };

    // 2. Update ID di Product
    const product = await Product.findOneAndUpdate(
      { botId, productId: oldId },
      { productId: newId },
      { new: true }
    );
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    // 3. Update ID di ProductStock
    await ProductStock.updateMany(
      { botId, productId: oldId },
      { $set: { productId: newId } }
    );

    // 4. Update referensi di Kategori
    const cats = await Category.find({ botId, products: oldId });
    for (let cat of cats) {
      const idx = cat.products.indexOf(oldId);
      if (idx !== -1) {
        cat.products[idx] = newId;
        await cat.save();
      }
    }

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mengambil daftar akun yang tersedia (TIDAK UNTUK TRANSAKSI, hanya untuk tampilan/debugging).
 * @param {number} botId
 * @param {string} productId
 * @param {number} total
 */
export async function getProductAccount(botId, productId, total = 1) {
  await connectDB();
  try {
    // Ambil akun yang belum terjual dari ProductStock
    const accounts = await ProductStock.find({
      botId,
      productId,
      isSold: false,
    })
      .select("accountData") // Hanya ambil field accountData
      .limit(total)
      .lean();

    // Mapping hasilnya menjadi array of strings (sesuai format return lama)
    const accountStrings = accounts.map((doc) => doc.accountData);

    return { success: true, data: accountStrings };
  } catch (err) {
    console.error("❌ Gagal mengambil daftar akun:", err);
    return { success: false, error: err.message };
  }
}

export async function getProductList(botId) {
  await connectDB();
  try {
    // Prefer using stock counter (fast) and only aggregate for missing counters
    const products = await Product.find({ botId }).select("productId name price desc snk terjual stock").lean();

    const missing = products.filter((p) => p.stock === undefined || p.stock === null).map((p) => p.productId);

    let stockCounts = {};
    if (missing.length > 0) {
      const agg = await ProductStock.aggregate([
        { $match: { botId, productId: { $in: missing }, isSold: false } },
        { $group: { _id: "$productId", count: { $sum: 1 } } },
      ]);
      for (const row of agg) stockCounts[row._id] = row.count;
    }

    const list = products.map((p) => {
      const stockCount = p.stock ?? stockCounts[p.productId] ?? 0;
      return {
        productId: p.productId,
        name: p.name,
        price: p.price,
        desc: p.desc,
        snk: p.snk,
        stock: stockCount,
        terjual: p.terjual,
      };
    });

    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fungsi krusial untuk mengambil stok. Menggunakan findOneAndUpdate secara atomik.
 * @param {number} botId
 * @param {string} productId
 * @param {number} total
 * @param {string} trxRefId - ID Referensi Transaksi untuk mencatat siapa yang mengambil stok.
 */
export async function takeProductAccount(
  botId,
  productId,
  total = 1,
  trxRefId = null
) {
  await connectDB();
  if (!trxRefId) {
    throw new Error("trxRefId wajib disertakan saat pengambilan stok.");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction({ readConcern: { level: "local" }, writeConcern: { w: "majority" } });

    // 1) Temukan total dokumen tersedia (sorted by oldest) dalam transaksi
    const docs = await ProductStock.find({ botId, productId, isSold: false })
      .sort({ createdAt: 1 })
      .limit(total)
      .select("_id accountData")
      .session(session)
      .lean();

    if (!docs || docs.length < total) {
      await session.abortTransaction();
      return { success: false, error: "Stok tidak mencukupi untuk jumlah yang diminta." };
    }

    const ids = docs.map((d) => d._id);

    // 2) Update all selected docs atomically to mark as sold and attach trxRefId
    const res = await ProductStock.updateMany(
      { _id: { $in: ids }, isSold: false },
      { $set: { isSold: true, trxRefId } },
      { session }
    );

    if (res.modifiedCount !== ids.length) {
      // Race happened; abort to be safe
      await session.abortTransaction();
      return { success: false, error: "Gagal mengamankan semua stok (konkurensi)." };
    }

    // 3) Update stock counter on Product
    await Product.updateOne({ botId, productId }, { $inc: { stock: -ids.length } }).session(session);

    await session.commitTransaction();
    session.endSession();

    return { success: true, data: docs.map((d) => d.accountData), trxRefId };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Gagal saat mengambil stok akun (takeProductAccount):", err);
    return { success: false, error: err.message };
  }
}

export async function takeProductAccountAtomic(botId, productId, total = 1, trxRefId = null) {
  await connectDB();
  if (!trxRefId) {
    throw new Error("trxRefId wajib disertakan saat pengambilan stok.");
  }

  try {
    const collected = [];
    const reservedIds = [];

    for (let i = 0; i < total; i++) {
      const doc = await ProductStock.findOneAndUpdate(
        { botId, productId, isSold: false },
        { $set: { isSold: true, trxRefId } },
        { sort: { createdAt: 1 }, new: true }
      ).select('_id accountData').lean();

      if (!doc) break;
      collected.push(doc.accountData);
      reservedIds.push(doc._id);
    }

    if (collected.length < total) {
      if (reservedIds.length > 0) {
        await ProductStock.updateMany({ _id: { $in: reservedIds } }, { $set: { isSold: false }, $unset: { trxRefId: "" } });
      }
      return { success: false, error: "Stok tidak mencukupi untuk jumlah yang diminta." };
    }

    await Product.updateOne({ botId, productId }, { $inc: { stock: -reservedIds.length } });

    return { success: true, data: collected, trxRefId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------- Fungsi Admin (Disesuaikan) -----------------

export async function addProduct(botId, productData) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const botExists = await Bot.exists({ botId });
    if (!botExists) return { success: false, error: "Bot tidak ditemukan." };

    // PERBAIKAN: Cek produk menggunakan productId
    const checkProduct = await Product.exists({
      botId,
      productId: productData.id,
    });
    if (checkProduct) {
      return { success: false, error: "ID produk sudah ada." };
    }

    // PERBAIKAN: Simpan menggunakan productId (tanpa field account)
    const newProduct = await Product.create({
      botId: botId,
      productId: productData.id,
      name: productData.name,
      price: productData.price,
      desc: productData.desc || "",
      snk: productData.snk || "",
      terjual: 0,
    });

    return { success: true, data: newProduct };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteProduct(botId, productId) {
  // Sama dengan delProduct, sudah diperbarui untuk menghapus ProductStock
  return await delProduct(botId, productId);
}

/**
 * Fungsi untuk admin/importer stok. Digunakan addStock yang baru.
 */
export async function addProductStock(botId, productId, accounts) {
  const res = await addStock(botId, productId, accounts);
  if (res.success) {
    // Prefer using stock counter
    const p = await Product.findOne({ botId, productId }).select("stock").lean();
    const stockCount = p?.stock ?? (await ProductStock.countDocuments({ botId, productId, isSold: false }));
    return { success: true, data: { stock: stockCount } };
  }
  return res;
}

/**
 * Menghapus stok berdasarkan array `accounts` (accountData) atau array of ObjectId strings
 */
export async function delStock(botId, productId, accounts = []) {
  await connectDB();
  try {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return { success: false, error: "Daftar akun/ids tidak valid atau kosong." };
    }

    // Jika semua item terlihat seperti ObjectId (24 hex), hapus berdasarkan _id
    const idLike = accounts.every((a) => typeof a === 'string' && /^[0-9a-fA-F]{24}$/.test(a));
    let res;
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      if (idLike) {
        const objectIds = accounts.map((a) => new mongoose.Types.ObjectId(a));
        res = await ProductStock.deleteMany({ botId, productId, _id: { $in: objectIds } }).session(session);
      } else {
        // Hapus berdasarkan accountData
        res = await ProductStock.deleteMany({ botId, productId, accountData: { $in: accounts } }).session(session);
      }

      // Decrement stock counter accordingly
      if (res.deletedCount > 0) {
        await Product.updateOne({ botId, productId }, { $inc: { stock: -res.deletedCount } }).session(session);
      }

      await session.commitTransaction();
      session.endSession();
      return { success: true, data: { deletedCount: res.deletedCount } };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Hapus stok berdasarkan array of ids
 */
export async function delStockByIds(botId, productId, ids = []) {
  await connectDB();
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: "Daftar ids diperlukan." };
    }
    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    if (validIds.length === 0) return { success: false, error: "Tidak ada id valid." };

    const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id));

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const res = await ProductStock.deleteMany({ botId, productId, _id: { $in: objectIds } }).session(session);

      if (res.deletedCount > 0) {
        await Product.updateOne({ botId, productId }, { $inc: { stock: -res.deletedCount } }).session(session);
      }

      await session.commitTransaction();
      session.endSession();

      return { success: true, data: { deletedCount: res.deletedCount } };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, error: err.message };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Ambil daftar stok (belum terjual) untuk product tertentu
 */
export async function getProductStockList(botId, productId) {
  await connectDB();
  try {
    const stocks = await ProductStock.find({ botId, productId, isSold: false })
      .select("_id accountData createdAt")
      .sort({ createdAt: 1 })
      .lean();

    return {
      success: true,
      data: stocks.map((s) => ({ id: s._id.toString(), accountData: s.accountData, createdAt: s.createdAt })),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Tandai beberapa stok sebagai terjual (isSold: true) dan set trxRefId
 */
export async function markStockAsSold(botId, productId, ids = [], trxRefId = null) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: "Daftar ids diperlukan." };
    }
    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    if (validIds.length === 0) {
      return { success: false, error: "Tidak ada id valid." };
    }
    const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id));
    const ref = trxRefId || `manual-${Date.now()}`;

    session.startTransaction();
    const res = await ProductStock.updateMany(
      { botId, productId, _id: { $in: objectIds }, isSold: false },
      { $set: { isSold: true, trxRefId: ref } },
      { session }
    );

    // Adjust product stock counter
    if (res.modifiedCount > 0) {
      await Product.updateOne({ botId, productId }, { $inc: { stock: -res.modifiedCount } }, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return { success: true, data: { modifiedCount: res.modifiedCount, trxRefId: ref } };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, error: err.message };
  }
}

// Add category (Admin version)
export async function addCategory(botId, categoryName, productIds) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const botExists = await Bot.exists({ botId });
    if (!botExists) return { success: false, error: "Bot tidak ditemukan." };

    const exist = await Category.exists({ botId, name: categoryName });
    if (exist) {
      return { success: false, error: "Kategori sudah ada." };
    }

    await Category.create({
      botId,
      name: categoryName,
      products: productIds,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Update category (Sudah benar)
export async function updateCategory(botId, categoryName, productIds) {
  await connectDB();
  try {
    const category = await Category.findOneAndUpdate(
      { botId, name: categoryName },
      { products: productIds },
      { new: true }
    );

    if (!category) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Delete category (Sudah benar)
export async function deleteCategory(botId, categoryName) {
  await connectDB();
  try {
    const res = await Category.deleteOne({ botId, name: categoryName });

    if (res.deletedCount === 0) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Compatibility wrapper used by existing routes: delete a product view (category)
export async function delProductView(botId, title) {
  // Simply reuse deleteCategory logic
  return await deleteCategory(botId, title);
}

// Remove one productId from a product view (category)
export async function delIdFromProductView(botId, title, productId) {
  await connectDB();
  try {
    const updated = await Category.findOneAndUpdate(
      { botId, name: title },
      { $pull: { products: productId } },
      { new: true }
    );

    if (!updated) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }

    return { success: true, data: { id: updated.products } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------- Statistik & Lainnya (Disesuaikan) -----------------

export async function getAdminStats(botId) {
  await connectDB();
  try {
    const totalUsers = await User.countDocuments({});
    const totalTransactions = await Transaction.countDocuments({ botId });

    // PERBAIKAN: Gunakan botId
    const bot = await Bot.findOne({ botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    // Hitung total produk dari collection Product
    const totalProducts = await Product.countDocuments({ botId });

    const totalRevenue = bot.total_nominal_transaksi || 0;
    const totalProductsSold = bot.terjual || 0;

    return {
      success: true,
      data: {
        totalUsers,
        totalTransactions,
        totalProducts,
        totalRevenue,
        totalProductsSold,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Fungsi recordSale perlu update karena produk terpisah
export async function recordSale(botId, productCode, quantity, finalPrice) {
  try {
    // 1. Update di Collection Product
    // PERBAIKAN: Gunakan productId
    await Product.updateOne(
      { botId, productId: productCode },
      { $inc: { terjual: quantity } }
    );

    // 2. Update Statistik Bot Utama
    // PERBAIKAN: Gunakan botId
    const botData = await Bot.findOne({ botId });
    if (botData) {
      botData.terjual = (botData.terjual || 0) + quantity;
      botData.soldtoday = (botData.soldtoday || 0) + quantity;
      botData.trxtoday = (botData.trxtoday || 0) + finalPrice;
      await botData.save();
    }
  } catch (dbError) {
    console.error("Gagal memperbarui statistik penjualan:", dbError);
  }
}

export async function addProductSold(botId, productId, totalTerjual) {
  await connectDB();
  try {
    // PERBAIKAN: Update total terjual di Bot menggunakan botId
    await Bot.findOneAndUpdate({ botId }, { $inc: { terjual: totalTerjual } });

    // PERBAIKAN: Update terjual di Product spesifik menggunakan productId
    const updatedProduct = await Product.findOneAndUpdate(
      { botId, productId },
      { $inc: { terjual: totalTerjual } },
      { new: true }
    );

    if (!updatedProduct)
      return {
        success: false,
        error: "Produk tidak ditemukan.",
      };

    return { success: true, data: updatedProduct };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getDBData(fn, ...args) {
  try {
    const result = await fn(...args);
    if (!result.success) throw new Error(result.message);
    return result.data;
  } catch (e) {
    console.error("Error database :\n" + e);
    return null;
  }
}

export async function getAllUsers() {
  await connectDB();
  try {
    const users = await User.find({}).select("-__v").lean();
    return { success: true, data: formatUsersForFrontend(users) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteUser(userId) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan userId
    const user = await User.findOneAndDelete({ userId });
    if (!user) return { success: false, error: "User tidak ditemukan." };
    await AuthUser.deleteOne({ telegramId: userId });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getTransactionHistory(botId, limit = 0) {
  await connectDB();
  try {
    const query = Transaction.find({ botId }).sort({ createdAt: -1 });
    if (limit > 0) {
      query.limit(limit);
    }
    const transactions = await query.lean();
    return { success: true, data: transactions };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getAllTransactions(botId) {
  await connectDB();
  try {
    const transactions = await Transaction.find({ botId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return { success: true, data: transactions };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getPublicStats(botId) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const bot = await Bot.findOne({ botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    const totalRevenue = bot.total_nominal_transaksi || 0;
    const totalProductsSold = bot.terjual || 0;
    return {
      success: true,
      data: { totalRevenue, totalProductsSold },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mengambil detail transaksi berdasarkan ID Referensi dan mengambil data akun terkait
 * dari koleksi ProductStock.
 * @param {string} reffId - ID Referensi Transaksi
 */
export async function getTransactionDetails(reffId) {
  await connectDB();
  try {
    const transaction = await Transaction.findOne({ reffId }).lean();
    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan." };
    }

    // PERBAIKAN KRITIS: Ambil akun dari ProductStock menggunakan trxRefId
    const soldAccounts = await ProductStock.find({ trxRefId: reffId })
      .select("accountData")
      .lean();

    // Gabungkan data akun ke dalam objek transaksi untuk kompatibilitas
    transaction.accounts = soldAccounts.map((doc) => doc.accountData);

    return { success: true, data: transaction };
  } catch (err) {
    console.error("❌ Gagal mengambil detail transaksi:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Alias untuk getTransactionDetails() - mencari transaksi berdasarkan reffId
 * (fungsi ini dipanggil dari app.js di endpoint transaction detail)
 * @param {string} reffId - ID Referensi Transaksi
 */
export async function getTransactionByRefId(reffId) {
  return await getTransactionDetails(reffId);
}

export async function addTransactionHistory(
  userId,
  botId,
  productId,
  productName,
  quantity,
  price,
  // accounts, // PERBAIKAN: accounts dihilangkan dari parameter, karena akan diambil dari ProductStock
  status = "completed",
  paymentMethod = "balance",
  snk = "",
  reffId
) {
  await connectDB();
  try {
    // Pastikan reffId ada dan unik
    if (!reffId) throw new Error("reffId wajib disertakan.");

    const totalAmount = price * quantity;

    // Periksa apakah reffId sudah digunakan (ini penting)
    const existingTrx = await Transaction.exists({ reffId });
    if (existingTrx) {
      throw new Error(`Transaksi dengan reffId ${reffId} sudah ada.`);
    }

    // accounts DIHILANGKAN dari dokumen Transaction
    const newTransaction = await Transaction.create({
      userId,
      botId,
      productId,
      productName,
      quantity,
      price,
      status,
      totalAmount,
      paymentMethod,
      snk,
      reffId,
    });
    return { success: true, data: newTransaction };
  } catch (err) {
    console.error("❌ Gagal mencatat riwayat transaksi:", err);
    return { success: false, error: err.message };
  }
}

export async function getUserTransactionHistory(userId, limit = 10, skip = 0) {
  await connectDB();
  try {
    // Return lean objects and limit fields for speed
    const history = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select("userId botId productId productName quantity price status totalAmount createdAt reffId")
      .lean();
    return { success: true, data: history };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getBotGlobalTransactionHistory(
  botId,
  limit = 10,
  skip = 0
) {
  await connectDB();
  try {
    const history = await Transaction.find({ botId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select("userId botId productId productName quantity price status totalAmount createdAt reffId")
      .lean();
    return { success: true, data: history };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addBotTransactionDetailed(
  botId,
  totalTransaksi,
  totalTerjual,
  totalSoldToday,
  totalTrxToday,
  nominalLifetime,
  nominalToday
) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const update = await Bot.findOneAndUpdate(
      { botId },
      {
        $inc: {
          transaksi: totalTransaksi,
          terjual: totalTerjual,
          soldtoday: totalSoldToday,
          trxtoday: totalTrxToday,
          total_nominal_transaksi: nominalLifetime,
          nominaltoday: nominalToday,
        },
      },
      { new: true }
    );
    if (!update) return { success: false, error: "ID Bot tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addBotTransaction(
  botId,
  totalTransaksi = 1,
  totalNominal = 0
) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan botId
    const update = await Bot.findOneAndUpdate(
      { botId },
      {
        $inc: {
          transaksi: totalTransaksi,
          total_nominal_transaksi: totalNominal,
        },
      },
      { new: true }
    );
    if (!update) return { success: false, error: "ID Bot tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function calculateTotalRevenue() {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    return result[0]?.total || 0;
  } catch (err) {
    return 0;
  }
}

export async function getRevenueByDate(startDate, endDate) {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    return result[0]?.total || 0;
  } catch (err) {
    return 0;
  }
}

export async function calculateTotalPcs() {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalPcs: { $sum: "$quantity" } } },
    ]);
    return result[0]?.totalPcs || 0;
  } catch (err) {
    return 0;
  }
}

export async function getPcsPerProduk() {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$productId",
          productName: { $first: "$productName" },
          totalPcs: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { totalPcs: -1 } },
    ]);
    return result;
  } catch (err) {
    return [];
  }
}

export async function getPcsTerjualPerProduk(productId) {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed", productId } },
      { $group: { _id: "$productId", totalPcs: { $sum: "$quantity" } } },
    ]);
    return result[0]?.totalPcs || 0;
  } catch (err) {
    return 0;
  }
}

export async function addUserTransaction(
  userId,
  totalTransaksi,
  totalMembeli,
  nominal
) {
  await connectDB();
  try {
    // PERBAIKAN: Gunakan userId
    const update = await User.findOneAndUpdate(
      { userId },
      {
        $inc: {
          transaksi: totalTransaksi,
          membeli: totalMembeli,
          total_nominal_transaksi: nominal,
        },
      },
      { new: true }
    );
    if (!update) return { success: false, error: "ID User tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Fungsi internal helper
async function pcsPerProdukDariTransaksi(botId) {
  await connectDB();
  const hasil = await Transaction.aggregate([
    { $match: { status: "completed", botId } },
    {
      $group: {
        _id: "$productId",
        namaProduk: { $first: "$productName" },
        totalPcs: { $sum: "$quantity" },
        totalPendapatan: { $sum: "$totalAmount" },
      },
    },
    { $sort: { totalPcs: -1 } },
  ]);
  return hasil;
}

export async function totalTransaksi(botId) {
  try {
    let data = await pcsPerProdukDariTransaksi(botId);
    let totalPcs = 0;
    let totalPendapatan = 0;
    data.forEach((item) => {
      totalPcs += item.totalPcs;
      totalPendapatan += item.totalPendapatan;
    });
    return { totalPcs, totalPendapatan };
  } catch (e) {
    console.log("Gagal menghitung total transaksi:", e);
    return { totalPcs: 0, totalPendapatan: 0 };
  }
}

export async function getTelegramUsers() {
  try {
    await connectDB();
    let data = await User.find({ isTelegram: true });
    return data;
  } catch (error) {
    console.error("Error fetching Telegram users:", error);
    return [];
  }
}

export async function getProdukPopuler(botId, limit = 10) {
  await connectDB();
  try {
    const topProducts = await Transaction.aggregate([
      { $match: { botId: botId, status: "completed" } },
      {
        $group: {
          _id: "$productId",
          productName: { $first: "$productName" },
          totalSold: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalAmount" },
          lastTransaction: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);
    return { success: true, data: topProducts };
  } catch (err) {
    console.error("❌ Gagal mengambil produk populer:", err);
    return { success: false, error: err.message };
  }
}
