const PORT = 8080; // default port 8080
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const {
  generateRandomString,
  uniqueRegister,
  loginHelper,
  urlsForUser,
  checkShort
} = require('./functions_server');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

//login
app.post("/login", (req, res) => {
  
  const existUser = loginHelper(req.body.email, req.body.password, users);
  
  if (existUser.error) {
    return res.send(existUser.error);
  }

  res.cookie("user_id", existUser.id);
  res.redirect("/urls");
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//match short URL and long URL
app.post("/urls", (req, res) => {
  
  let shortRanURL = generateRandomString();

  urlDatabase[shortRanURL] = {longURL: req.body.longURL, userID: req.cookies["user_id"]};

  res.redirect("/urls");
});

//delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  
  let currentUser = users[req.cookies["user_id"]];

  let identityCheck = checkShort(req.cookies["user_id"], urlDatabase);
  
  if (identityCheck.error) {
    res.send(identityCheck.error);
  }

  if (!currentUser) {
    res.redirect("/login");
  }

  delete urlDatabase[req.params.shortURL];
  
  res.redirect("/urls");
});

//edit URL
app.post("/urls/:shortURL", (req, res) => {
  
  let currentUser = users[req.cookies["user_id"]];

  if (!currentUser) {
    res.redirect("/login");
  }
  
  let identityCheck = checkShort(req.cookies["user_id"], urlDatabase);
  
  if (identityCheck.error) {
    res.send(identityCheck.error);
  }


  urlDatabase[req.params.shortURL] = {longURL: req.body.newURL, userID: req.cookies["user_id"]};
  
  res.redirect("/urls");
});


//  ****** GET ****** //


//home page
app.get("/", (req, res) => {
  
  let currentUser = users[req.cookies["user_id"]];

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

//my URLS page
app.get("/urls", (req, res) => {

  let currentUser = users[req.cookies["user_id"]];

  const templateVars = {
    urls:  urlsForUser(req.cookies["user_id"], urlDatabase),
    user : currentUser
  };

  if (!currentUser) {
    res.render("urls_login", templateVars);
  }

  res.render("urls_index", templateVars);
});

//loads register
app.get("/register", (req,res) => {
  
  const templateVars = {
    urls: urlDatabase,
    user : users[req.cookies["user_id"]]
  };

  res.render("urls_registration", templateVars);
});

//loads login
app.get("/login", (req, res) => {
  
  const templateVars = {
    urls: urlDatabase,
    user : users[req.cookies["user_id"]]
  };

  res.render("urls_login",templateVars);
});

//loads TinyURL page
app.get("/urls/new", (req, res) => {
  
  const templateVars = {
    user : users[req.cookies["user_id"]]
  };

  let currentUser = users[req.cookies["user_id"]];

  if (!currentUser) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//loads shortURl to new longURL page
app.get("/urls/:shortURL", (req, res) => {
  
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user : users[req.cookies["user_id"]]
  };
  
  let currentUser = users[req.cookies["user_id"]];
  
  let identityCheck = checkShort(req.cookies["user_id"], urlDatabase);
  
  if (identityCheck.error) {
    res.send(identityCheck.error);
  }

  if (!currentUser) {
    res.send("Error: you are either not logged in or this shortURL belongs to another user");
  }

  res.render("urls_show", templateVars);
});

//if short URL is assigned to valid longURl, redirects to page
//if not, returns error message
app.get("/u/:shortURL", (req, res) => {
  
  const longURL = urlDatabase[req.params.shortURL].longURL;
  
  if (!longURL) {
    return res.send("Error: The page doesn't exist");
  }
  
  res.redirect(longURL);
});

//access to .json page to monitor users / urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// ***** LISTEN ***** //


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
