import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 7176;

app.get('/', (req, res) => {
  const { code } = req.query;
  if (code) {
    const axios = require('axios');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('client_id', process.env.TWITCH_CLIENT_ID);
    form.append('client_secret', process.env.TWITCH_CLIENT_SECRET);
    form.append('code', code);
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', 'https://api.azgold.fr/aztro-link/token');

    axios
      .post('https://id.twitch.tv/oauth2/token', form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response: any) => {
        console.log(response.data);
        res.json(response.data);
      })
      .catch((error: any) => {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de l'échange du code pour un jeton" });
      });
  } else {
    res.status(400).json({ error: 'Code manquant' });
  }
});

app.get('/token', (req, res) => {
  console.log('req.query', req.query);
});

app.get('/test', (req, res) => {
  const { code } = req.query;
  console.log;
  // res.redirect(
  //   307,
  //   `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID ?? ''}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=https://api.azgold.fr/aztro-link/token`
  // );
});

app.listen(port, () => {
  console.log('Serveur allumé');
});
