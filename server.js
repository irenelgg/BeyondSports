const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const path = require('path');
const port = 3000;

// Persistent database connection
// Persistent database connection
const db = new sqlite3.Database('./events.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the events database.');

        // Create the events table if it doesn't exist
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
                console.log('Events table created or already exists.');
            }
        });

        // Create the leagues table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS leagues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leagueName TEXT,
            prize TEXT,
            eventDates TEXT,
            spots INTEGER,
            organizer TEXT,
            rules TEXT,
            imageUrl TEXT
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('League table created or already exists.');
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

app.post('/league', upload.single('image'), (req, res) => {
    const { leagueName, prize, eventDates, spots, organizer, rules } = req.body;
    const imageUrl = req.file ? `../assets/images/${req.file.filename}` : '';

    const sql = `INSERT INTO leagues (leagueName, prize, eventDates, spots, organizer, rules, imageUrl) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [leagueName, prize, eventDates, spots, organizer, rules, imageUrl], (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Failed to add league');
        } else {
            res.send('League added successfully!');
        }
    });
});

app.get('/leagues', (req, res) => {
    db.all(`SELECT * FROM leagues`, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Failed to retrieve leagues');
        } else {
            res.json(rows);
        }
    });
});



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});