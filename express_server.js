const { findEmail, urlsForUserID, generateRandomString } = require('./helpers');
const { urlDatabase, users } = require('./data');
const express = require('express');
const methodOverride = require('method-override');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

// ------------------------------------------------- SETUP MIDDLEWARE
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'userID',
  keys: ['key1'],
}));
app.use(methodOverride('_method'));


// ------------------------------------------------- ROUTING

// ------------------------- GETS

// REGISTRATION / LOGIN
app.get('/register', (req, res) => {
  if (req.session['userID']) {
    res.redirect('/urls');
  }

  const templateVars = { user: users[req.session['userID']] };
  res.render('account_registration', templateVars);
});

app.get('/login', (req, res) => {
  if (req.session['userID']) {
    res.redirect('/urls');
  }

  const templateVars = { user: users[req.session['userID']] };
  res.render('account_login', templateVars);
});

// CREATE NEW URL PAGE
app.get('/urls/new', (req, res) => {
  if (!req.session['userID']) {
    res.redirect('/login');
  }

  const templateVars = { user: users[req.session['userID']] };
  res.render('urls_new', templateVars);
});

// INDIVIDUAL URLPAGE / EDITINGPAGE
app.get('/urls/:id', (req, res) => {
  if (!(Object.keys(urlDatabase).includes(req.params.id))) {
    res.status(400).send('This URL has not been created yet');
  } else if (!req.session['userID']) {
    res.status(400).send("Please Login to access URL");
  } else {
    if (req.session['userID'] !== urlDatabase[`${req.params.id}`].userID) {
      res.status(400).send("You do not own this URL.");
    }
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    urls: urlDatabase,
    user: users[req.session['userID']]
  };
  res.render('urls_show', templateVars);
});

// REDIRECTION TO LONGURL
app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(400).send("shortened URL does not exist");
  }

  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// ALL CREATED URLS
app.get('/urls', (req, res) => {
  if (!req.session['userID']) {
    const templateVars = {
      urls: urlDatabase,
      user: users[req.session['userID']]
    };
    res.render('urls_index', templateVars);
  } else {
    const templateVars = { urls: urlsForUserID(req.session['userID'], urlDatabase), user: users[req.session['userID']] };
    console.log(urlsForUserID(req.session['userID'], urlDatabase));
    res.render('urls_index', templateVars);
  }
});

// REDIRECT TO MAIN /URLS PAGE
app.get('/*', (req, res) => {
  res.redirect('/urls');
});
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// ------------------------- WRITES

// REGISTRATION / LOGIN
app.post('/register', (req, res) => {
  let userID = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  //check if email or password field is empty
  if (!email || !password) {
    res.status(400).send('Please enter both email and password');
  }
  if (findEmail(email, users)) {
    res.status(400).send('user Email already registered');
  } else {
    users[userID] = {
      id: userID,
      email: email,
      password: hashedPassword
    };
    req.session.userID = userID;
    res.redirect('/urls');

  }

});

app.post('/login', (req, res) => {
  if (findEmail(req.body.email, users)) {
    if (bcrypt.compareSync(req.body.password, findEmail(req.body.email, users).password)) {

      req.session.userID = findEmail(req.body.email, users).id;
      res.redirect('/urls');
    } else {
      res.status(400).send("email or password is not correct");
    }
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});

// UPDATE URL ENTRY
app.put('/urls/:id', (req, res) => {
  console.log(Object.keys(urlDatabase).includes(req.params.id));

  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    res.status(400).send("This URL does not exist");
  }

  if (req.session['userID'] !== urlDatabase[req.params.id].userID) {
    res.status(400).send("You do not have access to this URL");
  } else {
    urlDatabase[req.params.id].longURL = req.body.updateLongURL;
    res.redirect('/urls');
  }

});

// DELETE URL ENTRY
app.delete('/urls/:id', (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    res.status(400).send("This URL does not exist");
  }

  if (req.session['userID'] !== urlDatabase[`${req.params.id}`].userID) {
    res.status(400).send("You do not have permission to delete this URL");
  } else {

    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }

});


// CREATES NEW URL
app.post('/urls', (req, res) => {

  if (!req.session['userID']) {
    res.status(400).send("Please Login or register to create TinyURL");
  } else {

    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session['userID'],
    };
    res.redirect(`/urls/${shortURL}`);

  }

});

// ------------------------------------------------- PORT LISTEN
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
