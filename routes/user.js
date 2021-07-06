const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/user');
const Ranking = require('../models/ranking');
const ResetPassword = require('../models/resetPassword');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

router.use(bodyParser.json());
router.use(cors());

router.post('/register', function (req, res) {

    User.findOne({ $or: [{ name: req.body.name }, { email: req.body.name }] }, function (err, foundUser) {
        if (foundUser) {
            res.status(400).json({ mensagem: "Usuário já cadastrado!", erro: err });
        }
        else if (err) {
            res.status(404).json({ mensagem: "Erro no registro", erro: err });
        }
        else if (req.body.name === '' || req.body.email === '' || req.body.password === '') {
            res.status(400).json({ mensagem: "Dados incompletos!", erro: err });
        }
        else {
            bcrypt.hash(req.body.password, 10, (errcrypt, hash) => {
                if (errcrypt) {
                    res.status(500).json({ mensagem: "Erro interno do servidor", erro: errcrypt });
                }
                else {
                    const newUser = new User({
                        email: req.body.email,
                        name: req.body.name,
                        main: 'Jade',
                        level: "player",
                        password: hash,
                        points: 0,
                        wins: 0,
                        loses: 0
                    });

                    newUser.save(function (err) {
                        if (!err) {
                            res.status(201).json({
                                mensagem: "Usuário cadastrado com sucesso!",
                                id: newUser.id,
                                email: newUser.email,
                                name: newUser.name,
                                main: newUser.main,
                                level: newUser.level,
                                ponints: newUser.points,
                                wins: newUser.wins,
                                loses: newUser.loses
                            });
                        } else {
                            res.status(500).json({ mensagem: "Erro interno do servidor!", erro: err });
                        }
                    })
                }

            })
        }
    })

});


router.post('/login', function (req, res) {

    User.findOne({ $or: [{ name: req.body.name }, { email: req.body.email }] }, function (err, foundUser) {
        if (foundUser) {
            bcrypt.compare(req.body.password, foundUser.password, function (err, result) {
                if (err) {
                    res.status(500).json({ mensagem: "Erro interno do servidor!", erro: err });
                }
                else if (result) {
                    res.status(202).json({
                        mensagem: "Logado com sucesso!",
                        id: foundUser.id,
                        name: foundUser.name,
                        main: foundUser.main,
                        level: foundUser.level,
                        points: foundUser.points,
                        wins: foundUser.wins,
                        loses: foundUser.loses
                    })
                }
                else {
                    res.status(401).json({ mensagem: "Senha incorreta" });
                }

            })
        }

        else {
            res.status(400).json({ mensagem: "Usuário incorreto!" });
        }
    })
});


router.post("/forgotpassword/codegenerate", async function (req, res){
    try{
        const findEmail = await User.findOne({ email: req.body.email });
        if(!findEmail){ throw { error: "Error 001 - usermail" }}
        else{ 
            const findResetPass = await ResetPassword.findOne({ email: req.body.email });
            if(findResetPass){ throw { error: "Error 002 - resetAgain" } };
            let code = [0,0,0,0,0,0];
            for (i in code){
                code[i] = Math.floor(Math.random() * 10);
            }

            const newResetPassword = new ResetPassword({
                email: req.body.email,
                code: code
            });

            newResetPassword.save(function (err) {
                if(err){ throw { error: "Error 003 - save usermail" } };

                var transporter = nodemailer.createTransport({
                    host: 'smtp.zoho.com',
                    port: 587,
                    secure: false, //ssl
                    auth: {
                            user: 'contato@battleritebrasil.com',
                            pass: process.env.MAIL_PASS
                    }
                });

                let finalCode = code.join(" - ");
                

                  const configs = {
                    from: 'contato@battleritebrasil.com',
                    to: req.body.email,
                    subject: 'E-mail enviado usando Node!',
                    html: "<h2>Seu código para resetar a senha é</h2>"+ "<br>" + "<h4>"+ finalCode + "</h4>"
                  };


                  transporter.sendMail(configs, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email enviado: ' + info.response);
                    }
                  });
                  
                res.status(200).json({ mensagem: "Confirme o código enviado para o seu email: " + findEmail.email })
            });
        };

    }catch(error){
        if (error.error === "Error 002 - resetAgain"){
            res.status(200).json({
                mensagem: "O código já foi enviado para o email! Aguarde 30 minutos para enviar outro novamente"
            });
        }
        else if(error.error === "Error 001 - usermail"){
            res.status(404).json({mensagem: "Usuário não encontrado na base de dados!"});
        }
        else{
            res.status(500).json({mensagem: "Erro interno usercodegenerate!"});
        }
    }
});

router.post("/forgotpassword/codeconfirmation/:code", async function (req, res){
    try{
        const code = req.params.code;
        res.status(200).json({mensagem: "Código "+ code +" confirmado"})

    }catch(error){
        res.status(500).json({mensagem: "Usuário não encontrado na base de dados!"})
    }
});

router.get('/ranking', async (req, res) => {
    try {
        const ranking = await User.find({ $or: [{ wins: { $gt: 0 } }, { loses: { $gt: 0 } }] }, { _id: 0, name: 1, main: 1, points: 1, wins: 1, loses: 1 }).sort({ points: 'desc' });
        if (!ranking) { throw { error: "Error Ranking" } }
        for (i in ranking){                 // RANKING TO TIERS !IMPORTANTE
            if(ranking[i].points <= -10){
                ranking[i].points = 1;
            }
            else if(ranking[i].points > -10 && ranking[i].points <= 0){
                ranking[i].points = 2;
            }
            else if(ranking[i].points > 0 && ranking[i].points <= 25){
                ranking[i].points = 3;
            }
            else if(ranking[i].points > 25 && ranking[i].points <= 75){
                ranking[i].points = 4;
            }
            else if(ranking[i].points > 75 && ranking[i].points <= 150){
                ranking[i].points = 5;
            }
            else if(ranking[i].points > 150){
                ranking[i].points = 6;
            }
        }
        res.json(ranking);
    } catch (error) {
        res.json({ error });
    }
});

router.get('/pastrankings/', async (req, res) => {
    try {
      const ranking = await Ranking.find({}).sort({ time: 'desc' });
      if(!ranking){throw {error: "Error Ranking"}}
      res.json(ranking);
    } catch (error) {
        res.json({ error });
    }
});

router.post('/saveranking', async(req,res)=>{
  try {
    const newRanking = new Ranking({
      name: req.body.name,
      ranking: req.body.ranking,
      date: req.body.date
    });

    newRanking.save(function(err){
      if (!err){
          res.status(201).json({
          mensagem: "Temporada salva com sucesso",
          name: newRanking.name,
          ranking: newRanking.ranking,
          date: newRanking.date
        });
      }
      else{
        throw {error: err};
      }
    })
  } catch (error) {
    res.send(error);
  }
})

// router.post("/resetall", async (req, res) => {
//     try {
//         const setUserPoints = await User.updateMany({}, {
//             $set: {
//                 points: 0,
//                 wins: 0,
//                 loses: 0
//             }
//         })
//         if (!setUserPoints) { throw { error: "User set points" } }

//         res.status(200).json({
//             status: "Reset Points",
//             mensagem: setUserPoints
//         })
//     } catch (error) {
//         res.status(500).json({
//             status: "ERROR resetPoints",
//             mensagem: error
//         })
//     }
// })

router.get('/main/:id/:champion', async (req, res) => {
    try {
        const champion = req.params.champion;
        const id = req.params.id;

        const userUpdateMain = await User.updateOne({ _id: id }, {
            $set: {
                main: champion
            }
        })
        if (!userUpdateMain) { throw { error: "Error userUpdateMain" } }

        const ranking = await User.find({}, { _id: 0, name: 1, main: 1, points: 1 }).sort({ points: 'desc' });
        if (!ranking) { throw { error: "Error Ranking" } }

        res.json({
            mensagem: "Main alterado!",
            status: "mainchampionok",
            ranking: ranking
        })
    } catch (error) {
        res.json({
            mensagem: error,
            erro: userUpdateMain
        });
    }
});

module.exports = router;
