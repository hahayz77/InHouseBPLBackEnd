const mongoose = require('../database/mongodb');

const matchScheema = new mongoose.Schema({
    teams: {
        type: Array,
        require: true
    },
    teamsobj: {
        type: Array
    },
    finished: {
        type: Boolean,
        require: true
    },
    reported: {
        type: String,
    },
    result: {
        type: Array,
    },
    preresult: {
        type: Object
    },
    comp:{
        type: Array
    },
    time: {
        type: Date,
        default: Date.now,
        required: true,
    },
    expire_at: {
        type: Date, 
        default: Date.now, 
        expires: 259200
    }
})


const Match = mongoose.model("Match", matchScheema);
module.exports = Match;