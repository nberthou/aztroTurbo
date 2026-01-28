import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import { mergeDiscordAndTwitchUser } from '@repo/db/user/discord';

dotenv.config();

const requiredEnvVars = ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'TWITCH_REDIRECT_URI'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variable d'environnement ${envVar} manquante`);
  }
}

const app = express();
const port = 7176;

function isValidOAuthCode(code: unknown): code is string {
  return typeof code === 'string' && code.length > 10 && code.length < 100;
}

function isValidDiscordId(state: unknown): state is string {
  return typeof state === 'string' && /^\d{17,19}$/.test(state);
}

app.get('/', async (req, res) => {
  const { code, state } = req.query;

  if (!isValidOAuthCode(code)) {
    return res.status(400).json({ error: 'Code OAuth invalide ou manquant.' });
  }

  if (!isValidDiscordId(state)) {
    return res.status(400).json({ error: 'State invalide (Discord ID attendu).' });
  }

  try {
    const form = new FormData();
    form.append('client_id', process.env.TWITCH_CLIENT_ID);
    form.append('client_secret', process.env.TWITCH_CLIENT_SECRET);
    form.append('code', code);
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', process.env.TWITCH_REDIRECT_URI);

    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', form, {
      headers: form.getHeaders(),
    });

    const token = tokenResponse.data?.access_token;
    if (!token) {
      return res.status(500).json({ error: 'Token non reçu de Twitch.' });
    }

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    const twitchId = userResponse.data?.data?.[0]?.id;
    if (!twitchId) {
      return res.status(500).json({ error: "Impossible de récupérer l'ID Twitch." });
    }

    await mergeDiscordAndTwitchUser(state, twitchId);
    res.status(200).send('Vous pouvez fermer cette fenêtre désormais !');
  } catch (error) {
    console.error('Erreur OAuth:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Erreur lors du processus de liaison.' });
  }
});

app.listen(port, () => {
  console.log('Serveur allumé');
});
