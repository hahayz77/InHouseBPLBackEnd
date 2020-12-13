const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/user');
const bcrypt = require('bcrypt');

router.use(bodyParser.json());
router.use(cors());

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
            main: 'Jade',
            level: "player",
            password: hash,
            points: 0,
            wins: 0,
            loses: 0
          });
        
          newUser.save(function(err){
            if (!err){
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
            level: foundUser.level,
            points: foundUser.points,
            wins: foundUser.wins,
            loses: foundUser.loses
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

router.get('/ranking', async(req, res)=>{
    try {
      const ranking = await User.find({}, {_id: 0, name: 1, main: 1, points: 1}).sort({ points: 'desc' });
      if(!ranking){throw {error: "Error Ranking"}}
      res.json(ranking);
    } catch (error) {
      res.json({ error });
    }
});


module.exports = router;