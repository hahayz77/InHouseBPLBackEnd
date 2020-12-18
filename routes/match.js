const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const cors = require('cors');

router.use(bodyParser.json());
router.use(cors());

const Match = require('../models/match');
const User = require('../models/user');

router.get("/", async (req, res) => {
  try {
    const matchFindeAll = await Match.find({}).sort({ time: 'desc' }).limit(20);
    res.status(200).send(await matchFindeAll);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/problem/:name", async (req,res) => {
  try {
    const findReport = await Match.deleteOne({ $and: [{ teams: { $in: [req.params.name] } }, { finished: false }] }).sort({ time: 'desc' });
    if(!findReport){throw {error: "Error FindReport"}}
    else{
      res.status(200).json({
        status: "matchproblem",
        mensagem: "Match Cancelado!"
      })
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

    // Set User Points --------------------------->
    var teamA = [], teamB = [];
    for(var i=0; i<3; i++){
      teamA.push(findReport.teams[i]);
      teamB.push(findReport.teams[i+3]);
    }

    const calcPointsA = preresultInt[0] - preresultInt[1];
    if(calcPointsA > 0){
      const setUserPointsA = await User.updateMany({name: {$in: teamA}},{
        $inc: {
           points: calcPointsA,
           wins: 1
        } 
      })
      if(!setUserPointsA){throw {error: "Error Set User Points A"}}
    }
    else{
      const setUserPointsA = await User.updateMany({name: {$in: teamA}},{
        $inc: {
           points: calcPointsA,
           loses: 1
        } 
      })
      if(!setUserPointsA){throw {error: "Error Set User Points A"}}
    }


    const calcPointsB = preresultInt[1] - preresultInt[0];
    if(calcPointsB > 0){
      const setUserPointsB = await User.updateMany({name: {$in: teamB}},{
        $inc: {
           points: calcPointsB,
           wins: 1
        } 
      })
      if(!setUserPointsB){throw {error: "Error Set User Points B"}}
    }
    else{
      const setUserPointsB = await User.updateMany({name: {$in: teamB}},{
        $inc: {
           points: calcPointsB,
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

router.delete("/delete/all/alucard123", async (req, res) => {
  try {
    const deleteMatches = await Match.deleteMany({});
    res.status(200).send(await deleteMatches);

  } catch (err) {
    res.status(500).send("Erro ao deletar");
  }
})

module.exports = router;