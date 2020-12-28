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
        const players = await Queue.find({}).sort({points: 'asc'}).limit(6);
        if(!players){ throw {error : "Find Error!"}};

        let calcMatch_1 = 5;
        let calcMatch_2 = 5;
        let pastMatch_1 = [];
        let pastMatch_2 = [];

        const matchCalc = await Match.find({finished: true}).sort({time: 'desc'}).limit(2);
        if(!matchCalc){ throw {error : "Find Error!"}}
       
        else if(matchCalc.length === 2){
            calcMatch_1 = Math.abs(matchCalc[0].result[0] - matchCalc[0].result[1]);
            calcMatch_2 = Math.abs(matchCalc[1].result[0] - matchCalc[1].result[1]);
            pastMatch_1 = matchCalc[0].comp;
            pastMatch_2 = matchCalc[1].comp;
        }
        else if(matchCalc.length === 1){
            calcMatch_1 = Math.abs(matchCalc[0].result[0] - matchCalc[0].result[1]);
            pastMatch_1 = matchCalc[0].comp;
            calcMatch_2 = 0;
            pastMatch_2 = [0,0,0,0,0,0];
        }
        else{
            pastMatch_1 = [0,0,0,0,0,0];
            pastMatch_2 = [0,0,0,0,0,0];
        }

        let objShuffle = [];
        let arrayShuffle = [];
        let resShuffle = [];
        let matchShuffle = [];

        let comp = [];
        let compsDif1 = [
            [0,2,5,1,3,4],
            [0,3,5,1,2,4],
            [0,3,4,1,2,5]
        ];
        let compsDif2 = [
            [0,1,5,2,3,4],
            [0,2,4,1,3,5],
            [1,2,3,0,4,5]
        ]

        // objShuffle -> Matchmaking
        for( i=0 ; i < 6 ; i++ ){
            objShuffle.push({name: players[i].name, main: players[i].main, points: players[i].points});
        }

        async function shuffle(o) {
            for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        }

        async function teamShuffle(){
            let ultMatch = calcMatch_1 + calcMatch_2;

            if(ultMatch > 6){
                shuffle(compsDif1);
                comp = compsDif1[0];
                // dif1
                resShuffle[0]=objShuffle[compsDif1[0][0]];
                resShuffle[1]=objShuffle[compsDif1[0][1]];
                resShuffle[2]=objShuffle[compsDif1[0][2]];
                resShuffle[3]=objShuffle[compsDif1[0][3]];
                resShuffle[4]=objShuffle[compsDif1[0][4]];
                resShuffle[5]=objShuffle[compsDif1[0][5]];
                // arrayShuffle -> Mongodb
                for( i=0 ; i < 6 ; i++ ){
                    arrayShuffle.push(resShuffle[i].name);
                }
                return arrayShuffle;
            }
            else{
                shuffle(compsDif2);
                comp = compsDif2[0];
                // dif2
                resShuffle[0]=objShuffle[compsDif2[0][0]];
                resShuffle[1]=objShuffle[compsDif2[0][1]];
                resShuffle[2]=objShuffle[compsDif2[0][2]];
                resShuffle[3]=objShuffle[compsDif2[0][3]];
                resShuffle[4]=objShuffle[compsDif2[0][4]];
                resShuffle[5]=objShuffle[compsDif2[0][5]];
                // arrayShuffle -> Mongodb
                for( i=0 ; i < 6 ; i++ ){
                    arrayShuffle.push(resShuffle[i].name);
                }
                return arrayShuffle;
            }
        }
        
        var d = 1;
        let noRepeat = false;
        while(noRepeat === false){
            matchShuffle = await teamShuffle();
            d++;
            if(comp !== pastMatch_1 && comp !== pastMatch_2){
                noRepeat = true;
            }
        };

        const newMatch = new Match({
            teams: matchShuffle,
            finished: false,
            reported: "false",
            result: [0, 0],
            preresult: {teama: [0,0], teamb: [0,0]},
            comp: comp
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
        throw {
            mensagem: "Erro Socket Match - Match Update",
            status: "socketmatch_erro"
        }
    }
}



module.exports = { matchInit, matchUpdate }