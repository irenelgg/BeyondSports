const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const path = require('path');
const port = 3000;

// Persistent database connection
const db = new sqlite3.Database('./events.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the events database.');
        db.run(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eventName TEXT,
            eventDate DATE,
            eventTime TIME,
            address TEXT,
            city TEXT,
            state TEXT,
            description TEXT,
            spots INTEGER,
            sport TEXT,
            imageUrl TEXT,
            accessibility TEXT
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Table created or already exists.');
            }
        });
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const multer = require('multer');
// Setup multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/assets/images/');
    },
    filename: function (req, file, cb) {
        // Use the original file extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/event', upload.single('image'), (req, res) => {
    const { eventName, eventDate, eventTime, address, city, state, description, spots, sport } = req.body;
    const imageUrl = req.file ? `../assets/images/${req.file.filename}` : '';
    const accessibilityString = ['blindness', 'wheelchair'].filter(acc => req.body[acc]).join(',');

    const sql = `INSERT INTO events (eventName, eventDate, eventTime, address, city, state, description, spots, sport, imageUrl, accessibility) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [eventName, eventDate, eventTime, address, city, state, description, spots, sport, imageUrl, accessibilityString], (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Failed to add event');
        } else {
            res.send('Event added successfully!');
        }
    });
});


app.get('/events', (req, res) => {
    db.all(`SELECT * FROM events`, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Failed to retrieve events');
        } else {
            res.json(rows);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
