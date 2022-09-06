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

const findEmail = function (registrationEmail) {
  //retuns entire user object if email is found or return null
  for (const user in users) {
    if (registrationEmail === users[user].email) {
      return users[user];
    }
  }
  return null;
};

const urlsForUserID = function (userID) {
  let urls = {};
  for (const url in urlDatabase) {
    if (userID === urlDatabase[url].userID) {
      urls[url] = urlDatabase[url].longURL;
    }
  }
  return urls;
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "1234",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "4321",
  },
};

// ------------------------------------------------- SETUP MIDDLEWARE
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ------------------------------------------------- ROUTING

// ------------------------- READS

// REGISTRATION / LOGIN
app.get('/register', (req, res) => {
  if (req.cookies['userID']) {
    res.redirect('/urls');
  }

  const templateVars = { user: users[req.cookies['userID']] };
  res.render('account_registration', templateVars);
});

app.get('/login', (req, res) => {
  if (req.cookies['userID']) {
    res.redirect('/urls');
  }

  const templateVars = { user: users[req.cookies['userID']] };
  res.render('account_login', templateVars);
});

// CREATE NEW URL
app.get('/urls/new', (req, res) => {
  if (!req.cookies['userID']) {
    res.redirect('/login');
  }

  const templateVars = { user: users[req.cookies['userID']] };
  res.render('urls_new', templateVars);
});

// ALL CREATED URLS
app.get('/urls', (req, res) => {
  if (!req.cookies['userID']) {
    const templateVars = { urls: urlDatabase, user: users[req.cookies['userID']] };
    res.render('urls_index', templateVars);
  } else {
    const templateVars = { urls: urlsForUserID(req.cookies['userID']), user: users[req.cookies['userID']] };
    console.log(urlsForUserID(req.cookies['userID']));
    res.render('urls_index', templateVars);
  }
});

// INDIVIDUAL URL / EDITING
app.get('/urls/:id', (req, res) => {
  console.log(req.params.id);

  // TODO: if random urls/id is entered it cannot read database
  if (!(Object.keys(urlDatabase).includes(req.params.id))) {
    res.status(400).send('This URL has not been created yet');
  } else {
    if (req.cookies['userID'] !== urlDatabase[`${req.params.id}`].userID) {
      // TODO: change page to not send HTML only
      res.status(400).send("You do not own this URL.");

    }


  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], urls: urlDatabase, user: users[req.cookies['userID']] }; //wtvr id in our /:id route is passed into our object through req.params.key (key being id due to :id)
  res.render('urls_show', templateVars);
});

// REDIRECTION TO LONGURL
app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(400).send("shortened URL does not exist");
  }


  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// ------------------------- WRITES

// REGISTRATION / LOGIN
app.post('/register', (req, res) => {
  let userID = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  //check if email or password field is empty
  if (!email || !password) {
    res.status(400).send('Please enter both email and password');
  }

  if (findEmail(email)) {
    res.status(400).send('user Email already registered');
  }

  users[userID] = { id: userID, email: email, password: password };
  res.cookie('userID', userID);
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  if (findEmail(req.body.email)) {
    if (req.body.password === findEmail(req.body.email).password) {

      res.cookie('userID', findEmail(req.body.email).id);
      res.redirect('/urls');
    } else {
      res.status(400).send("email or password is not correct");
    }
    res.status(400).send("email or password is not correct");
  }
  res.status(400).send("email or password is not correct");
});

app.post('/logout', (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});

// UPDATE URL ENTRY
app.post('/urls/:id', (req, res) => {

  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    res.status(400).send("This URL does not exist");
  }

  if (req.cookies['userID'] !== urlDatabase[req.params.id].userID) {
    res.status(400).send("You do not have access to this URL");
  } else {

    urlDatabase[req.params.id].longURL = req.body.updateLongURL;
    res.redirect('/urls');
  }

});

// DELETE URL ENTRY
app.post('/urls/:id/delete', (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    res.status(400).send("This URL does not exist");
  }

  if (req.cookies['userID'] !== urlDatabase[`${req.params.id}`].userID) {
    res.status(400).send("You do not have permission to delete this URL");
  } else {

    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }

});


// CREATES NEW URL
app.post('/urls', (req, res) => {

  if (!req.cookies['userID']) {
    res.status(400).send("Please Login or register to create TinyURL");
  } else {

    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies['userID'] };
    res.redirect(`/urls`);

  }


});




// ------------------------------------------------- PORT LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
