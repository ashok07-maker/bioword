const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { Pool } = require('pg');

const PORT = 5000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// route for site map xml file 
const path = require('path');

app.get('/sitemap.xml', (req, res) => {
res.type('application/xml');
res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};
// to verify google search console 
app.get('/google5299d52fa4003f58.html', (req, res) => {
res.send('google-site-verification: google5299d52fa4003f58.html');
});



// Helper function to get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Helper function to handle JSON responses
function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
    }

    // Handle API endpoint for getting the Gemini API key
    if (pathname === '/api/key') {
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(process.env.GEMINI_API_KEY || '');
        return;
    }

    // Save word breakdown to database
    if (pathname === '/api/breakdown' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { 
                    originalWord, 
                    prefix, 
                    prefixMeaning, 
                    root, 
                    rootMeaning, 
                    suffix, 
                    suffixMeaning, 
                    combinedMeaning,
                    rawResponse 
                } = data;

                // Save to word_breakdowns table
                const result = await pool.query(`
                    INSERT INTO word_breakdowns 
                    (original_word, prefix, prefix_meaning, root, root_meaning, suffix, suffix_meaning, combined_meaning, raw_response, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                    RETURNING id
                `, [originalWord, prefix, prefixMeaning, root, rootMeaning, suffix, suffixMeaning, combinedMeaning, JSON.stringify(rawResponse)]);

                // Log search history
                await pool.query(`
                    INSERT INTO search_history 
                    (search_term, ip_address, user_agent, success, created_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `, [originalWord, getClientIP(req), req.headers['user-agent'], true]);

                // Update popular terms
                await pool.query(`
                    INSERT INTO popular_terms (term, search_count, last_searched)
                    VALUES ($1, 1, NOW())
                    ON CONFLICT (term) 
                    DO UPDATE SET 
                        search_count = popular_terms.search_count + 1,
                        last_searched = NOW()
                `, [originalWord.toLowerCase()]);

                sendJSON(res, { success: true, id: result.rows[0].id });
            } catch (error) {
                console.error('Database error:', error);
                sendJSON(res, { success: false, error: error.message }, 500);
            }
        });
        return;
    }

    // Get search history
    if (pathname === '/api/history' && method === 'GET') {
        try {
            const result = await pool.query(`
                SELECT wb.*, sh.created_at as search_date
                FROM word_breakdowns wb
                JOIN search_history sh ON wb.original_word = sh.search_term
                WHERE sh.success = true
                ORDER BY sh.created_at DESC
                LIMIT 20
            `);
            sendJSON(res, result.rows);
        } catch (error) {
            console.error('Database error:', error);
            sendJSON(res, { error: error.message }, 500);
        }
        return;
    }

    // Get popular terms
    if (pathname === '/api/popular' && method === 'GET') {
        try {
            const result = await pool.query(`
                SELECT term, search_count, last_searched
                FROM popular_terms
                ORDER BY search_count DESC, last_searched DESC
                LIMIT 10
            `);
            sendJSON(res, result.rows);
        } catch (error) {
            console.error('Database error:', error);
            sendJSON(res, { error: error.message }, 500);
        }
        return;
    }

    // Search existing breakdowns
    if (pathname === '/api/search' && method === 'GET') {
        try {
            const query = parsedUrl.query.q || '';
            if (!query) {
                sendJSON(res, { error: 'Query parameter required' }, 400);
                return;
            }

            const result = await pool.query(`
                SELECT * FROM word_breakdowns 
                WHERE LOWER(original_word) LIKE LOWER($1)
                ORDER BY created_at DESC
                LIMIT 10
            `, [`%${query}%`]);
            
            sendJSON(res, result.rows);
        } catch (error) {
            console.error('Database error:', error);
            sendJSON(res, { error: error.message }, 500);
        }
        return;
    }

    // Serve static files
    let filePath = pathname === '/' ? './index.html' : `.${pathname}`;
    
    // Security check: prevent directory traversal
    if (filePath.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Biology Word Breaker server running at http://0.0.0.0:${PORT}/`);
});
