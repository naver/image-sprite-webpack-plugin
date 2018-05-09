const NS = 'imageSpriteWebpackPlugin';
const cache = {};

function decamelize(str) {
    if (cache[str]) {
        return cache[str];
    }
    return str
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2')
        .toLowerCase();
}

function on(owner, event, tab, callback) {
    if (owner.hooks && owner.hooks[event]) {
        owner.hooks[event][tab](NS, callback);
    } else {
        owner.plugin(decamelize(event), callback);
    }
}

module.exports = on;
