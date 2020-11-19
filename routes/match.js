const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

router.use(bodyParser.json());

const Match = require('../models/match');

router.get("/", async (req, res) => {
  try {
    const matchFindeAll = await Match.find({}).sort({ time: 'desc' }).limit(20);
    res.status(200).send(await matchFindeAll);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/report/:name", async (req, res) => {
  try {
    const findReport = await Match.findOne({ $and: [{ teams: { $in: [req.params.name] } }, { finished: false }] }).sort({ time: 'desc' });
    if (!findReport) {
      res.json({
        status: "nomatch",
        mensagem: "Nenhuma partida para reportar"
      });
      return;
    }
    res.status(200).json({
      status: "reportmatch",
      mensagem: "Partida para reportar",
      id: findReport.id,
      teams: findReport.teams,
      reported: findReport.reported,
      preresult: findReport.preresult
    });
  } catch (error) {
    res.status(500).json({
      status: error,
      mensagem: "Erro ao Reportar!"
    })
    throw { error };
  }
})

router.get("/update/:name", async () => {
  res.send("Update Match e Report");
  // const updateMaches = await Match.find({ finished: false }).sort({time: 'desc'});
})

router.patch('/result', async (req, res) => {
  try {
    var preresultInt = [];
    preresultInt[0] = parseInt(req.body.preresult[0]);
    preresultInt[1] = parseInt(req.body.preresult[1]);
    
    const findReport = await Match.findOne({ $and: [{ teams: { $in: [req.body.player] } }, { finished: false }] }).sort({ time: 'desc' });
    if (!findReport) { throw { error } };

    if (req.body.team === "A") {
      if (findReport.preresult.teamb[0] === 0 && findReport.preresult.teamb[1] === 0) {
        const updateMatchA = await Match.updateOne({ _id: req.body.id },
          {
            $set: {
              "preresult.teama": preresultInt
            }
          })
        if (!updateMatchA) { throw { error } }

        res.status(200).json({
          status: "awaitcompare",
          mensagem: "Report feito com sucesso! Aguarde a comparação do resultado!"
        })
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
          if (!updateMatchA) { throw { error } }
      }
      else {
        const updateMatchA = await Match.updateOne({ _id: req.body.id }, { $set: { "preresult.teamb": [0, 0] } });
        if (!updateMatchA) { throw { error } }
        res.json({
          status: "wrongresult",
          mensagem: "Resultados não conferem!"
        })
      }
    }

    if (req.body.team === "B") {
      if (findReport.preresult.teama[0] === 0 && findReport.preresult.teama[1] === 0) {
        const updateMatchB = await Match.updateOne({ _id: req.body.id },
          {
            $set: {
              "preresult.teamb": preresultInt
            }
          })
        if (!updateMatchB) { throw { error } }
        
        res.status(200).json({
          status: "awaitcompare",
          mensagem: "Report feito com sucesso! Aguarde a comparação do resultado!"
        })
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
      }
      else {
        const updateMatchB = await Match.updateOne({ _id: req.body.id }, { $set: { "preresult.teama": [0, 0] } });
        if (!updateMatchB) { throw { error } }
        res.json({
          status: "wrongresult",
          mensagem: "Resultados não conferem!"
        })
      }
    }

    console.log("DISTRIBUIR PONTOS");// --------------------------->


    console.log("ATUALIZAR OS MATCHES");// ---------------------------> 
    const updateMatches = await Match.find({finished: false}).sort({ time: 'desc' }).limit(5);
    console.log(updateMatches);
    res.json({
      status: "reportok",
      mensagem: "Distribuir pontos!",
      update: updateMatches
    })


  } catch (error) {
    throw { error };
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