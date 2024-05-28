export function convertValueToDelta(value){
    if (typeof (value) !== 'string'){ return {}}
    let delta = {ops: [
            {'insert': value}
        ]
    }
    return JSON.stringify(delta);
}