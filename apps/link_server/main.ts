import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 7176;

app.get('/', (req, res) => {
  const { code } = req.query;
  res.redirect(`/aztro-link/test?code=${code}`);
});

app.get('/aztro-link/token', (req, res) => {
  console.log('req.query', req.query);
});

app.get('/aztro-link/test', (req, res) => {
  const { code } = req.query;
  res.redirect(
    307,
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID ?? ''}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=https://api.azgold.fr/aztro-link/token`
  );
});

app.listen(port, () => {
  console.log('Serveur allumé');
});
