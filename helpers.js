// *** All functions being used by the express server *** //
const bcrypt = require('bcryptjs');

//generates random string for short URL
const generateRandomString = () => {

  let random = [];
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
  for (let i = 0; i < 6; i++) {
    random.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  }

  return random.join("");
};

// insures that a register email doesn't already exist
const uniqueRegister = (email, password, data) => {
  if (!email || !password) {
    return {error: 400};
  }
  for (let user in data) {
    if (data[user].email === email) {
      return {error: "This email already exists!"};
    }
  }
  return {error: null};
};

// checks for existing email and password
const loginHelper = (email, password, data) => {
  
  if (!email || !password) {
    return {error: 403};
  }

  for (let user in data) {
    if (data[user].email === email && bcrypt.compareSync(password, data[user].hashedPassword)) {
      return data[user];
    }
  }
  return {error: 403};
};

//checks for User's urls and returns an object
const urlsForUser = (id, data) => {
  
  const shortobj = {};

  for (let shortURL in data) {
    if (data[shortURL].userID === id) {
      shortobj[shortURL] = data[shortURL];
    }
  }
  return shortobj;
};

//checks that the urls:id belongs to the account
const checkShort  = (id, data) => {
  
  let array = [];

  for (let shortURL in data) {
    if (id === data[shortURL].userID) {
      array.push(shortURL);
    }
  }
  return array;
};

//finds a user by email
const getUserByEmail = function(email, database) {
  
  for (let user in database) {
    if (database[user].email === email) {
      return database[user].id;
    }
  }
  return undefined;
};

module.exports = {
  generateRandomString,
  uniqueRegister,
  loginHelper,
  urlsForUser,
  checkShort,
  getUserByEmail
};