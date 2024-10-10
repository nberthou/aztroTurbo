import express from 'express';

const app = express();
const port = 7176;

app.get('/aztro-link', (req, res) => {
  console.log('params', req.params);
  res.send('Hello world !');
});

app.listen(port, () => {
  console.log('Serveur allumé');
});
