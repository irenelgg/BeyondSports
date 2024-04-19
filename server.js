const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const path = require("path");
const port = 3000;

// Persistent database connection
// Persistent database connection
const db = new sqlite3.Database(
  "./events.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Connected to the events database.");

      // Create the events table if it doesn't exist
      db.run(
        `CREATE TABLE IF NOT EXISTS events (
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
            accessibility TEXT,
            creator_id INTEGER
        )`,
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log("Events table created or already exists.");
          }
        }
      );

      // Create the leagues table if it doesn't exist
      db.run(
        `CREATE TABLE IF NOT EXISTS leagues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leagueName TEXT,
            prize TEXT,
            eventDates TEXT,
            spots INTEGER,
            organizer TEXT,
            sport TEXT,
            rules TEXT,
            imageUrl TEXT,
            creator_id INTEGER
        )`,
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log("League table created or already exists.");
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            accessibility TEXT
        )`,
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log("Users table created or already exists.");
          }
        }
      );

      // League Events Relationship table
      db.run(`CREATE TABLE IF NOT EXISTS league_events (
            league_id INTEGER,
            event_id INTEGER,
            FOREIGN KEY (league_id) REFERENCES leagues(id),
            FOREIGN KEY (event_id) REFERENCES events(id)
        )`);

      // User Participation in leagues and events
      db.run(`CREATE TABLE IF NOT EXISTS participation (
            user_id INTEGER,
            league_id INTEGER,
            event_id INTEGER,
            type TEXT,  -- 'creator', 'participant'
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (league_id) REFERENCES leagues(id),
            FOREIGN KEY (event_id) REFERENCES events(id)
        )`);

      // Pending Invites
      db.run(`CREATE TABLE IF NOT EXISTS invites (
            invite_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            league_id INTEGER,
            status TEXT,  -- 'pending', 'accepted', 'declined'
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (league_id) REFERENCES leagues(id)
        )`);
    }
  }
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const multer = require("multer");
// Setup multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/images/");
  },
  filename: function (req, file, cb) {
    // Use the original file extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

app.post("/event", upload.single("image"), (req, res) => {
  const {
    eventName,
    eventDate,
    eventTime,
    address,
    city,
    state,
    description,
    spots,
    sport,
    creator_id,
  } = req.body;
  const imageUrl = req.file ? `../assets/images/${req.file.filename}` : "";
  const accessibilityString = ["blindness", "wheelchair"]
    .filter((acc) => req.body[acc])
    .join(",");

  const sql = `INSERT INTO events (eventName, eventDate, eventTime, address, city, state, description, spots, sport, imageUrl, accessibility, creator_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [
      eventName,
      eventDate,
      eventTime,
      address,
      city,
      state,
      description,
      spots,
      sport,
      imageUrl,
      accessibilityString,
      creator_id,
    ],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("Failed to add event");
      } else {
        res.send("Event added successfully!");
      }
    }
  );
});

app.get("/events", (req, res) => {
  db.all(`SELECT * FROM events`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to retrieve events");
    } else {
      res.json(rows);
    }
  });
});

app.post("/link-event-to-league", (req, res) => {
  const { league_id, event_id } = req.body;
  const sql = `INSERT INTO league_events (league_id, event_id) VALUES (?, ?)`;

  db.run(sql, [league_id, event_id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to link event to league");
    } else {
      res.send("Event linked to league successfully!");
    }
  });
});

app.post("/league", upload.single("image"), (req, res) => {
  const { leagueName, prize, eventDates, spots, organizer, rules, creator_id } =
    req.body;
  const imageUrl = req.file ? `../assets/images/${req.file.filename}` : "";

  const sql = `INSERT INTO leagues (leagueName, prize, eventDates, spots, organizer, sport, rules, imageUrl, creator_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [
      leagueName,
      prize,
      eventDates,
      spots,
      organizer,
      rules,
      imageUrl,
      creator_id,
    ],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("Failed to add league");
      } else {
        res.send("League added successfully!");
      }
    }
  );
});

app.get("/leagues", (req, res) => {
  db.all(`SELECT * FROM leagues`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to retrieve leagues");
    } else {
      res.json(rows);
    }
  });
});

// Create an invite
app.post("/invite", (req, res) => {
  const { user_id, league_id } = req.body;
  const sql = `INSERT INTO invites (user_id, league_id, status) VALUES (?, ?, 'pending')`;

  db.run(sql, [user_id, league_id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to create invite");
    } else {
      res.send("Invite created successfully!");
    }
  });
});

// Update an invite
app.put("/invite/:invite_id", (req, res) => {
  const { status } = req.body; // 'accepted' or 'declined'
  const sql = `UPDATE invites SET status = ? WHERE invite_id = ?`;

  db.run(sql, [status, req.params.invite_id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to update invite");
    } else {
      res.send("Invite updated successfully!");
    }
  });
});

//Get all events for a sport
app.get("/events/sport", (req, res) => {
  const sport = req.query.sport;
  const sql = "SELECT * FROM events WHERE sport = ?";
  console.log("REACHED HERE");
  db.all(sql, [sport], (err, rows) => {
    if (err) {
      res.status(500).send("Server error");
      console.error(err.message);
    } else {
      res.json(rows);
    }
  });
});

//Get all events by ID
app.get('/events/:id', (req, res) => {
  const { id } = req.params; // Get the event ID from the URL parameter
  const sql = 'SELECT * FROM events WHERE id = ?';
  db.get(sql, [id], (err, row) => {
      if (err) {
          res.status(500).send({ error: err.message });
          return;
      }
      if (row) {
          res.json(row);
      } else {
          res.status(404).send({ error: "Event not found" });
      }
  });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
