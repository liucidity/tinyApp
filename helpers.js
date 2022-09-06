const findEmail = function (registrationEmail, database) {
  //retuns entire user object if email is found or return null
  for (const user in database) {
    if (registrationEmail === database[user].email) {
      return database[user];
    }
  }
  return null;
};

const urlsForUserID = function (userID, database) {
  let urls = {};
  for (const url in database) {
    if (userID === database[url].userID) {
      urls[url] = database[url].longURL;
    }
  }
  return urls;
};

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

module.exports = { findEmail, urlsForUserID, generateRandomString };