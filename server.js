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
    league_id, // Note league_id is still received but handled differently
  } = req.body;
  const imageUrl = req.file ? `/assets/images/${req.file.filename}` : "";
  const accessibilityString = ["blindness", "wheelchair"]
    .filter((acc) => req.body[acc])
    .join(",");

  const sql = `INSERT INTO events (
      eventName, eventDate, eventTime, address, city, state, description,
      spots, sport, imageUrl, accessibility, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
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
  ];

  // Execute SQL to insert the event
  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to add event");
    } else {
      const eventId = this.lastID; // Get the ID of the newly inserted event
      if (league_id) {
        // If a league_id was provided, link the event to the league
        const linkSql = `INSERT INTO league_events (league_id, event_id) VALUES (?, ?)`;
        db.run(linkSql, [league_id, eventId], function (linkErr) {
          if (linkErr) {
            console.error(linkErr.message);
            res.status(500).send("Failed to link event to league");
          } else {
            console.log({
              message: "Event added and linked to league successfully!",
              eventId: eventId,
              leagueId: league_id,
            });
            res.redirect(`/pages/add-events.html?leagueId=${league_id}`);
          }
        });
      } else {
        // No league_id provided, so just confirm event creation
        // redirect to homepage
        res.redirect("/pages/homepage.html");
      }
    }
  });
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

app.get("/events/league/:leagueId", (req, res) => {
  const sql =
    "SELECT * FROM events e INNER JOIN league_events le ON e.id = le.event_id WHERE le.league_id = ?";
  db.all(sql, [req.params.leagueId], (err, rows) => {
    if (err) {
      res.status(500).send("Server error");
      console.error(err.message);
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
  const {
    leagueName,
    prize,
    eventDates,
    spots,
    organizer,
    sport,
    rules,
    creator_id,
  } = req.body;
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
      sport,
      rules,
      imageUrl,
      creator_id,
    ],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send("Failed to add league");
      } else {
        const leagueId = this.lastID; // Get the ID of the newly inserted league

        // Automatically create a pending participation for the creator
        const participationSql = `INSERT INTO participation (user_id, league_id, event_id, type) VALUES (?, ?, NULL, 'pending')`;
        db.run(participationSql, [creator_id, leagueId], (participationErr) => {
          if (participationErr) {
            console.error(participationErr.message);
            res.status(500).send("Failed to create initial participation");
          } else {
            res.redirect(`/pages/add-events.html?leagueId=${leagueId}`); // Ensure the redirection path matches your setup
          }
        });
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
  const userId = 1;
  const accessibility = req.query.accessibility; // Get accessibility from query parameters

  if (!userId) {
    return res.status(400).send("User ID is required");
  }

  let params = [sport, userId];

  let sql = `
      SELECT e.* FROM events e
      WHERE e.sport = ? AND e.id NOT IN (
          SELECT p.event_id FROM participation p WHERE p.user_id = ? AND p.event_id IS NOT NULL AND p.type = 'participant'
      )
  `;

  if (accessibility) {
    sql += ` AND accessibility LIKE ?`;
    params.push("%" + accessibility + "%"); // Search for events with the specified accessibility
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).send("Server error");
      console.error(err.message);
    } else {
      res.json(rows);
    }
  });
});

//Get all events by ID
app.get("/events/:id", (req, res) => {
  const { id } = req.params; // Get the event ID from the URL parameter
  const sql = "SELECT * FROM events WHERE id = ?";
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

//Get all leagues for a sport
app.get("/leagues/sport", (req, res) => {
  const sport = req.query.sport;
  const userId = 1;
  const accessibility = req.query.accessibility;

  if (!userId) {
    return res.status(400).send("User ID is required");
  }

  let sql = `
    SELECT l.* FROM leagues l
    WHERE l.sport = ? AND l.id NOT IN (
        SELECT p.league_id FROM participation p WHERE p.user_id = ? AND p.league_id IS NOT NULL AND p.type = 'participant' 
    )
`;

  let params = [sport, userId];

  if (accessibility) {
    sql += ` AND EXISTS (
      SELECT 1 FROM league_events le
      JOIN events e ON le.event_id = e.id
      WHERE le.league_id = l.id AND e.accessibility LIKE ?
  )`;
    params.push("%" + accessibility + "%"); // Ensure this matches the number of placeholders
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).send("Server error");
      console.error(err.message);
    } else {
      res.json(rows);
    }
  });
});

// Get all events for a specific league
app.get("/events/league/:leagueId", (req, res) => {
  const { leagueId } = req.params;
  const sql = `
      SELECT e.* FROM events e
      INNER JOIN league_events le ON e.id = le.event_id
      WHERE le.league_id = ?;
  `;

  db.all(sql, [leagueId], (err, events) => {
    if (err) {
      res.status(500).send({ error: err.message });
      console.error(err.message);
      return;
    }
    res.json(events);
  });
});

app.get("/leagues/:id", (req, res) => {
  const sql = "SELECT * FROM leagues WHERE id = ?";
  db.get(sql, [req.params.id], (err, result) => {
    if (err) {
      res.status(500).send("Server error");
      return;
    }
    if (result) {
      res.json(result);
    } else {
      res.status(404).send("League not found");
    }
  });
});

// POST endpoint to RSVP to an event
app.post("/rsvp", (req, res) => {
  const { user_id, event_id, league_id } = req.body;
  const type = "participant"; // Default type is 'participant', but you can modify it based on your logic

  const sql = `INSERT INTO participation (user_id, event_id, league_id, type) VALUES (?, ?, ?, ?)`;

  db.run(sql, [user_id, event_id, league_id, type], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to RSVP to event");
    } else {
      res.send({ message: "RSVP successful!", participationId: this.lastID });
    }
  });
});

// GET events by user ID
app.get("/events/user/:userId", (req, res) => {
  const sql = `SELECT e.*, p.type FROM events e
               JOIN participation p ON e.id = p.event_id
               WHERE p.user_id = ?`;

  db.all(sql, [req.params.userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to retrieve events");
    } else {
      res.json(rows);
    }
  });
});

app.delete("/rsvp", (req, res) => {
  const { user_id, event_id } = req.body; // Assuming you send user_id and event_id in the request body

  const sql = "DELETE FROM participation WHERE user_id = ? AND event_id = ?";
  db.run(sql, [user_id, event_id], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to cancel RSVP");
    } else {
      res.send({
        message: "RSVP cancelled successfully!",
        affectedRows: this.changes,
      });
    }
  });
});

// Get events created by a specific user
app.get("/events/created/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM events WHERE creator_id = ?";
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to retrieve events");
    } else {
      res.json(rows);
    }
  });
});

// DELETE endpoint to delete an event created by a user
app.delete("/event/:eventId", (req, res) => {
  const { eventId } = req.params;
  const userId = req.body.userId; // Assuming you pass the user ID in the body for verification

  // First, check if the requesting user is the creator of the event
  const verifySql = "SELECT creator_id FROM events WHERE id = ?";
  db.get(verifySql, [eventId], (verifyErr, row) => {
    if (verifyErr) {
      console.error(verifyErr.message);
      return res
        .status(500)
        .send("Database error occurred while verifying the event creator.");
    }
    if (row && row.creator_id === userId) {
      // User verified as the creator, proceed to delete
      const sql = "DELETE FROM events WHERE id = ?";
      db.run(sql, [eventId], function (err) {
        if (err) {
          console.error(err.message);
          res.status(500).send("Failed to delete the event");
        } else {
          res.send({
            message: "Event deleted successfully",
            affectedRows: this.changes,
          });
        }
      });
    } else {
      res.status(403).send("You do not have permission to delete this event.");
    }
  });
});

app.post("/join-league", (req, res) => {
  const { user_id, league_id } = req.body;
  const insertParticipationSql = `
    INSERT INTO participation (user_id, event_id, league_id, type)
    SELECT ?, event_id, ?, 'participant'
    FROM league_events
    WHERE league_id = ?;
  `;

  db.run(
    insertParticipationSql,
    [user_id, league_id, league_id],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send("Failed to join league");
      } else {
        res.send({
          message: "Successfully joined the league",
          changes: this.changes,
        });
      }
    }
  );
});

app.get("/leagues/user/:userId", (req, res) => {
  const sql = `
    SELECT l.*, p.type, GROUP_CONCAT(e.eventName) as eventNames
    FROM leagues l
    JOIN participation p ON l.id = p.league_id
    LEFT JOIN league_events le ON l.id = le.league_id
    LEFT JOIN events e ON le.event_id = e.id
    WHERE p.user_id = ?
    GROUP BY l.id
  `;

  db.all(sql, [req.params.userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to retrieve leagues");
    } else {
      res.json(
        rows.map((row) => {
          row.eventNames = row.eventNames ? row.eventNames.split(",") : [];
          return row;
        })
      );
    }
  });
});

// Endpoint to exit a league
app.post("/exit-league", (req, res) => {
  const { user_id, league_id } = req.body;
  db.run(
    `DELETE FROM participation WHERE user_id = ? AND league_id = ?`,
    [user_id, league_id],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send("Failed to exit league");
      } else {
        res.send({
          message: "Successfully exited the league",
          changes: this.changes,
        });
      }
    }
  );
});

app.get("/leagues/created/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM leagues WHERE creator_id = ?";

  db.all(sql, [userId], (err, leagues) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to retrieve created leagues");
    } else {
      res.json(leagues);
    }
  });
});

app.delete("/league/:leagueId", (req, res) => {
  const { leagueId } = req.params;
  const userId = req.body.userId; // This should be securely fetched, e.g., from session or token

  const verifySql = "SELECT creator_id FROM leagues WHERE id = ?";
  db.get(verifySql, [leagueId], (verifyErr, league) => {
    if (verifyErr) {
      console.error(verifyErr.message);
      return res
        .status(500)
        .send("Database error while verifying league creator.");
    }
    if (!league || league.creator_id !== userId) {
      return res
        .status(403)
        .send("You do not have permission to delete this league.");
    }

    const deleteSql = "DELETE FROM leagues WHERE id = ?";
    db.run(deleteSql, [leagueId], function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send("Failed to delete the league");
      } else {
        res.send({
          message: "League deleted successfully",
          changes: this.changes,
        });
      }
    });
  });
});

app.post("/accept-league", (req, res) => {
  const { user_id, league_id } = req.body;
  const sql =
    "UPDATE participation SET type = 'participant' WHERE user_id = ? AND league_id = ?";
  db.run(sql, [user_id, league_id], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to accept league participation");
    } else {
      res.send({ message: "League participation accepted successfully!" });
    }
  });
});

app.post("/reject-league", (req, res) => {
  const { user_id, league_id } = req.body;
  const sql = "DELETE FROM participation WHERE user_id = ? AND league_id = ?";
  db.run(sql, [user_id, league_id], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to reject league participation");
    } else {
      res.send({ message: "League participation rejected successfully!" });
    }
  });
});

app.put("/event/:id", upload.single("image"), (req, res) => {
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
    accessibility,
  } = req.body;
  const eventId = req.params.id;
  const imageUrl = req.file ? `/assets/images/${req.file.filename}` : null;

  // Convert accessibility options to string format for database storage
  const accessibilityString = ["blindness", "wheelchair"]
    .filter((acc) => req.body[acc])
    .join(",");

  const sql = `
      UPDATE events SET
          eventName = ?,
          eventDate = ?,
          eventTime = ?,
          address = ?,
          city = ?,
          state = ?,
          description = ?,
          spots = ?,
          sport = ?,
          imageUrl = COALESCE(?, imageUrl),
          accessibility = ?,
          creator_id = ?
      WHERE id = ?`;

  const params = [
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
    eventId,
  ];

  // Execute SQL to update the event
  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to update event");
    } else {
      res.send({
        message: "Event updated successfully!",
        eventId: eventId,
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/pages/homepage.html`);
});
