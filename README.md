# Dashboard Admin

Dashboard Admin dengan React Frontend dan Express Backend, siap deploy ke Vercel.

## 📁 Struktur Proyek

```
DashboardPoduk-Lokal/
├── .env                  # Environment variables
├── package.json          # Unified dependencies
├── vite.config.ts        # Vite config dengan proxy ke backend
├── vercel.json           # Konfigurasi deployment Vercel
├── index.html            # React entry point
│
├── api/                  # Vercel Serverless Functions
│   └── index.js          # All API routes (untuk Vercel)
│
├── server/               # Backend Express (untuk development)
│   ├── app.js            # Express API server
│   └── database.js       # MongoDB layer
│
├── src/                  # Frontend React + TypeScript
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   └── types/
│
├── public/               # Static assets
└── dist/                 # Build output (generated)
```

## 🚀 Cara Menjalankan

### Development (Local)

```bash
# Install dependencies
npm install

# Jalankan frontend + backend bersamaan
npm run dev
```

Ini akan menjalankan:
- **Frontend (Vite)**: http://localhost:3000
- **Backend (Express)**: http://localhost:5000

Frontend akan otomatis proxy requests `/api/*` ke backend.

### Production Build

```bash
npm run build
```

Output akan berada di folder `dist/`.

## ☁️ Deploy ke Vercel

1. **Environment Variables** - Set di Vercel Dashboard:
   - `MONGODB_URL` - URL koneksi MongoDB Atlas
   - `BOT_ID` - ID Bot Telegram
   - `PASSWORD` - Password admin

2. **Deploy**:
   ```bash
   vercel
   ```

   Atau connect repository ke Vercel untuk auto-deploy.

### Cara Kerja di Vercel

- **Frontend** → Static files dari `dist/`
- **Backend** → Serverless Function dari `api/index.js`

Semua requests ke `/api/*` akan di-route ke serverless function.

## 🔧 Environment Variables

Buat file `.env` di root folder:

```env
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/?appName=YourApp
BOT_ID=1234567890
PASSWORD=your_password
```

## 📝 Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan development server (frontend + backend) |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview production build |
| `npm run server` | Jalankan backend saja |
| `npm run client` | Jalankan frontend saja |
| `npm run lint` | Jalankan ESLint |

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, React Router
- **Backend**: Express.js, Mongoose
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (Static + Serverless)
