
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser =require('cookie-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

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

app.post("/login", (req, res) => {
  
existUser = loginHelper(req.body.email,req.body.password, users)

if(existUser.error){
  return res.send(existUser.error)
}

res.cookie("user_id", existUser.id)
res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls")
})

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL
  res.redirect("/urls")
});

app.post("/urls", (req, res) => {
  let shortRanURL = generateRandomString();
  urlDatabase[shortRanURL] = req.body.longURL;
  res.redirect(`/urls/${shortRanURL}`);
});

app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user : users[req.cookies["user_id"]]
  };
  res.render("urls_login",templateVars)
}); 

app.get("/register", (req,res) => {
  const templateVars = {
    urls: urlDatabase,
    user : users[req.cookies["user_id"]]
  };
  res.render("urls_registration", templateVars)
})

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user : users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user : users[req.cookies["user_id"]]
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user : users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    return res.send("Error: The page doesn't exist");
  }
  res.redirect(longURL);
});

const generateRandomString = () => {
  
  let random = [];
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
  for (let i = 0; i < 6; i++) {
    random.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  }
   
  return random.join("");
};


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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(users);
});


// app.get("/", (req, res) => {
//   res.send("Hello!");
// });



// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });