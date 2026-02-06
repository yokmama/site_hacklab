const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const DOORKEEPER_TOKEN = process.env.DOORKEEPER_TOKEN || '98bha3xKBVsyeUn-xewN'; // User provided token
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const DATA_DIR = path.join(__dirname, '../docs/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'events.json');

// Helper: Native Fetch (Node 18+) or HTTPS wrapper if older
async function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        // If 401/403, might be invalid token
                        console.warn(`Request to ${url} returned ${res.statusCode}. Body: ${data}`);
                        resolve([]); // Return empty to prevent crash
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

// Helper: Fetch CSV
async function fetchCsv(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// 1. Fetch from DoorKeeper Groups
async function getDoorKeeperEvents() {
    const groups = ['minecraft-day', '8x9lab'];
    const groupNames = {
        'minecraft-day': 'Minecraft Day',
        '8x9lab': 'Hack Lab (8x9 Tokyo)'
    };
    let allEvents = [];

    for (const group of groups) {
        // Public API endpoint for group events
        // Note: The /groups/:name/events endpoint lists public upcoming events.
        const url = `https://api.doorkeeper.jp/groups/${group}/events?since=${new Date().toISOString()}`;
        
        try {
            const events = await fetchJson(url, {
                // Public events might not need token, but sending it if available is good practice
                headers: DOORKEEPER_TOKEN ? { 'Authorization': `Bearer ${DOORKEEPER_TOKEN}` } : {}
            });
            
            if (Array.isArray(events)) {
                const mapped = events.map(e => {
                    // Helper to strip HTML tags
                    const stripHtml = (html) => {
                        if (!html) return '';
                        return html.replace(/<[^>]*>?/gm, '');
                    };

                    const rawDescription = e.event.description || '';
                    const cleanDescription = stripHtml(rawDescription);

                    return {
                        title: e.event.title,
                        start: e.event.starts_at,
                        end: e.event.ends_at,
                        url: e.event.public_url,
                        color: '#3788d8', // Blue for DoorKeeper
                        description: '' // Clear description as requested
                    };
                });
                allEvents = allEvents.concat(mapped);
                console.log(`Fetched ${mapped.length} events from ${group}`);
            }
        } catch (error) {
            console.error(`Error fetching group ${group}:`, error.message);
        }
    }
    return allEvents;
}

// 2. Fetch from Google Sheets
// Sheet must be "Published to Web" as CSV
// Columns expected: Title, Date, StartTime, EndTime, Link
async function getGoogleSheetEvents() {
    if (!GOOGLE_SHEETS_ID) {
        console.log('Skipping Google Sheets (No ID)');
        return [];
    }
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv`;
    
    try {
        const csvText = await fetchCsv(url);
        const rows = csvText.split('\n').slice(1); // Skip header
        const events = [];

        rows.forEach(row => {
            const cols = row.split(','); // Simple split, be careful with commas in text
            if (cols.length < 3) return;
            
            // Assuming: Title, Date(YYYY-MM-DD), StartTime(HH:MM), EndTime(HH:MM), Link
            const title = cols[0];
            const date = cols[1];
            const start = cols[2];
            const end = cols[3];
            const link = cols[4] ? cols[4].trim() : '';

            if (title && date) {
                events.push({
                    title: title,
                    start: `${date}T${start || '00:00'}:00`,
                    end: end ? `${date}T${end}:00` : undefined,
                    url: link,
                    color: '#FF9F1C', // Orange for Special Events
                    description: 'Special Event'
                });
            }
        });
        return events;
    } catch (error) {
        console.error('Google Sheets Error:', error.message);
        return [];
    }
}

// Main Execution
(async () => {
    console.log('Starting Event Fetch...');
    
    // Ensure dir exists
    if (!fs.existsSync(DATA_DIR)){
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const [doorkeeper, sheet] = await Promise.all([
        getDoorKeeperEvents(),
        getGoogleSheetEvents()
    ]);

    const allEvents = [...doorkeeper, ...sheet];
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEvents, null, 2));
    console.log(`Saved ${allEvents.length} events to ${OUTPUT_FILE}`);
})();
