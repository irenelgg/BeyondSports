To run: node server.js
http://localhost:3000/pages/selectedsport.html

1. **Events Table**

   - **Purpose**: This table stores information about individual events.
   - **Fields**:
     - `id`: Unique identifier for each event.
     - `eventName`: Name of the event.
     - `eventDate`: Date when the event occurs.
     - `eventTime`: Time when the event occurs.
     - `address`, `city`, `state`: Location details of the event.
     - `description`: A brief description of what the event entails.
     - `spots`: Number of available spots or participants for the event.
     - `sport`: Type of sport (if applicable).
     - `imageUrl`: URL to an image representing the event.
     - `accessibility`: Details about accessibility options available at the event.
     - `creator_id`: Identifier linking to the user who created the event.

2. **Leagues Table**

   - **Purpose**: This table stores information about leagues, which can consist of multiple related events.
   - **Fields**:
     - `id`: Unique identifier for each league.
     - `leagueName`: Name of the league.
     - `prize`: Description of the prize for winning the league.
     - `eventDates`: Dates on which league events occur.
     - `spots`: Number of available spots or teams in the league.
     - `organizer`: The organizer of the league.
     - `rules`: Specific rules or regulations for the league.
     - `imageUrl`: URL to an image representing the league.
     - `creator_id`: Identifier for the user who created the league.

3. **Users Table**

   - **Purpose**: Stores information about users who participate in or organize events and leagues.
   - **Fields**:
     - `id`: Unique identifier for each user.
     - `name`: User’s name.
     - `accessibility`: Information about any accessibility needs the user might have.

4. **League Events Relationship Table**

   - **Purpose**: Manages the relationship between leagues and events, allowing for the association of multiple events with a single league.
   - **Fields**:
     - `league_id`: Identifier for the league.
     - `event_id`: Identifier for the event.
     - These fields are foreign keys that reference the primary keys in the leagues and events tables, respectively.

5. **Participation Table**

   - **Purpose**: Tracks which users participate in which events and leagues, and specifies whether they are participants or creators.
   - **Fields**:
     - `user_id`: Identifier for the user.
     - `league_id`: Identifier for the league.
     - `event_id`: Identifier for the event.
     - `type`: Specifies the role of the user (e.g., 'creator', 'participant').
     - This table uses foreign keys to link to the users, leagues, and events tables.

6. **Invites Table**
   - **Purpose**: Manages invitations sent to users to join leagues.
   - **Fields**:
     - `invite_id`: Unique identifier for each invitation.
     - `user_id`: Identifier of the user who received the invitation.
     - `league_id`: Identifier of the league to which the user is invited.
     - `status`: Current status of the invitation (e.g., 'pending', 'accepted', 'declined').
     - This table also uses foreign keys to link to the users and leagues tables.

Each of these tables is interconnected through various foreign keys that establish relationships between different entities (users, events, leagues). This structure supports complex queries and operations, such as finding all events created by a particular user, listing all participants of an event, or managing league memberships and event scheduling.

PAGES:
homepage: http://localhost:3000/pages/homepage.html
create event page: http://localhost:3000/pages/create_modify_event.html
create league page: http://localhost:3000/pages/create_modify_league.html
my events page: http://localhost:3000/pages/myEvents.html?user=1
my leagues page: http://localhost:3000/pages/myLeagues.html
