const mongoose = require('mongoose');

const Match = require('../models/match');

const reportInit = async (userinit) => {
    try {
        const findReport = await Match.findOne({ $and: [ { teams: { $in: [ userinit.name ] } }, { finished: false } ] }).sort({time: 'desc'});
        if(!findReport){
            console.log(findReport);
            throw {error: "Erro ao reportar 1"};
        }
        else if(findReport === null){
            console.log(findReport)
            throw {error: "Erro ao reportar 2"};
        }
        const reportFId = findReport.id;
        const reportFTeams = findReport.teams;
        const reportFResult = findReport.result;
        const reportFPreresult = findReport.reported;
        return await {}
        
    } catch (error) {
        console.log(error);
        throw {error};
    }
}


// const resultReport = async (report) => { //{ selectTeamA: '4', selectTeamB: '5', selectProblem: 'Player inativo' E selectUser: $USER STORE }
//     // const user = report.selectUser;
//     // const teamA = selectTeamA;
//     // const teamB = selectTeamB;
//     //PAREI AQUI
//     console.log("FIND REPORT -------------------"); console.log(report);
//     // console.log(selectTeamA);
//     // console.log(selectTeamB)
//     return report;
// }

module.exports = { reportInit };