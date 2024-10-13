import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const app = express();
const port = 7176;

app.get('/', (req, res) => {
  const { code } = req.query;
  if (code) {
    const form = new FormData();
    form.append('client_id', process.env.TWITCH_CLIENT_ID);
    form.append('client_secret', process.env.TWITCH_CLIENT_SECRET);
    form.append('code', code);
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', 'https://api.azgold.fr/aztro-link');

    axios
      .post('https://id.twitch.tv/oauth2/token', form, {
        headers: {
          ...form.getHeaders(),
        },
      })
      .then((response: any) => {
        console.log('DATA IS : ', response.data);
      })
      .catch((error: any) => {
        console.error('ERROR', error);
        res.status(500).json({ error: "Erreur lors de l'échange du code pour un jeton" });
      });
  } else {
    res.status(400).json({ error: 'Erreur inconnue.' });
  }
});

app.listen(port, () => {
  console.log('Serveur allumé');
});
