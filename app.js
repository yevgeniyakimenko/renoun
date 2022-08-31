import express from 'express';
import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import path from 'path';
import url from 'url';
import cookieSession from 'cookie-session';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

import apiRouter from './apiRouter.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
//app.use(express.static("static"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
app.use(cookieSession({
  secret: process.env.SESSIONSECRET,
  maxAge: 1 * 24 * 60 * 60 * 1000,
  sameSite: true,
}));

app.use('/api/v1', apiRouter);

app.get('/', (req, res) => {
  if (req.session && req.session.isUser === true) {
    req.session.timestamp = Date.now();
    res.redirect('/stats');
    return;
  }

  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.get('/game', (req, res) => {
  if (!(req.session.playerId)) {
    req.session.isUser = false;
    req.session.playerId = uuidv4();
    req.session.game = null;
  }

  req.session.timestamp = Date.now();

  res.sendFile(path.join(__dirname, 'static', 'game.html'));
});

app.get('/stats', (req, res) => {
  if (!(req.session.isUser)) {
    req.session.timestamp = Date.now();
    res.redirect('/');
    return;
  }

  res.sendFile(path.join(__dirname, 'static', 'stats.html'));
});

app.get('/vocab', (req, res) => {
  if (!(req.session.isUser)) {
    req.session.timestamp = Date.now();
    res.redirect('/');
    return;
  }

  res.sendFile(path.join(__dirname, 'static', 'vocab.html'));
});

app.use("/", express.static(path.resolve(__dirname, 'static')));

export default app;