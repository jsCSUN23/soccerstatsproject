const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 3000;

// Create MySQL connection

app.listen(
  port, 
  () => console.log(`works on port: http://localhost${port}`)
)
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  database: `Soccer Player Props`
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

// Handle form submission
app.post('/add-player', (req, res) => {
  let nationalID = '';
  let teamID = 0;
  const { Name, Team, Goals, Assists, Position, NationalTeamID } = req.body;

  //Create a SQL query to insert player data into the database
  const sql = `
    INSERT INTO Player (Name, TeamID, Goals, Assists, Position, NationalTeamID)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  let listOfNationalTeams = 'SELECT NationalTeamID, Name FROM NationalTeam;';
  db.query(listOfNationalTeams, (err, nationalTeamResults) => {
    if (err) {
      console.error('Can\'t get list of national teams:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Find the national ID based on the provided country
    for (let i = 0; i < nationalTeamResults.length; i++) {
      if (nationalTeamResults[i].Name === NationalTeamID) {
        nationalID = nationalTeamResults[i].NationalTeamID;
        break; // Exit the loop once the national ID is found
      }
    }
    let listOfTeams = 'SELECT TeamID, Name FROM Team;';
    db.query(listOfTeams, (err, teamResults) => {
      if (err) {
        console.error('Can\'t get list of teams:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Find the team ID based on the provided team name
      for (let i = 0; i < teamResults.length; i++) {
        if (teamResults[i].Name === Team) {
          teamID = teamResults[i].TeamID;
          break; // Exit the loop once the team ID is found
        }
      }
      db.query(sql, [Name, teamID, Goals, Assists, Position, nationalID], (err, result) => {
        if (err) {
          console.error('Error inserting player:', err);
          res.status(500).send('Error inserting player');
          return;
        }
    
        console.log('Player inserted successfully');
        res.status(200).send('Player inserted successfully');
      });
    });
  });
});

// Endpoint to search for players
app.get('/search-players', (req, res) => {
  // Extract query parameters from the request
  let nationalID = 0;
  let teamID = 0;
  const { country, team, position, sortBy } = req.query;

  // Construct the SQL query to fetch the list of national teams
  let listOfNationalTeams = 'SELECT NationalTeamID, Name FROM NationalTeam;';
  db.query(listOfNationalTeams, (err, nationalTeamResults) => {
    if (err) {
      console.error('Can\'t get list of national teams:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Find the national ID based on the provided country
    for (let i = 0; i < nationalTeamResults.length; i++) {
      if (nationalTeamResults[i].Name === country) {
        nationalID = nationalTeamResults[i].NationalTeamID;
        break; // Exit the loop once the national ID is found
      }
    }

    // Construct the SQL query to fetch the list of teams
    let listOfTeams = 'SELECT TeamID, Name FROM Team;';
    db.query(listOfTeams, (err, teamResults) => {
      if (err) {
        console.error('Can\'t get list of teams:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Find the team ID based on the provided team name
      for (let i = 0; i < teamResults.length; i++) {
        if (teamResults[i].Name === team) {
          teamID = teamResults[i].TeamID;
          console.log(team +" " + teamResults[i].TeamID)
          break; // Exit the loop once the team ID is found
        }
      }

      // Construct the SQL query to search for players
      let query = 'SELECT Player.Name, Player.Goals, Player.Assists, Player.Position, Team.Name AS \'Team Name\',';
      query += ' NationalTeam.Name AS \'National Team\' ';
      query += 'FROM Player INNER JOIN Team ON Player.TeamID = Team.TeamID ';
      query += 'INNER JOIN NationalTeam ON Player.NationalTeamID = NationalTeam.NationalTeamID WHERE 1 '

      // Add filters based on provided query parameters
      if (country != undefined && country != 'All Countries') {
        query += ` AND Player.NationalTeamID = ${nationalID}`;
      }
      if (team != undefined && team != 'All Teams') {
        query += ` AND Player.TeamID = ${teamID}`;
      }
      if (position != undefined && position != 'All Positions') {
        query += ` AND Position = '${position}'`;
      }

      // Add sorting based on the provided sortBy parameter
      if (sortBy === 'goals') {
        query += ' ORDER BY Goals DESC';
      } else if (sortBy === 'assists') {
        query += ' ORDER BY Assists DESC';
      }

      // Execute the SQL query to search for players
      console.log(query);
      db.query(query, (err, playerResults) => {
        if (err) {
          console.error('Error searching for players:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(playerResults);
      });
    });
  });
});
