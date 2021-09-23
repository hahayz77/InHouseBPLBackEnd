const mongoose = require('mongoose');

const Queue = require('../models/Queue');
const User = require('../models/user');
const Match = require('../models/match');

const queueInit = async () => {
    try {
        const findQueue = await Queue.find({}, { id: 0, name: 0, main: 0});
        return await findQueue;
    } catch (error) {
        throw { error };
    }
}

const queueUpdate = async (player) => {
    try {
        const matchFind = await Match.findOne({ $and: [ { teams: { $in: [ player ] } }, { finished: false } ] }).sort({time: 'desc'});
        if(matchFind){
            throw {error: "Você ainda tem uma partida em andamento!"};
        }
        else{
            // let keyPoints = 57;
            const foundUser = await User.findOne({ name: player });
                if (!foundUser) {
                console.log("Usuário não encontrado");
                return;
            }
            const newQueue = new Queue({
                id: foundUser.id,
                name: foundUser.name,
                main: foundUser.main,
                points: foundUser.points,
            });

            const findQueue = await Queue.findOne({ name: foundUser.name })
            if (findQueue) {
                const result = await Queue.deleteOne({ name: foundUser.name })
            }
            const newSave = await newQueue.save();
            if(!newSave){ throw { error } };

            const count = await Queue.countDocuments();
            const queue = await Queue.find({}, { id: 0, name: 0, main: 0});
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
        
        const queue = await Queue.find({}, { id: 0, name: 0, main: 0})
        return await queue;

    } catch (error) {
        console.log(error);
    }
}

module.exports = { queueUpdate, queueInit, queueDelete }