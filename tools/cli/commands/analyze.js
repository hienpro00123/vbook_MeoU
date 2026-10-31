const axios = require('axios');
const cheerio = require('cheerio');

async function handleAnalyzeCommand(options, workspaceRoot) {
    const url = options.url || options.plugin; // Use plugin flag if url not explicitly provided
    if (!url || !url.startsWith('http')) {
        console.error('[ERROR] Please provide a valid URL to analyze.');
        return false;
    }

    console.log(`\nVBook Extension Analyzer: ${url}`);
    console.log('=========================================');

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const host = new URL(url).origin;

        // 1. Title Analysis
        const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        const titleSelector = $('h1').length ? 'h1' : ( $('meta[property="og:title"]').length ? 'meta[property="og:title"]' : 'title' );

        // 2. Author Analysis
        let author = '';
        let authorSelector = '';
        $('*').each((i, el) => {
            const text = $(el).text();
            if (text.includes('Tác giả') || text.includes('Author')) {
                author = text.split(':').pop().strip();
                authorSelector = $(el).prop('tagName').toLowerCase();
                return false;
            }
        });

        // 3. Chapter List Analysis
        const chapterLinks = [];
        $('a').each((i, el) => {
            const text = $(el).text().toLowerCase();
            if (text.includes('chương') || text.includes('chapter') || /^\d+$/.test(text.trim())) {
                chapterLinks.push({
                    text: $(el).text().trim(),
                    href: $(el).attr('href'),
                    selector: 'a'
                });
            }
        });

        console.log(`Detected Title: ${title}`);
        console.log(`Detected Author: ${author || 'Unknown'}`);
        console.log(`Found ${chapterLinks.length} potential chapter links.`);

        console.log('\n--- Suggested VBook Snippet (detail.js) ---');
        console.log('```javascript');
        console.log('function execute(url) {');
        console.log('    var response = fetch(url);');
        console.log('    if (!response.ok) return null;');
        console.log('    var doc = response.html();');
        console.log('    return Response.success({');
        console.log(`        name: doc.select("${titleSelector}").text(),`);
        console.log(`        author: doc.select("${authorSelector || '.author'}").text(),`);
        console.log(`        host: "${host}"`);
        console.log('    });');
        console.log('}');
        console.log('```');

        return true;
    } catch (err) {
        console.error(`[ERROR] Failed to fetch or analyze URL: ${err.message}`);
        return false;
    }
}

module.exports = { handleAnalyzeCommand };
