const express = require('express');
const CryptoJS = require('crypto-js');
const path = require('path');

const app = express();
const PORT = 3000;

// ------------------- 替换成你的密钥 -------------------
const UID = '公钥';
const PRIVATE_KEY = '私钥';

app.use(express.json());
app.use(express.static('public'));

function generateSignature(ts, ttl = 1800) {
    const params = {
        ts: ts.toString(),
        ttl: ttl.toString(),
        uid: UID
    };
    const sortedKeys = Object.keys(params).sort();
    const paramStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    const hmac = CryptoJS.HmacSHA1(paramStr, PRIVATE_KEY);
    const signature = hmac.toString(CryptoJS.enc.Base64);
    return encodeURIComponent(signature);
}

app.post('/api/weather', async (req, res) => {
    const { location } = req.body;
    if (!location || location.trim() === '') {
        return res.status(400).json({ error: '请提供城市名称' });
    }

    const ts = Math.floor(Date.now() / 1000);
    const ttl = 1800;
    const sig = generateSignature(ts, ttl);

    const apiUrl = `https://api.seniverse.com/v3/weather/now.json`
        + `?location=${encodeURIComponent(location)}`
        + `&ts=${ts}`
        + `&ttl=${ttl}`
        + `&uid=${UID}`
        + `&sig=${sig}`;

    try {
        // Node 18+ 自带 fetch，直接使用
        const response = await fetch(apiUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('获取天气失败:', error);
        res.status(500).json({ error: '获取天气失败，请稍后重试' });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
