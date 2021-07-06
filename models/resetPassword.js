const mongoose = require('../database/mongodb');

const resetPasswordSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    password: {
        type: String
    },
    newpassword: {
        type: String
    },
    code: {
        type: Array,
    },
    time: {
        type: Date,
        default: Date.now
    },
    expire_at: {
        type: Date, 
        default: Date.now, 
        expires: 1800
    }
});

const ResetPassword = mongoose.model("ResetPassword", resetPasswordSchema);
module.exports = ResetPassword;