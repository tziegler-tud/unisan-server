const config = require('../config/config.json');
const bcrypt = require('bcryptjs');
const db = require('../schemes/mongo');

const Qual = db.Qualifications;

module.exports = {
    getAll,
    getById,
    getByType,
    getByTitle,
    getAllByType,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await Qual.find().select('-password');
}

async function getById(id) {
    return await Qual.findById(id);
}

async function getByType(type) {
    return await Qual.find({qualType: type});
}

async function getByTitle(title) {
    return await Qual.find({title: title});
}

async function create(qualParam) {
    // validate
   // noting to validate yet...

    const qual = new Qual(qualParam);

    // save user
    await qual.save();
}

async function update(id, qualParam) {
    const qual = await Qual.findById(id);

    // validate
    if (!qual) throw 'Qualification not found';

    // copy userParam properties to user
    Object.assign(qual, qualParam);

    await qual.save();
}

async function _delete(id) {
    await Qual.findByIdAndRemove(id);
}

async function getAllByType(){
    return Qual.aggregate([
        {
            $group: {
                _id: "$qualType",
                obj: {
                    $push: {name: "$name"}
                }
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $let: {
                        vars: { obj: [ { k: {$substr:["$_id", 0, -1 ]}, v: "$obj" } ] },
                        in: { $arrayToObject: "$$obj" }
                    }
                }
            }
        }
    ])
}