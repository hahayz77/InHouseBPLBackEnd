const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const cors = require('cors');

router.use(bodyParser.json());
router.use(cors());

const Match = require('../models/match');
const User = require('../models/user');
const Problem = require('../models/problem');

router.get("/", async (req, res) => {
    try {
        const matchFindeAll = await Match.find({}).sort({ time: 'desc' }).limit(20);
        res.status(200).send(await matchFindeAll);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post("/problem/", async (req, res) => {
    try {
        const player = req.body.player;
        const report = req.body.report;
        const problem = req.body.problem;
        const emptyResult = [0, 0];

        // VERIFICAR REPORT PROBLEM
        const findProblem = await Problem.findOne({ $and: [ { match_id: report.id }, { problem_result: false } ] });
        // NÃO EXISTE UM PROBLEMA --------------------------->
        if (!findProblem) {

            const newProblem = new Problem({
                player: player,
                second_player: "none",
                match_id: report.id,
                teams: report.teams,
                problem_type: problem,
                problem_result: false
            })

            newProblem.save(async function (err) {
                if (!err) {
                    const updatePreREsult = await Match.updateOne({ $and: [{ teams: { $in: [player] } }, { finished: false }] },
                        {
                            $set: {
                                "preresult.teama": emptyResult,
                                "preresult.teamb": emptyResult
                            }
                        })
                    if (!updatePreREsult) { throw { error: "emptyPreResultError1" } }

                    res.status(201).json({
                        mensagem: "Problema reportado, aguarde outro player!",
                        status: "problem_await"
                    })

                } else {

                    res.status(500).json({ mensagem: "Erro interno do servidor problem001!", erro: err });

                }
            })
        } else {            
            // CONFIRMAÇÃO DO REPORT POR OUTRO PLAYER ->
            if (player !== findProblem.player) {

                const problemUpdate = await Problem.updateMany({ $and: [ { match_id: report.id }, { problem_result: false } ] },
                    {
                        $set: {
                            problem_result: true,
                            second_player: player
                        }
                    })
                if (!problemUpdate) { throw { error: "Error problemUpdate" } }

                const deleteMatch = await Match.deleteMany({ $and: [{ teams: { $in: [player] } }, { finished: false }] }).sort({ time: 'desc' });
                if (!deleteMatch) { throw { error: "Error deleteMatch" } }

                res.status(201).json({
                    mensagem: "Problema reportado com sucesso!",
                    status: "problem_confirmed",
                    mongo: deleteMatch
                })

            } else {
                // MESMO PLAYER REPORTANDO O PROBLEMA ->

                const updatePreREsult = await Match.updateOne({ $and: [{ teams: { $in: [player] } }, { finished: false }] },
                    {
                        $set: {
                            "preresult.teama": emptyResult,
                            "preresult.teamb": emptyResult
                        }
                    })
                if (!updatePreREsult) { throw { error: "emptyPreResultError3" } }


                res.status(200).json({
                    mensagem: "Problema reportado novamente!",
                    status: "problem_again"
                })

            }
        }
    } catch (error) {
        res.send(error)
    }
});

router.get("/report/:name", async (req, res) => {
    try {
        const findReport = await Match.findOne({ $and: [{ teams: { $in: [req.params.name] } }, { finished: false }] }).sort({ time: 'desc' });
        if (!findReport) { throw { error: "nomatch" } };
        res.status(200).json({
            status: "reportmatch",
            mensagem: "Partida para reportar",
            id: findReport.id,
            teams: findReport.teams,
            reported: findReport.reported,
            preresult: findReport.preresult
        })
    } catch (error) {
        res.json({
            status: 'error',
            mensagem: "Sem partidas para Reportar!"
        })
    }
})

router.get("/update/:name", async (req, res) => {
    try {
        const updateMatches = await Match.find({ finished: false }).sort({ time: 'desc' }).limit(5);
        if (!updateMatches) { throw { error: "UpdateMatches Error" } }

        const updateUser = await User.findOne({ name: req.params.name });
        if (!updateUser) { throw { error: "UpdateUser Error" } }

        res.json({
            matches: updateMatches,
            user: updateUser
        })

    } catch (error) {
        res.json({
            error: error,
            mensagem: "GET Update Error!"
        })
    }

})

router.patch('/result', async (req, res) => {
    try {
        var preresultInt = [];
        preresultInt[0] = parseInt(req.body.preresult[0]);
        preresultInt[1] = parseInt(req.body.preresult[1]);

        const findReport = await Match.findOne({ $and: [{ teams: { $in: [req.body.player] } }, { finished: false }] }).sort({ time: 'desc' });
        if (!findReport) { throw { error: "findReport" } };


        // TEAM A REPORT --------------------------->
        if (req.body.team === "A") {
            if (findReport.preresult.teamb[0] === 0 && findReport.preresult.teamb[1] === 0) {
                const updateMatchA = await Match.updateOne({ _id: req.body.id },
                    {
                        $set: {
                            "preresult.teama": preresultInt
                        }
                    })
                if (!updateMatchA) { throw { error: "Update Match A 1" } }

                res.status(200).json({
                    status: "awaitcompare",
                    mensagem: "Reportado com sucesso! Aguarde a confirmação!"
                })
                return;
            }
            else if (findReport.preresult.teamb[0] === preresultInt[0] && findReport.preresult.teamb[1] === preresultInt[1]) {

                const updateMatchA = await Match.updateOne({ _id: req.body.id },
                    {
                        $set: {
                            "preresult.teama": [preresultInt[0], preresultInt[1]],
                            finished: true,
                            result: [preresultInt[0], preresultInt[1]]
                        }
                    })
                if (!updateMatchA) { throw { error: "Update Match A 2" } }
            }
            else {
                const updateMatchA = await Match.updateOne({ _id: req.body.id }, { $set: { "preresult.teamb": [0, 0] } });
                if (!updateMatchA) { throw { error: "Update Match A 3" } }
                res.json({
                    status: "wrongresult",
                    mensagem: "Os resultados não conferem!"
                })
                return;
            }
        }

        // TEAM B REPORT --------------------------->
        if (req.body.team === "B") {
            if (findReport.preresult.teama[0] === 0 && findReport.preresult.teama[1] === 0) {
                const updateMatchB = await Match.updateOne({ _id: req.body.id },
                    {
                        $set: {
                            "preresult.teamb": preresultInt
                        }
                    })
                if (!updateMatchB) { throw { error: "Update Match B 1" } }

                res.status(200).json({
                    status: "awaitcompare",
                    mensagem: "Reportadoo com sucesso! Aguarde a confirmação!"
                })
                return;
            }
            else if (findReport.preresult.teama[0] === preresultInt[0] && findReport.preresult.teama[1] === preresultInt[1]) {
                const updateMatchB = await Match.updateOne({ _id: req.body.id },
                    {
                        $set: {
                            "preresult.teamb": [preresultInt[0], preresultInt[1]],
                            finished: true,
                            result: [preresultInt[0], preresultInt[1]]
                        }
                    })
                if (!updateMatchB) { throw { error: "Update Match B 2" } }
            }
            else {
                const updateMatchB = await Match.updateOne({ _id: req.body.id }, { $set: { "preresult.teama": [0, 0] } });
                if (!updateMatchB) { throw { error: "Update Match B 3" } }
                res.json({
                    status: "wrongresult",
                    mensagem: "Resultados não conferem!"
                })
                return;
            }
        }

        // CALCULAR User Points --------------------------->

        const calcPoints = preresultInt[0] - preresultInt[1];
        var pointsObj = [];
        for (i = 0; i < 6; i++) {
            pointsObj.push(findReport.teamsobj[i].points);
        }

        calcPlayersA = pointsObj[0] + pointsObj[1] + pointsObj[2];
        calcPlayersB = pointsObj[3] + pointsObj[4] + pointsObj[5];

        // PONTOS DO TIMA A MAIOR QUE TIME B ->
        if (calcPlayersA > calcPlayersB) {
            switch (calcPoints) {
                case 5:                     // 5x0
                    pts_a = 1; pts_b = 0; break;
                case 4:                     // 5x1
                    pts_a = 1; pts_b = 0; break;
                case 3:                     // 5x2
                    pts_a = 2; pts_b = 0; break;
                case 2:                     // 5x3
                    pts_a = 2; pts_b = -1; break;
                case 1:                    // 5x4
                    pts_a = 3; pts_b = -1; break;
                case -1:                    // 4x5
                    pts_a = -1; pts_b = 4; break;
                case -2:                    // 3x5
                    pts_a = -1; pts_b = 3; break;
                case -3:                    // 2x5
                    pts_a = 0; pts_b = 3; break;
                case -4:                    // 1x5
                    pts_a = 0; pts_b = 2; break;
                case -5:                    // 0x5
                    pts_a = 0; pts_b = 1; break;
                default:
                    pts_a = 0; pts_b = 0;
            }
        }
        // PONTOS DO TIME B MAIOR QUE O DO TIME A ->
        else if (calcPlayersB > calcPlayersA) {
            switch (calcPoints) {
                case -5:                     // 5x0
                    pts_b = 1; pts_a = 0; break;
                case -4:                     // 5x1
                    pts_b = 1; pts_a = 0; break;
                case -3:                     // 5x2
                    pts_b = 2; pts_a = 0; break;
                case -2:                     // 5x3
                    pts_b = 2; pts_a = -1; break;
                case -1:                    // 5x4
                    pts_b = 3; pts_a = -1; break;
                case 1:                    // 4x5
                    pts_b = -1; pts_a = 4; break;
                case 2:                    // 3x5
                    pts_b = -1; pts_a = 3; break;
                case 3:                    // 2x5
                    pts_b = 0; pts_a = 3; break;
                case 4:                    // 1x5
                    pts_b = 0; pts_a = 2; break;
                case 5:                    // 0x5
                    pts_b = 0; pts_a = 1; break;
                default:
                    pts_b = 0; pts_a = 0;
            }
        }
        // CASO DEFAULT CALCPOINTS ->
        else {
            if (calcPoints >= 0) {
                pts_a = calcPoints;
                pts_b = -calcPoints;
            }
            else {
                pts_a = calcPoints;
                pts_b = -calcPoints;
            }
        }

        // SET USER POINTS --------------------------->
        const lessPoints = 1;
        var teamA = [], teamB = [];
        for (var i = 0; i < 3; i++) {
            teamA.push(findReport.teams[i]);
            teamB.push(findReport.teams[i + 3]);
        }
        // TIME A VENCEU ->        
        if (calcPoints > 0) {
            const setUserPointsA = await User.updateMany({ name: { $in: teamA } }, {
                $inc: {
                    points: pts_a,
                    wins: 1
                }
            })
            // console.log("PTsA= "+pts_a);
            if (!setUserPointsA) { throw { error: "Error Set User Points A" } }
        }
        // TIME A PERDEU ->
        else {
            // PLAYER A1 [0]
            if (pointsObj[0] >= 0) {
                const setUserPointsA1 = await User.updateMany({ name: teamA[0] }, {
                    $inc: {
                        points: pts_a,
                        loses: 1
                    }
                })
                if (!setUserPointsA1) { throw { error: "Error Set User Points A11" } }
            }
            else {
                var pts_a1 = pts_a + lessPoints;
                const setUserPointsA1 = await User.updateMany({ name: teamA[0] }, {
                    $inc: {
                        points: pts_a1,
                        loses: 1
                    }
                })
                if (!setUserPointsA1) { throw { error: "Error Set User Points A12" } }

            }
            // console.log("PTsA1= "+ pts_a + " | " +pts_a1 + " -- " + pointsObj[0]);

            // PLAYER A2 [1]
            if (pointsObj[1] >= 0) {
                const setUserPointsA2 = await User.updateMany({ name: teamA[1] }, {
                    $inc: {
                        points: pts_a,
                        loses: 1
                    }
                })
                if (!setUserPointsA2) { throw { error: "Error Set User Points A21" } }
            }
            else {
                var pts_a2 = pts_a + lessPoints;
                const setUserPointsA2 = await User.updateMany({ name: teamA[1] }, {
                    $inc: {
                        points: pts_a2,
                        loses: 1
                    }
                })
                if (!setUserPointsA2) { throw { error: "Error Set User Points A22" } }

            }
            // console.log("PTsA2= "+pts_a + " | " +pts_a2 + " -- " + pointsObj[1]);

            // PLAYER A3 [2]
            if (pointsObj[2] >= 0) {
                const setUserPointsA3 = await User.updateMany({ name: teamA[2] }, {
                    $inc: {
                        points: pts_a,
                        loses: 1
                    }
                })
                if (!setUserPointsA3) { throw { error: "Error Set User Points A31" } }
            }
            else {
                var pts_a3 = pts_a + lessPoints;
                const setUserPointsA3 = await User.updateMany({ name: teamA[2] }, {
                    $inc: {
                        points: pts_a3,
                        loses: 1
                    }
                })
                if (!setUserPointsA3) { throw { error: "Error Set User Points A32" } }

            }
            // console.log("PTsA3= "+pts_a + " | " +pts_a3 + " -- " + pointsObj[2]);

        }
        // TIME B VENCEU ->
        if (calcPoints < 0) {
            const setUserPointsB = await User.updateMany({ name: { $in: teamB } }, {
                $inc: {
                    points: pts_b,
                    wins: 1
                }
            })
            // console.log("PTsB= "+pts_b);
            if (!setUserPointsB) { throw { error: "Error Set User Points B" } }
        }

        // TIME B PERDEU ->
        else {
            // PLAYER B1 [3]
            if (pointsObj[3] >= 0) {
                const setUserPointsB1 = await User.updateMany({ name: teamB[0] }, {
                    $inc: {
                        points: pts_b,
                        loses: 1
                    }
                })
                if (!setUserPointsB1) { throw { error: "Error Set User Points B11" } }
            }
            else {
                var pts_b1 = pts_b + lessPoints;
                const setUserPointsB1 = await User.updateMany({ name: teamB[0] }, {
                    $inc: {
                        points: pts_b1,
                        loses: 1
                    }
                })
                if (!setUserPointsB1) { throw { error: "Error Set User Points B12" } }

            }
            // console.log("PTsB1= "+pts_b + " | " +pts_b1 + " -- " + pointsObj[3]);

            // PLAYER B2 [4]
            if (pointsObj[4] >= 0) {
                const setUserPointsB2 = await User.updateMany({ name: teamB[1] }, {
                    $inc: {
                        points: pts_b,
                        loses: 1
                    }
                })
                if (!setUserPointsB2) { throw { error: "Error Set User Points B21" } }
            }
            else {
                var pts_b2 = pts_b + lessPoints;
                const setUserPointsB2 = await User.updateMany({ name: teamB[1] }, {
                    $inc: {
                        points: pts_b2,
                        loses: 1
                    }
                })
                if (!setUserPointsB2) { throw { error: "Error Set User Points B22" } }

            }
            // console.log("PTsB2= "+pts_b + " | " +pts_b2 + " -- " + pointsObj[4]);

            // PLAYER B3 [5]
            if (pointsObj[5] >= 0) {
                const setUserPointsB3 = await User.updateMany({ name: teamB[2] }, {
                    $inc: {
                        points: pts_b,
                        loses: 1
                    }
                })
                if (!setUserPointsB3) { throw { error: "Error Set User Points B31" } }
            }
            else {
                var pts_b3 = pts_b + lessPoints;
                const setUserPointsB3 = await User.updateMany({ name: teamB[2] }, {
                    $inc: {
                        points: pts_b3,
                        loses: 1
                    }
                })
                if (!setUserPointsB3) { throw { error: "Error Set User Points B32" } }

            }
            // console.log("PTsB3= "+pts_b + " | " +pts_b3 + " -- " + pointsObj[5]);

        }

        res.json({
            status: "reportok",
            mensagem: "Report Finalizado!"
        })


    } catch (error) {
        res.json({
            error: error
        })
    }
});

router.get("/historic", async (req,res)=>{
    try {
        const getHistoric = await Match.find({ finished: true }).sort({ time: 'desc' }).limit(20);
        if(!getHistoric){throw {error: "Error getHistoric"}};
        res.status(200).json({
            mensagem: "Histórico de Partidas encontrado!",
            historic: getHistoric
        });
    } catch (error) {
        res.status(500).send("Error Historic Route!")
    }
})

router.delete("/delete/all/298dhdko187762hhnnxoay0927", async (req, res) => {
    try {
        const deleteMatches = await Match.deleteMany({});
        res.status(200).send(await deleteMatches);

    } catch (err) {
        res.status(500).send("Erro ao deletar");
    }
})

// router.post("/setpoints", async(req, res)=>{
//   try {
//     const team = req.body.team;
//     const points = req.body.points;
//     const wins = req.body.wins;
//     const loses = req.body.loses;

//     const setUserPoints = await User.updateMany({name: {$in: team}},{
//       $inc: {
//          points: points,
//          wins: wins,
//          loses: loses
//       } 
//     })
//     if(!setUserPoints){throw {error: "User set points"}}

//     res.status(200).json({
//       status: "OK SetUser Points",
//       mensagem: setUserPoints
//     })
//   } catch (error) {
//       res.status(500).json({
//         status: "ERROR SETUSERPOINTS",
//         mensagem: error
//       })
//   }
// })

module.exports = router;