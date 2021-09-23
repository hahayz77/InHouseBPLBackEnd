const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const mongoose = require('mongoose');
const cors = require('cors');

const Queue = require('../models/Queue');
const User = require('../models/user');

router.use(bodyParser.json());
router.use(cors());

// router.get('/', function (req, res) {
//   Queue.find(function(err, allQueue){
//     if(!err){
//       res.send(allQueue);
//     }
//     else{
//       res.send("ERR")
//     }
//   }).sort({time: 'asc'})

// });

router.post('/', function(req, res){
  const name = req.body.name;
  
  User.findOne({name: name}, function(err, foundUser){  
    if(foundUser){
      const newQueue = new Queue({
        id: foundUser.id,
        name: foundUser.name,
        main: foundUser.main,
        points: foundUser.points,
    });
      
      Queue.findOne({name: foundUser.name}, function(err, findQueue){
        if(findQueue){
          Queue.deleteOne({name: foundUser.name}, function(err, result){
            if (result){
              newQueue.save(function(err){
                if (!err){
                  res.status(200).json({
                    menssagem: "Entrou na fila!"
                  })
                } else {
                  res.status(500).send("Erro interno: queuePOST001" + err);
                }
              })
            }
            else{
              res.status(500).send(err);
            }
          })
        }
        else if(err){
          res.status(500).send("Erro interno: queuePOST002" + err);
        }
        else{
          newQueue.save(function(err){
            if (!err){
              res.status(200).json({
                menssagem: "Entrou na fila!"
              })
            } else {
              res.status(500).send("Erro interno: queuePOST003" + err);
            }
          })
        }
      });
    }
    else if(err){
      res.status(500).send("Erro interno: queuePOST003" + err);
    }
    else{
      res.status(400).send("Usuário não encontrado")
    }

  })
})


router.delete('/one/:name', function(req, res){
  try {
    const name = req.params.name;

    const deleteOne = Queue.deleteOne({id: name}, err);
    if(err) {throw {error: "Error delete One!"}}
    res.status(200).send(id + " Foi retirado da Fila por " + "!");
  } catch (error) {
    res.json({mensagem: "Erro delete One route!"})
  }

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
        res.send("Erro");
      }
    })
})

module.exports = router;
