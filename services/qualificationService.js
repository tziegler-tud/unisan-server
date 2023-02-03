
import db from '../schemes/mongo.js';


const Qual = db.Qualifications;

export default {
    getAll,
    getById,
    getByType,
    getByTitle,
    groupByType,
    create,
    update,
    delete: _delete
};

/** @typedef {import("../schemes/qualificationScheme").QualificationSchema} QualificationSchema */

/**
 * Gets all qualifications from the database
 */
async function getAll() {
    return await Qual.find().sort("qualType");
}

/**
 * Gets a qualification by its id
 * @param {number} id The id of the qualification
 */
async function getById(id) {
    return await Qual.findById(id);
}

/**
 * Gets qualifications by their type
 * @param {string} type The type to search for
 * @returns An array of qualifications (Documents)
 */
async function getByType(type) {
    return await Qual.find({qualType: type});
}

/**
 * Gets qualifications by their type
 * @param {string} title The title to search for
 * @returns An array of qualifications (Documents)
 */
async function getByTitle(title) {
    return await Qual.find({title: title});
}

/**
 * Creates a new qualification
 * @param {QualificationSchema} qualParam The object to create the qualification with
 */
async function create(qualParam) {
  
    // create qualification document
    const qual = new Qual(qualParam);

    // save in database
    await qual.save();
}

/**
 * Updates an existing qualification
 * @param {number} id The id of the existing qualification
 * @param {QualificationSchema} qualParam The object to create the qualification with
 */
async function update(id, qualParam) {
    const qual = await Qual.findById(id);

    // validate
    if (qual == null) throw new Error('Qualification not found');

    // copy qualParam properties to qualification document
    Object.assign(qual, qualParam);
    await qual.save();
}

/**
 * Deletes a qualification
 * @param {number} id The id of the qualification to delete
 */
async function _delete(id) {
    await Qual.findByIdAndRemove(id);
}

/**
 *
 * groups the qualifications by type. returns JSON Array of scheme "[{_id: <qualType>, values: [qual1, qual2, ...]}]}
 * where qual1 etc. are qualification documents as stored in qualifications collection
 *
 * @returns {Promise<Aggregate|AggregationCursor>}
 */

async function groupByType(){
    return Qual.aggregate([
        {$sort: {level: 1}},
        {
            $group: {
                _id: "$qualType",
                values: {
                    $push: "$$ROOT"
                }
            }
        },
        {
            $sort: {_id: 1}
        }
        // {
        //     $addFields:
        //         {
        //             typeIdentifier: {$first: "$typeIdentifier"}
        //         }
        // }
    ])
}