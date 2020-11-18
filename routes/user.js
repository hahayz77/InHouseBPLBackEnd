const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/user');
const bcrypt = require('bcrypt');

router.use(bodyParser.json());

router.post('/register', function (req, res) {

  User.findOne({$or: [{name: req.body.name}, {email: req.body.name}]}, function(err, foundUser){
    if (foundUser){
      res.status(400).json({mensagem: "Usuário já cadastrado!", erro: err});
    }
    else if(err) {
      res.status(404).json({mensagem: "Erro no registro", erro: err});
    }
    else if(req.body.name === '' || req.body.email === '' || req.body.password === '' ){
      res.status(400).json({mensagem: "Dados incompletos!", erro: err});
    }
    else{
      bcrypt.hash(req.body.password, 10, (errcrypt, hash) => {
        if(errcrypt){
          res.status(500).json({mensagem: "Erro interno do servidor", erro: errcrypt});
        }
        else{
          const newUser = new User({
            email: req.body.email,
            name: req.body.name,
            main: 'none',
            report: 'none',
            password: hash,
            points: 0,
            status: {
              wins: 0,
              loses: 0,
              matches: 0
            }
          });
        
          newUser.save(function(err){
            if (!err){
                res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso!",
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                main: 'none',
                report: 'none',    
                ponints: newUser.points,
                status: newUser.status
              });
            } else {
              res.status(500).json({ mensagem: "Erro interno do servidor!", erro: err});
            }
          })
        }

      })
    }
  })
  
});


router.post('/login', function (req, res) {

  User.findOne({$or: [{name: req.body.name}, {email: req.body.email}]}, function(err, foundUser){
    if (foundUser){
      bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
        if(err){
          res.status(500).json({ mensagem:"Erro interno do servidor!", erro: err });
        }
        else if(result) {
          res.status(202).json({
            mensagem: "Logado com sucesso!",
            id: foundUser.id,
            name: foundUser.name,
            main: foundUser.main,
            report: foundUser.report,
            points: foundUser.points,
            status: foundUser.status
          })
        }
        else{
          res.status(401).json({mensagem: "Senha incorreta"});
        }

      })
    }

    else{
      res.status(400).json({mensagem: "Usuário incorreto!"});
    }
  })
})


router.patch('/', function (req, res) {
    res.send("ROTA PATCH USER");
});

router.get('/', function (req, res) {
  res.json({name: "ROTA GET USER"})
});


module.exports = router;