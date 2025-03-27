const express = require('express');
const cors = require('cors');
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(cors());

app.get('/configs/:id', async (req, res) => {
  const response = await fetch("https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec")
  const { data } = await response.json()
  const config = data.find(d => d.drone_id === parseInt(req.params.id))
  res.status(200).json({
    drone_id: config.drone_id,
    drone_name: config.drone_name,
    light: config.light,
    country: config.country,
    weight: config.weight,
  });
});

app.get('/status/:id', async (req, res) => {
  const response = await fetch("https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec")
  const { data } = await response.json()
  res.status(200).json({ condition: data.find(d => d.drone_id === req.params.id).condition });
});

app.get('/logs/:droneId', async (req, res) => {
  const url = `https://app-tracking.pockethost.io/api/collections/drone_logs/records?filter=(drone_id='${req.params.droneId}')&sort=-created&perPage=25`;
  const response = await fetch(url)
  const { items } = await response.json()
  res.status(200).json(
    items.map(i => ({
      drone_id: i.drone_id,
      drone_name: i.drone_name,
      created: i.created,
      country: i.country,
      celsius: i.celsius,
    }))
  );
});

app.post('/logs', async (req, res) => {
  const response = await fetch("https://app-tracking.pockethost.io/api/collections/drone_logs/records", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', "Authorization": "Bearer 20250301efx" },
    body: JSON.stringify(req.body),
  });
  const result = await response.json();
  res.status(201).json(result);
});

app.listen(3000);