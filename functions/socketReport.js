const mongoose = require('mongoose');

const Match = require('../models/match');

const reportInit = async (userinit) => {
    try {
        const findReport = await Match.findOne({ $and: [ { teams: { $in: [ userinit.name ] } }, { finished: false } ] }).sort({time: 'desc'});
        if(!findReport){
            throw {error: "Erro ao reportar 1"};
        }
        else if(findReport === null){
            throw {error: "Erro ao reportar 2"};
        }
        const reportFId = findReport.id;
        const reportFTeams = findReport.teams;
        const reportFResult = findReport.result;
        const reportFPreresult = findReport.reported;
        return await {}
        
    } catch (error) {
        throw {error};
    }
}

module.exports = { reportInit };