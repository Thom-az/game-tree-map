import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

const clientID = 'g77omrqtuzvrwkzrni5d2exxjozkbr';
const clientSecret = '2y08a2xu1t0ag0dgfkud5uql10d5t8';

let accessToken = '';

const getAccessToken = async () => {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    })
  });
  const data = await response.json();
  accessToken = data.access_token;
};

app.use(async (req, res, next) => {
  if (!accessToken) {
    await getAccessToken();
  }
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/api/multiquery', async (req, res) => {
  try {
    const multiQueryBody = `
      query games "Games & Platforms" {
        fields name, platforms.name, platforms.id;
        where platforms !=n;
        limit 500;
      };
    `;

    const response = await fetch("https://api.igdb.com/v4/multiquery", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': clientID,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: multiQueryBody
    });

    const data = await response.json();

    const games = data.find(query => query.name === 'Games & Platforms').result;

    const platformCount = {};

    games.forEach(game => {
      if (game.platforms) {
        game.platforms.forEach(platform => {
          platformCount[platform.name] = (platformCount[platform.name] || 0) + 1;
        });
      }
    });

    const result = Object.keys(platformCount).map(name => ({
      name: name,
      count: platformCount[name]
    }));

    res.json(result);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
