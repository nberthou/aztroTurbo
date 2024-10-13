import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import { mergeDiscordAndTwitchUser } from '@repo/db/user/discord';

dotenv.config();

const app = express();
const port = 7176;

app.get('/', (req, res) => {
  const { code, state } = req.query;
  console.log('state', state);
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
        const {
          data: { access_token: token },
        } = response;

        if (token) {
          axios
            .get('https://api.twitch.tv/helix/users', {
              headers: {
                Authorization: `Bearer ${token}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID,
              },
            })
            .then(async (response: any) => {
              const {
                data: { id: twitchId },
              } = response;
              if (twitchId) {
                await mergeDiscordAndTwitchUser('', twitchId);
              }
              res.status(200).send('Vous pouvez fermer cette fenêtre désormais !');
            })
            .catch((error: any) => {
              console.error("Erreur lors de la récupération de l'utilisateur:", error);
              res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur." });
            });
        }
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
