const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();

app.get('/api/scrape', async (req, res) => {
    try {
        const { url } = req.query;
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Try to get meta image
        const image = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('meta[property="og:image:url"]').attr('content') ||
                     $('link[rel="image_src"]').attr('href');
        
        res.json({ image });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Proxy server running on port 3000');
}); 