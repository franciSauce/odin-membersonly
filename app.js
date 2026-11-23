const { format } = require('date-fns');
const { env } = require('node:process');
const express = require('express');
const expressSession = require('express-session');
const pgSession = require('connect-pg-simple')(expressSession);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const expressLayouts = require('express-ejs-layouts');
const pool = require('./db/pool');
const users = require('./db/queries/usersQueries');

require('dotenv').config();

const { SESSION_SECRET, PORT } = env;

const app = express();

app.set('view engine', 'ejs');

app.use(expressLayouts);
app.set('layout', 'layouts/base');

app.use(expressSession({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
  }),
  secret: SESSION_SECRET,
  resave: false,
  cookie: { maxAge: 2 * 24 * 60 * 60 * 1000 },
  saveUninitialized: true,
}));
app.use(passport.session());

app.use(express.static('public'));

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.locals.format = format;
  res.locals.user = req.user;
  res.locals.errors = req.session.errors || [];
  delete req.session.errors;
  next();
});

