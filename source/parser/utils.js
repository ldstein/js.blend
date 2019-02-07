function toString(buffer, _in, _out) {
    return String.fromCharCode.apply(String, new Uint8Array(buffer, _in, _out - _in));
}

module.exports = {toString};