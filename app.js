const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const cors = require('cors');
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
require('dotenv').config();



const { queueUpdate, queueInit, queueDelete } = require('./functions/socketQueue')
const { matchInit, matchUpdate } = require('./functions/socketMatch')



app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});


var PORT = process.env.PORT || 8081;

// ####################################################### ROUTES

const matchRoute = require('./routes/match');
app.use('/match', matchRoute);

const userRoute = require('./routes/user');
app.use('/user', userRoute);

const queueRoute = require('./routes/queue');
app.use('/queue', queueRoute);


// ####################################################### APP USES

app.use(bodyParser.urlencoded({ extended: false })); // NÃO/SIM ACEITA dados complexos* = FALSE/TRUE
app.use(bodyParser.json()); //Aceita apenas json como formato
app.use(express.static("public"));


app.get('/', function (req, res) {
  // res.redirect("/match")
  res.status(200).send({
    messagem: "OK Rota GET ROOT"
  });
});


app.post('/', function (req, res) {
  const userLogin = req.body;
  res.send({
    menssagem: "OK FOI",
    result: userLogin
  })
});


io.on('connection', async (socket) => {

  const queue = await queueInit(); 
  io.emit('queueInit', queue);

  const match = await matchInit();
  io.emit('matchInit', match);

    
  socket.on('queueDelete', async(playerId) => {
    const queue = await queueDelete(playerId);
    io.emit('queueUpdate', queue);
  })

  socket.on('queueUpdate', async (player) => {
    try {
      const { count, queue } = await queueUpdate(player);
      io.emit('queueUpdate', queue);

      if(await count >= 6){
        const { queueRes, matchRes, reportRes } = await matchUpdate();
        io.emit('queueUpdate', queueRes);
        io.emit('matchUpdate', matchRes);
        io.emit('reportUpdate', reportRes);
      }
      return;
    } catch (error) {
      console.log(error);
    }
  })
})


server.listen(PORT, function () {
  console.log("Server started on port " + PORT);
});