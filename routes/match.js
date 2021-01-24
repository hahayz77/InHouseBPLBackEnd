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

router.post("/problem/", async (req,res) => {
  try {
    const player = req.body.player;
    const report = req.body.report;
    const problem = req.body.problem;
    const players = [];
    const emptyResult = [0,0];

    const findProblem = await Problem.findOne({ match_id: report.id });
    if(!findProblem){
      players.push(player);

      const newProblem = new Problem({
        players: players,
        match_id: report.id,
        teams: report.teams,
        problem_type: problem,
        problem_result: false
      })

      newProblem.save(async function(err){
        if (!err){
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
          
          res.status(500).json({ mensagem: "Erro interno do servidor problem001!", erro: err});

        }
      })

    } else{
      
        if(findProblem.problem_result === true){
          const updatePreREsult = await Match.updateOne({ $and: [{ teams: { $in: [player] } }, { finished: false }] },
            {
              $set: {
                "preresult.teama": emptyResult,
                "preresult.teamb": emptyResult
              }
            })
          if (!updatePreREsult) { throw { error: "emptyPreResultError2" } }

          res.status(201).json({
            mensagem: "Problema já havia sido reportado!",
            status: "problem_areadyreported"
          })
          return;
        }

        if(player !== findProblem.players[0]){
          
          let final_players = findProblem.players;
          final_players.push(player);

          const problemUpdate = await Problem.updateOne({ match_id: report.id },
            {
              $set: {
                problem_result: true,
                players: final_players
              }
            })
            if(!problemUpdate){throw {error: "Error problemUpdate"}}

            const deleteMatch = await Match.deleteOne({ $and: [{ teams: { $in: [player] } }, { finished: false }] }).sort({ time: 'desc' });
            if(!deleteMatch){throw {error: "Error deleteMatch"}}

            res.status(201).json({
              mensagem: "Problema reportado com sucesso!",
              status: "problem_confirmed",
              mongo: deleteMatch
            })
          
        } else {

          const problemUpdate = await Problem.updateOne({ $and: [{ teams: { $in: [player] } }, { finished: false }] },
            {
              $set: {
                problem_type: problem
              }
            })
            if(!problemUpdate){throw {error: "Error problemUpdate same player"}}

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
    if (!findReport) { throw {error: "nomatch"} };
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
    const updateMatches = await Match.find({finished: false}).sort({ time: 'desc' }).limit(5);
    if(!updateMatches){throw {error: "UpdateMatches Error"}}
  
    const updateUser = await User.findOne({name: req.params.name});
    if(!updateUser){throw {error: "UpdateUser Error"}}

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
          if(!updateMatchB){throw {error: "Update Match B 2"}}
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
    for( i=0 ; i < 6 ; i++ ){
      pointsObj.push(findReport.teamsobj[i].points);
    }

    calcPlayersA = pointsObj[0] + pointsObj[1] + pointsObj[2];
    calcPlayersB = pointsObj[3] + pointsObj[4] + pointsObj[5]; 


    if(calcPlayersA > calcPlayersB){
        switch (calcPoints) {
            case 5:                     // 5x0
                pts_a = 6; pts_b = -6;           break;
            case 4:                     // 5x1
                pts_a = 5; pts_b = -5;           break;
            case 3:                     // 5x2
                pts_a = 4; pts_b = -4;           break;  
            case 2:                     // 5x3
                pts_a = 3; pts_b = -3;           break;
            case 1:                    // 5x4
                pts_a = 2; pts_b = -2;           break;  
            case -1:                    // 4x5
                pts_a = -2; pts_b = 2;           break;   
            case -2:                    // 3x5
                pts_a = -4; pts_b = 4;           break;
            case -3:                    // 2x5
                pts_a = -6; pts_b = 6;           break;
            case -4:                    // 1x5
                pts_a = -8; pts_b = 8;           break;
            case -5:                    // 0x5
                pts_a = -10; pts_b = 10;           break;
            default:                    
                pts_a = 0; pts_b = 0;
          }
      }

    else if(calcPlayersA < calcPlayersB){ 
      console.log("TEAMB");
        switch (calcPoints) {
            case -5:                     // 5x0
                pts_b = 6; pts_a = -6;           break;
            case -4:                     // 5x1
                pts_b = 5; pts_a = -5;           break;
            case -3:                     // 5x2
                pts_b = 4; pts_a = -4;           break;  
            case -2:                     // 5x3
                pts_b = 3; pts_a = -3;           break;
            case -1:                    // 5x4
                pts_b = 2; pts_a = -2;           break;  
            case 1:                    // 4x5
                pts_b = -2; pts_a = 2;           break;   
            case 2:                    // 3x5
                pts_b = -4; pts_a = 4;           break;
            case 3:                    // 2x5
                pts_b = -6; pts_a = 6;           break;
            case 4:                    // 1x5
                pts_b = -8; pts_a = 8;           break;
            case 5:                    // 0x5
                pts_b = -10; pts_a = 10;           break;
            default:                    
                pts_b = 0; pts_a = 0;
          }
      }

    else{
        if (calcPoints >= 0){
            pts_a = calcPoints;
            pts_b = -calcPoints;
        }
        else {
            pts_a = calcPoints;
            pts_b = -calcPoints;        
        }
      } 

    // Set User Points --------------------------->
    var teamA = [], teamB = [];
    for(var i=0; i<3; i++){
      teamA.push(findReport.teams[i]);
      teamB.push(findReport.teams[i+3]);
    }
    if(pts_a > 0){
      const setUserPointsA = await User.updateMany({name: {$in: teamA}},{
        $inc: {
           points: pts_a,
           wins: 1
        } 
      })
      if(!setUserPointsA){throw {error: "Error Set User Points A"}}
    }
    else{
      const setUserPointsA = await User.updateMany({name: {$in: teamA}},{
        $inc: {
           points: pts_a,
           loses: 1
        } 
      })
      if(!setUserPointsA){throw {error: "Error Set User Points A"}}
    }

    if(pts_b > 0){
      const setUserPointsB = await User.updateMany({name: {$in: teamB}},{
        $inc: {
           points: pts_b,
           wins: 1
        } 
      })
      if(!setUserPointsB){throw {error: "Error Set User Points B"}}
    }
    else{
      const setUserPointsB = await User.updateMany({name: {$in: teamB}},{
        $inc: {
           points: pts_b,
           loses: 1
        } 
      })
      if(!setUserPointsB){throw {error: "Error Set User Points B"}}
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

router.post("/resetall", async(req,res)=>{
  try {
    const setUserPoints = await User.updateMany({},{
      $set: {
         points: 0,
         wins: 0,
         loses: 0
      } 
    })
    if(!setUserPoints){throw {error: "User set points"}}

    res.status(200).json({
      status: "Reset Points",
      mensagem: setUserPoints
    })
  } catch (error) {
    res.status(500).json({
      status: "ERROR resetPoints",
      mensagem: error
    })
  }
})

module.exports = router;