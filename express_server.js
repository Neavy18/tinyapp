const PORT = 8080; // default port 8080
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const {
  generateRandomString,
  uniqueRegister,
  loginHelper,
  urlsForUser,
  checkShort
} = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

app.set("view engine", "ejs");

const urlDatabase = {};
const users = {};


// ***** POST ***** //


//register
app.post("/register", (req, res) => {

  const newUser = uniqueRegister(req.body.email, req.body.password, users);

  if (newUser.error) {
    return res.send(newUser.error);
  }

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const userId = generateRandomString();
 
  users[userId] = {
    id: userId,
    email: req.body.email,
    hashedPassword: hashedPassword
  };

  req.session.user_id = userId;
  res.redirect("/urls");
});

//login
app.post("/login", (req, res) => {
  
  const existUser = loginHelper(req.body.email, req.body.password, users);
  
  if (existUser.error) {
    return res.send(existUser.error);
  }

  req.session.user_id = existUser.id;
  res.redirect("/urls");
});

//logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//match short URL and long URL
app.post("/urls", (req, res) => {
  
  let shortRanURL = generateRandomString();

  urlDatabase[shortRanURL] = {longURL: req.body.longURL, userID: req.session.user_id};

  res.redirect(`/urls/${shortRanURL}`); 
});

//delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  
  let currentUser = users[req.session.user_id];

  let identityCheck = checkShort(req.session.user_id, urlDatabase);
  
  if (identityCheck.error) {
    res.send(identityCheck.error);
  }

  if (!currentUser) {
    return res.send("<html><body><h1>Error: You are not currently logged in!</h1></body></html>");
  }

  delete urlDatabase[req.params.shortURL];
  
  res.redirect("/urls");
});

//edit URL
app.post("/urls/:shortURL", (req, res) => {
  
  const currentUser = users[req.session.user_id];

  if (!currentUser) {
    return res.redirect("/login");
  }

  const identityCheck = checkShort(currentUser.id, urlDatabase);

  if (!identityCheck.includes(req.params.shortURL)) {
    return res.send("<html><body><h3>Error: This URL does not seem connected to your account!</h3></body></html>");
  }
  
  urlDatabase[req.params.shortURL] = {longURL: req.body.newURL, userID: req.session.user_id};
  
  res.redirect("/urls");
});


//  ****** GET ****** //


//home page
app.get("/", (req, res) => {
  
  let currentUser = users[req.session.user_id];

  const templateVars = {
    urls: urlDatabase,
    user : currentUser
  };

  if (!currentUser) {
    res.render("urls_login", templateVars);
  } else {
    res.render("urls_index", templateVars);
  }

});

//loads register
app.get("/register", (req,res) => {
  
  const templateVars = {
    urls: urlDatabase,
    user : users[req.session.user_id]
  };

  res.render("urls_registration", templateVars);
});

//loads login
app.get("/login", (req, res) => {
  
  const templateVars = {
    urls: urlDatabase,
    user : users[req.session.user_id]
  };

  res.render("urls_login",templateVars);
});

//loads URLS page
app.get("/urls", (req, res) => {

  let currentUser = users[req.session.user_id];

  if (!currentUser) {
    return res.send("<html><body><h3>Error: You are not currently logged in!</h3></body></html>");
  }

  const templateVars = {
    urls:  urlsForUser(req.session.user_id, urlDatabase),
    user : currentUser
  };

  res.render("urls_index", templateVars);
});

//loads TinyURL page
app.get("/urls/new", (req, res) => {
  
  const templateVars = {
    user : users[req.session.user_id]
  };

  let currentUser = users[req.session.user_id];

  if (!currentUser) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//loads shortURl to new longURL page
app.get("/urls/:shortURL", (req, res) => {
  
  const currentUser = users[req.session.user_id];

  if (!currentUser) {
    return res.send("<html><body><h1>Error: You are not currently logged in!</h1></body></html>");
  }
  
  const identityCheck = checkShort(currentUser.id, urlDatabase);

  if (!identityCheck.includes(req.params.shortURL)) {
    return res.send("<html><body><h3>Error: This URL does not seem connected to your account!</h3></body></html>");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user : users[req.session.user_id]
  };
  
  res.render("urls_show", templateVars);
});

//if short URL is assigned to valid longURl, redirects to page
//if not, returns error message
app.get("/u/:shortURL", (req, res) => {
    
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("<html><body><h1>Error: The page doesn't exist</h1></body></html>");
  }
  
  const longURL = urlDatabase[req.params.shortURL].longURL;

  res.redirect(longURL);
});


// ***** LISTEN ***** //


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
