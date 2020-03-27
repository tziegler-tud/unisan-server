const config = require('../config/config.json');
const bcrypt = require('bcryptjs');
const db = require('../schemes/mongo');

const UserDataset = db.UserDataset;

module.exports = {
    getRoot,
    getChildren,
    getAll,
    getById,
    getByTitle,
    insertNode,
    update,
    delete: _delete,
};

/** @typedef {import("../schemes/qualificationScheme").UserDatasetSchema} UserDatasetSchema */

/**
 * Gets all qualifications from the database
 */
async function getAll() {
    return await UserDataset.find()
}

/**
 * Gets a qualification by its id
 * @param {number} id The id of the qualification
 */
async function getById(id) {
    return await UserDataset.findById(id);
}

async function getByTitle(title) {
    return await UserDataset.findOne({ title: title })
}

/**
 * inserts a node
 * @param {UserDatasetSchema} datasetNode The object to create the new node with
 * @param {ObjectId} parentNodeId
 */
async function insertNode(datasetNode, parentNodeId) {
    // find parent Node
    const parent = await UserDataset.findById(parentNodeId);

    // create dataset node
    const set = new UserDataset(datasetNode);

    // save in database
    await set.save();

    //update parent
    await insertChild(parent,set);
}

/**
 * Updates an existing dataset node
 * @param {ObjectId} id The id of the existing node
 * @param {UserDatasetSchema} dataset The object to create the dataset with
 */
async function update(id, dataset) {
    const set = await UserDataset.findById(id);

    // validate
    if (set == null) throw new Error('Dataset not found');

    // copy qualParam properties to qualification document
    Object.assign(set, dataset);
    await set.save();
}

/**
 * adds a child to a given parent
 * @param parent parent
 * @param child child
 * @returns {Promise<void>}
 */

async function insertChild(parent, child) {
    // validate
    if (!parent) throw new Error('parent node not found');
    const childArray = parent.children;

    //check if children array exists
    if(Array.isArray(childArray)) {
        //check if child node is already present
        var index = childArray.map(e => e._id).indexOf(child.id);
        if (index > -1) {
            // child is already present
            console.log("Skipped adding child node: Child node is already present.")
        }
        else {
            // child not present, add to array
            childArray.push(child._id);
        }
        //update parent
        parent.set("children", childArray, {strict: false} );
    }
    else {
        //children array not present, creating it
        const array = [];
        array.push(child._id);
        parent.set("children", array, {strict: false} );
    }
    //save changes to db
    await parent.save();
}

/**
 * Deletes a dataset node
 * @param {number} id The id of the node to delete
 */
async function _delete(id) {
    // find the node
    var node = await UserDataset.findById(id);

    // dont delete if the node has children, throw error instead
    if (node.children) {
        if (node.children.length !== 0) {
            throw new Error ('Cannot delete dataset: has children');
        }
    }
    // delete the node
    await UserDataset.findByIdAndRemove(id);
    // find parent node and delete reference
    await UserDataset.findOneAndUpdate({ children: id},{ $pull: {children: id } });
    return true
}

async function getRoot(){
    return await UserDataset.findOne({title: 'root'})
}

async function getChildren(node){
    await node.populate('children').execPopulate();
    return node.children;
}

async function findAllLeaves(id){

}
