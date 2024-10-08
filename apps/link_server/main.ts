import express from 'express';

const app = express();
const port = 7176;

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.listen(port, () => {
  console.log('Serveur allumé');
});
