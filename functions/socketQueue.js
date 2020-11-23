const mongoose = require('mongoose');

const Queue = require('../models/Queue');
const User = require('../models/user');
const Match = require('../models/match');

const queueInit = async () => {
    try {
        const findQueue = await Queue.find()
        return await findQueue;
    } catch (error) {
        throw { error };
    }
}

const queueUpdate = async (player) => {
    try {
        const matchFind = await Match.findOne({ $and: [ { teams: { $in: [ player.name ] } }, { finished: false } ] }).sort({time: 'desc'});
        if(matchFind){
            throw {error: "Você ainda tem uma partida em andamento!"};
        }
        else{
            const foundUser = await User.findOne({ name: player.name });
                if (!foundUser) {
                console.log("Usuário não encontrado");
                return;
            }
            const newQueue = new Queue({
                id: foundUser.id,
                name: foundUser.name,
                main: foundUser.main,
                points: foundUser.points
            })

            const findQueue = await Queue.findOne({ name: foundUser.name })
            if (findQueue) {
                const result = await Queue.deleteOne({ name: foundUser.name })
            }
            const newSave = await newQueue.save();
            if(!newSave){ throw { error } };

            console.log(newQueue.name + " entrou na fila!");

            const count = await Queue.countDocuments();
            const queue = await Queue.find();
            return { count, queue };
        }
        
    } catch (error) {
        console.log(error);
        throw { error };
    }

}

const queueDelete = async (playerId) => {
    try {
        const deleteQueue = await Queue.deleteOne({ id: playerId });
        if (!deleteQueue) { throw {error: "NoUser"}}
        console.log(playerId + " saiu da fila!");
        
        const queue = await Queue.find({})
        return await queue;

    } catch (error) {
        console.log(error);
    }
}

module.exports = { queueUpdate, queueInit, queueDelete }