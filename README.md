# BeyondSports

**BeyondSports** is an inclusive platform that connects individuals with accessible sports events and leagues in their local area. Designed to promote inclusivity and accessibility, our application empowers users to organize and participate in events while addressing the unique needs of individuals with disabilities.

---

## 🌟 Features

- **Discover Events**: Browse upcoming sports events tailored to your interests.
- **Create Events**: Organize events and specify accessibility options to ensure inclusivity.
- **Join Leagues**: Participate in or organize leagues that connect individuals with shared sports interests.
- **Manage Invitations**: Send and track invites for users to join events or leagues.
- **Accessibility Focus**: Provide details about accessibility options for events and allow users to specify their needs.

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/irenelgg/BeyondSports.git
2. Navigate to the project directory:
   ```bash
   cd BeyondSports
3. Start the server:
    ```bash
    node server.js
4. Open your browser and visit: http://localhost:3000/pages/homepage.html

---

## 📊 Database Structure

Our platform uses a well-defined relational database structure to manage users, events, leagues, and participation data.

### Events Table

**Purpose**: Stores information about individual events.

- `id`: Unique identifier for each event.
- `eventName`: Name of the event.
- `eventDate`: Date when the event occurs.
- `eventTime`: Time when the event occurs.
- `address`, `city`, `state`: Location details of the event.
- `description`: A brief description of the event.
- `spots`: Number of available spots or participants for the event.
- `sport`: Type of sport.
- `imageUrl`: URL to an image representing the event.
- `accessibility`: Details about accessibility options available at the event.
- `creator_id`: Identifier for the user who created the event.

### Leagues Table

**Purpose**: Manages information about leagues, which consist of multiple related events.

- `id`: Unique identifier for each league.
- `leagueName`: Name of the league.
- `prize`: Description of the prize for the league.
- `eventDates`: Dates on which league events occur.
- `spots`: Number of available spots or teams.
- `organizer`: The organizer of the league.
- `rules`: Rules for the league.
- `imageUrl`: URL to an image representing the league.
- `creator_id`: Identifier for the league creator.

### Users Table

**Purpose**: Tracks user information.

- `id`: Unique identifier for each user.
- `name`: User’s name.
- `accessibility`: Details about accessibility needs (if any).

### Participation Table

**Purpose**: Tracks user participation in events and leagues.

- `user_id`: Identifier for the user.
- `league_id`: Identifier for the league.
- `event_id`: Identifier for the event.
- `type`: Specifies the role of the user (`'creator'` or `'participant'`).

### Invites Table

**Purpose**: Tracks invitations sent to users to join leagues.

- `invite_id`: Unique identifier for each invite.
- `user_id`: User who received the invite.
- `league_id`: League associated with the invite.
- `status`: Status of the invite (`'pending'`, `'accepted'`, or `'declined'`).

---

## 🌐 Pages

- **[Homepage](http://localhost:3000/pages/homepage.html)**  
  Browse available sports events and leagues.

- **[Create Event Page](http://localhost:3000/pages/create_modify_event.html)**  
  Organize new events and specify accessibility options.

- **[Create League Page](http://localhost:3000/pages/create_modify_league.html)**  
  Start a new league and manage its details.

- **[My Events Page](http://localhost:3000/pages/myEvents.html?user=1)**  
  View events you’ve created or joined.

- **[My Leagues Page](http://localhost:3000/pages/myLeagues.html)**  
  Manage leagues you’re part of.

---

## 🎨 Figma Design

Our application design is available on Figma. View the detailed wireframes and user flow:  
**[Figma Design Link](https://www.figma.com/design/4k7iToQyi9z1vCdx7Kwp4C/App-Lofi?node-id=0-1&node-type=canvas)**

---

## 👩‍💻 Developers' Note
BeyondSports was designed to empower communities by promoting accessible and inclusive sports opportunities. 
If you have any feedback or questions, feel free to reach out or open an issue in the repository.
