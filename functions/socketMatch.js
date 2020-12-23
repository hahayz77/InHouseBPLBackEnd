const mongoose = require('mongoose');

const Match = require('../models/match');
const Queue = require('../models/Queue');


const matchInit = async () => {
    try {
        const match = await Match.find({ finished: false }).sort({time: 'desc'}).limit(10);
        return await match;
    } catch (err) {
        throw {error: err};
    }
}


const matchUpdate = async () => {
    try {
        const players = await Queue.find({}).sort({time: 'asc'}).limit(6);
        if(!players){ throw {error : "Find Error!"}};

        let objShuffle = [];
        let arrayShuffle = [];

        async function shuffle(o) {
            for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        }
        // objShuffle -> Matchmaking
        for( i=0 ; i < 6 ; i++ ){
            objShuffle.push({name: players[i].name, main: players[i].main, points: players[i].points});
        }
        shuffle(objShuffle);

        // array Shuffle -> Mongodb
        for( i=0 ; i < 6 ; i++ ){
            arrayShuffle.push(objShuffle[i].name);
        }

        const newMatch = new Match({
            teams: arrayShuffle,
            finished: false,
            reported: "false",
            result: [0, 0],
            preresult: {teama: [0,0], teamb: [0,0]}
        });

        const saveMatch = await newMatch.save();
        if(!saveMatch){ throw { error: "Error SaveMatch"} };

        const deleteQueue = await Queue.deleteMany({ name: { $in: arrayShuffle } });
        if(!deleteQueue){ throw { error: "Error Delete"} };

        const queueRes = await Queue.find({});
        const matchRes = await Match.find({finished: false}).sort({time: 'desc'}).limit(5);
        const reportRes = await Match.findOne({ $and: [ { teams: { $in: arrayShuffle } }, { finished: false } ] }).sort({time: 'desc'});
        return { queueRes, matchRes, reportRes };

    } catch (error) {
        console.log(error);
        throw { error: "Errorr" };
    }
}



module.exports = { matchInit, matchUpdate }