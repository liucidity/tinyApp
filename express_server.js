const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

// ------------------------------------------------- GLOBALS
const generateRandomString = function () {
  let generatedShort = '';
  const stringLength = 6;
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;

  for (let i = 0; i < stringLength; i++) {
    generatedShort += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return generatedShort;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "1234",
  },
  user2RandomID: {
    id: "uder2RandomID",
    email: "b@b.com",
    password: "4321",
  },
};

// ------------------------------------------------- SETUP MIDDLEWARE
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ------------------------------------------------- ROUTING

// READS
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/register', (req, res) => {
  res.render('account_registration');
});

app.get('/urls/new', (req, res) => {
  const templateVars = { username: req.cookies["username"], user: users[req.cookies['userID']] };
  res.render('urls_new', templateVars);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"], user: users[req.cookies['userID']] };
  res.render('urls_index', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"], user: users[req.cookies['userID']] }; //wtvr id in our /:id route is passed into our object through req.params.key (key being id due to :id)
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// WRITES
app.post('/register', (req, res) => {
  let userID = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  users[userID] = { id: userID, email: email, password: password };
  res.cookie('userID', userID);
  res.redirect('/urls');
});
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);

});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.updateLongURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  res.cookie('userID', req.body.userID);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});

// ------------------------------------------------- PORT LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
