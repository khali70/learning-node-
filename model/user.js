const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
Schema = mongoose.Schema;
const User = new Schema({
  firstname: {
    type: String,
    default: "",
  },
  lastname: {
    type: String,
    default: "",
  },
  facebookId: String,
  admin: {
    type: Boolean,
    default: false,
  },
});
User.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", User);