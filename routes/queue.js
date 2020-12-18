const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const mongoose = require('mongoose');
const cors = require('cors');

const Queue = require('../models/Queue');
const User = require('../models/user');

router.use(bodyParser.json());
router.use(cors());

router.get('/', function (req, res) {
  Queue.find(function(err, allQueue){
    if(!err){
      res.send(allQueue);
    }
    else{
      res.send("ERR")
    }
  }).sort({time: 'asc'})

});

router.post('/', function(req, res){
  User.findOne({name: req.body.name}, function(err, foundUser){  
    if(foundUser){
      const newQueue = new Queue({
        id: foundUser.id,
        name: foundUser.name,
        points: foundUser.points
      });
      
      Queue.findOne({name: foundUser.name}, function(err, findQueue){
        if(findQueue){
          Queue.deleteOne({name: foundUser.name}, function(err, result){
            if (result){
              newQueue.save(function(err){
                if (!err){
                  res.status(200).json({
                    menssagem: "Entrou na fila!",
                    name: newQueue.name,
                    points: newQueue.points,
                    time: newQueue.time,
                    expire_at: newQueue.expire_at
                  })
                } else {
                  res.status(500).send("Erro interno do Servidor!" + err);
                }
              })
            }
            else{
              res.status(500).send(err);
            }
          })
        }
        else if(err){
          res.status(500).send("Erro interno do Servidor!" + err);
        }
        else{
          newQueue.save(function(err){
            if (!err){
              res.status(200).json({
                menssagem: "Entrou na fila!",
                name: newQueue.name,
                points: newQueue.points,
                time: newQueue.time,
                expire_at: newQueue.expire_at
              })
            } else {
              res.status(500).send("Erro interno do Servidor!" + err);
            }
          })
        }
      });
    }
    else if(err){
      res.status(500).send("Erro interno do Servidor!" + err);
    }
    else{
      res.status(400).send("Usuário não encontrado")
    }

  })
})

router.patch('/', function(req, res){
  res.send({
    menssagem: 'Rota PATCH QUEUE criada com sucesso!'
  });
});

router.delete('/one/:id', function(req, res){
  const id = req.params.id;
  Queue.deleteOne({id: id}, function(err){
      if (!err){
        res.status(200).send(id + " Retirado da Fila")
      } else {
        res.send(err);
      }
    })
});

router.delete('/all', async (req, res) => {
    Queue.deleteMany({}, async function(err, deleteAll){
      if(err){
        res.send(err);
      }
      else if(deleteAll){
        res.send(deleteAll);
      }
      else{
        res.send("Erro")
      }
    })
})

module.exports = router;
