/*jshint esversion: 6 */

const BLENDER_STRUCTURE = require('./blender-structure');
const compileProp = require('./compile-prop');

function pointerProp(offset) {
    return {
        get: function() {
            let pointer = this.__blender_file__.getPointer(this.__data_address__ + offset, this.__blender_file__);
            var link = this.__blender_file__.memory_lookup[pointer];

            var results = [];

            if (link) {
                var address = link.__data_address__;
                let j = 0;
                while (true) {
                    pointer = this.__blender_file__.getPointer(address + j * 8, this.__blender_file__);
                    let obj = this.__blender_file__.memory_lookup[pointer];
                    if (!obj) break;
                    results.push(obj);
                    j++;
                }

            };

            return results;
        },
        set: function() {}
    };
}

//Store final DNA structs
const MASTER_SDNA_SCHEMA = function(version) {
    this.version = version;
    this.SDNA_SET = false;
    this.byte_size = 0;
    this.struct_index = 0;
    this.structs = {};
    this.SDNA = {};
    this.endianess = false;
};

MASTER_SDNA_SCHEMA.prototype = {
    getSDNAStructureConstructor: function(name, struct, pointer_size) {
        if (struct) {
            var blen_struct = Function("function " + name + "(){}; return " + name)();

            blen_struct.prototype = new BLENDER_STRUCTURE(this);
            blen_struct.prototype.blender_name = name;
            blen_struct.prototype.__pointers = [];
            blen_struct.prototype.__list__ = [];

            var offset = 0;
            //Create properties of struct
            for (var i = 0; i < struct.length; i += 3) {
                var _name = struct[i],
                    n = _name,
                    type = struct[i + 1],
                    length = struct[i + 2],
                    array_length = 0,
                    match = null,
                    Blender_Array_Length = 1,
                    Suparray_match = 1,
                    PointerToArray = false,
                    Pointer_Match = 0;
                var DNA = this.SDNA[name] = {
                    constructor: blen_struct
                };


                let original_name = _name;

                //mini type parser
                if ((match = _name.match(/(\*?)(\*?)(\w+)(\[(\w*)\])?(\[(\w*)\])?/))) {

                    //base name
                    _name = match[3];

                    //pointer type
                    if (match[1]) {
                        Pointer_Match = 10;
                        blen_struct.prototype.__pointers.push(_name);
                    }

                    if (match[2]) {
                        PointerToArray = true;
                    }

                    //arrays
                    if (match[4]) {
                        if (match[6]) {
                            Suparray_match = parseInt(match[5]);
                            Blender_Array_Length = parseInt(match[7]);
                        } else {
                            Blender_Array_Length = parseInt(match[5]);
                        }
                    }
                    array_length = Blender_Array_Length * length;
                    length = array_length * Suparray_match;
                }

                DNA[n] = {
                    type: type,
                    length: length,
                    isArray: (Blender_Array_Length > 0),
                };

                if (PointerToArray) {
                    Object.defineProperty(blen_struct.prototype, _name, pointerProp(offset));
                    offset += pointer_size;
                } else if (Suparray_match > 1) {
                    var array_names = new Array(Suparray_match);

                    //construct sub_array object that will return the correct structs
                    for (var j = 0; j < Suparray_match; j++) {
                        let array_name_ = `__${_name}[${j}]__`;
                        array_names[j] = array_name_;

                        offset = compileProp(blen_struct.prototype, array_name_, type, offset, Blender_Array_Length, Pointer_Match, pointer_size, array_length);
                    }

                    Object.defineProperty(blen_struct.prototype, _name, {
                        get: (function(array_names) {
                            return function() {
                                var array = [];
                                for (var i = 0; i < array_names.length; i++) {
                                    array.push(this[array_names[i]]);
                                }
                                return array;
                            };
                        })(array_names)
                    });
                } else {
                    offset = compileProp(blen_struct.prototype, _name, type, offset, Blender_Array_Length, Pointer_Match, pointer_size, length);
                }
            }

            return this.SDNA[name].constructor;

        } else {
            if (!this.SDNA[name]) {
                return null;
            }
            return this.SDNA[name].constructor;
        }
    }
};

module.exports = MASTER_SDNA_SCHEMA;