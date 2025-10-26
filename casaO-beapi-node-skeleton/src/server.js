import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import { beGet, bePost } from './guesty.js';

const app = express();
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/availability', async (req, res) => {
  try {
    const { checkIn, checkOut, adults, children } = req.query;
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', String(checkIn));
    if (checkOut) params.set('checkOut', String(checkOut));
    if (adults) params.set('adults', String(adults));
    if (children) params.set('children', String(children));
    const r = await beGet(`/search?${params.toString()}`);
    res.status(r.status).json(r.data);
  } catch (e) {
    const status = e.response?.status || 500;
    res.status(status).json({ error: e.message, detail: e.response?.data });
  }
});

app.post('/api/quote', async (req, res) => {
  try {
    const r = await bePost('/reservations/quotes', req.body);
    res.status(r.status).json(r.data);
  } catch (e) {
    const status = e.response?.status || 500;
    res.status(status).json({ error: e.message, detail: e.response?.data });
  }
});

app.post('/api/book', async (req, res) => {
  try {
    // Expect body: { quoteId, guest:{...}, payment:{ method:"guestyPayToken", token:"..." } }
    const r = await bePost('/reservations/instant', req.body);
    res.status(r.status).json(r.data);
  } catch (e) {
    const status = e.response?.status || 500;
    res.status(status).json({ error: e.message, detail: e.response?.data });
  }
});

app.post('/api/inquiry', async (req, res) => {
  try {
    const r = await bePost('/reservations/inquiry', req.body);
    res.status(r.status).json(r.data);
  } catch (e) {
    const status = e.response?.status || 500;
    res.status(status).json({ error: e.message, detail: e.response?.data });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Casa O BE API server listening on http://localhost:${port}`);
});
