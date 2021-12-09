const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser =require('cookie-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {};

const users = {};

//register
app.post("/register", (req, res) => {

  if(!req.body.email || !req.body.password){
    return res.send(400)
  }
  for (let user in users){
    if (users[user].email === req.body.email){
      return res.send(400)
    }
  }
 
  const userId = generateRandomString()
 
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  }
  
  res.cookie("user_id", userId)
  res.redirect("/urls")
})

//login 
app.post("/login", (req, res) => {
  
existUser = loginHelper(req.body.email,req.body.password, users)

if(existUser.error){
  return res.send(existUser.error)
}

res.cookie("user_id", existUser.id)
res.redirect("/urls")
})

//logout 
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls")
})

//match short URL and long URL
app.post("/urls", (req, res) => {
  let shortRanURL = generateRandomString();
  urlDatabase[shortRanURL] = {longURL: req.body.longURL, userID: req.cookies["user_id"]};
  res.redirect("/urls");
});

//delete URL 
app.post("/urls/:shortURL/delete", (req, res) => {
  
  let currentUser = users[req.cookies["user_id"]];
  if(!currentUser){
    res.redirect("/login")
  }

  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
});

//edit URL 
app.post("/urls/:shortURL", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  if(!currentUser){
    res.redirect("/login")
  }
  urlDatabase[req.params.shortURL] = {longURL: req.body.newURL, userID: req.cookies["user_id"]}
  res.redirect("/urls")
});

app.get("/", (req, res) => {
  
  let currentUser = users[req.cookies["user_id"]];

  const templateVars = {
    urls: urlDatabase,
    user : currentUser
  };

  if(!currentUser){
    res.render("urls_login", templateVars)
  } else{res.render("urls_index", templateVars)}

});

//my URLS page
app.get("/urls", (req, res) => {

  let currentUser = users[req.cookies["user_id"]];

  const templateVars = {
    urls:  urlsForUser(req.cookies["user_id"], urlDatabase),
    user : currentUser
  };

  if(!currentUser){
    res.render("urls_login", templateVars)
  }

  res.render("urls_index", templateVars);
});

//loads register
app.get("/register", (req,res) => {
  const templateVars = {
    urls: urlDatabase,
    user : users[req.cookies["user_id"]]
  };
  res.render("urls_registration", templateVars)
})

//loads login
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user : users[req.cookies["user_id"]]
  };
  res.render("urls_login",templateVars)
}); 

//loads TinyURL page
app.get("/urls/new", (req, res) => {
  
  const templateVars = {
    user : users[req.cookies["user_id"]]
  }
  let currentUser = users[req.cookies["user_id"]];

  if(!currentUser){
    res.redirect("/login")
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
  let byeFunction = checkShort(req.cookies["user_id"], urlDatabase)
  
  if(byeFunction.error){
    res.send(byeFunction.error)
  }
  if(!currentUser){
    res.send("Error: you are either not logged in or this shortURL belongs to another user")
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//generates random string for short URL
const generateRandomString = () => {
  
  let random = [];
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
  for (let i = 0; i < 6; i++) {
    random.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  }
  
  return random.join("");
};

// checks for existing email and password
const loginHelper = (email, password, data) => {

  if(!email || !password){
    return {error: 403}
  }

  for(let user in data){
    if(data[user].email === email && data[user].password === password) {
    return data[user]
    } 
  }

  return {error: 403}
}

//checks for User's urls and returns an object
const urlsForUser = (id, data) => {
  const shortobj = {};

  for(let shortURL in data){
    if(data[shortURL].userID === id){
      shortobj[shortURL] = data[shortURL]
    }
  }
  return shortobj
}

//checks that the urls:id belong to the account
const checkShort  = (id, data) => {

  for(let shortURL in data){
    if(data[shortURL].userID !== id) {
      return {error: "This URL doesn't seem connected to your account"}
    }
  }
  return {error: null}
}
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });