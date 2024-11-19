import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Включаем CORS
app.use(cors());

// Настраиваем MIME-типы для JavaScript модулей
app.use((req, res, next) => {
    const ext = extname(req.path);
    if (ext === '.js' || ext === '.mjs') {
        res.type('application/javascript; charset=UTF-8');
    }
    next();
});

// Настраиваем прокси для API запросов
app.use('/api', createProxyMiddleware({
    target: 'https://todo.doczilla.pro',
    changeOrigin: true,
    secure: false,
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
}));

// Раздаём статические файлы с правильными заголовками
app.use(express.static(join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript; charset=UTF-8');
        }
    }
}));

// Обработка всех остальных маршрутов - отдаём index.html
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Static files are served from: ${join(__dirname, 'public')}`);
});