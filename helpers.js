const findEmail = function (registrationEmail, database) {
  //retuns entire user object if email is found or return null
  for (const user in database) {
    if (registrationEmail === database[user].email) {
      return database[user];
    }
  }
  return null;
};

module.exports = { findEmail };