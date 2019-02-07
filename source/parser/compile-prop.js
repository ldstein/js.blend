const utils = require('./utils');

const toString = utils.toString;

/*
    These functions map offsets in the blender __blender_file__ to basic types (byte,short,int,float) through TypedArrays;
    This allows the underlying binary data to be changed.
*/

function float64Prop(offset, Blender_Array_Length, length) {
    return {
        get: function() {
            return (Blender_Array_Length > 1) ?
                new Float64Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                this.__blender_file__.dv.getFloat64(this.__data_address__ + offset, this.__blender_file__.template.endianess);
        },
        set: function(float) {
            if (Blender_Array_Length > 1) {} else {
                this.__blender_file__.dv.setFloat64(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
            }
        },
    };
}

function floatProp(offset, Blender_Array_Length, length) {
    return {
        get: function() {
            return (Blender_Array_Length > 1) ?
                new Float32Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                this.__blender_file__.dv.getFloat32(this.__data_address__ + offset, this.__blender_file__.template.endianess);
        },
        set: function(float) {
            if (Blender_Array_Length > 1) {} else {
                this.__blender_file__.dv.setFloat32(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
            }
        },
    };
}

function intProp(offset, Blender_Array_Length, length) {
    return {
        get: function() {
            return (Blender_Array_Length > 1) ?
                new Int32Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                this.__blender_file__.dv.getInt32(this.__data_address__ + offset, this.__blender_file__.template.endianess);
        },
        set: function(int) {
            if (Blender_Array_Length > 1) {} else {
                this.__blender_file__.dv.setInt32(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
            }
        },
    };
}

function uIntProp(offset, Blender_Array_Length, length) {
    return {
        get: function() {
            return (Blender_Array_Length > 1) ?
                new Uint32Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                this.__blender_file__.dv.getUint32(this.__data_address__ + offset, this.__blender_file__.template.endianess);
        },
        set: function(int) {
            if (Blender_Array_Length > 1) {} else {
                this.__blender_file__.dv.setUint32(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
            }
        },
    };
}

function shortProp(offset, Blender_Array_Length, length) {
    return {
        get: function() {
            return (Blender_Array_Length > 1) ?
                new Int16Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                this.__blender_file__.dv.getInt16(this.__data_address__ + offset, this.__blender_file__.template.endianess);
        },
        set: function(float) {
            if (Blender_Array_Length > 1) {} else {
                this.__blender_file__.dv.setInt16(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
            }
        },
    };
}

var uShortProp = (offset, Blender_Array_Length, length) => {
    return {
        get: function() {
            return (Blender_Array_Length > 1) ?
                new Uint16Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                this.__blender_file__.dv.getUint16(this.__data_address__ + offset, this.__blender_file__.template.endianess);
        },
        set: function(float) {
            if (Blender_Array_Length > 1) {} else {
                this.__blender_file__.dv.setUint16(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
            }
        },
    };
};

function charProp(offset, Blender_Array_Length, length) {
    return {
        get: function() {
            if (Blender_Array_Length > 1) {
                let start = this.__data_address__ + offset;
                let end = start;
                let buffer_guard = 0;

                while (this.__blender_file__.byte[end] != 0 && buffer_guard++ < length) end++;

                return toString(this.__blender_file__.AB, start, end);
            }
            return this.__blender_file__.byte[(this.__data_address__ + offset)];
        },
        set: function(byte) {
            if (Blender_Array_Length > 1) {
                var string = byte + "",
                    i = 0,
                    l = string.length;
                while (i < length) {
                    if (i < l) {
                        this.__blender_file__.byte[(this.__data_address__ + offset + i)] = string.charCodeAt(i) | 0;
                    } else {
                        this.__blender_file__.byte[(this.__data_address__ + offset + i)] = 0;
                    }
                    i++;
                }
            } else {
                this.__blender_file__.byte[(this.__data_address__ + offset)] = byte | 0;
            }
        }
    };
}

function pointerProp(offset, Blender_Array_Length, length) {
    return {
        get: function() {
            if (Blender_Array_Length > 1) {
                let array = [];
                let j = 0;
                let off = offset;
                while (j < Blender_Array_Length) {
                    let pointer = this.__blender_file__.getPointer(this.__data_address__ + off, this.__blender_file__);

                    array.push(this.__blender_file__.memory_lookup[pointer]);
                    off += length;
                    j++;
                }

                return array;
            } else {
                let pointer = this.__blender_file__.getPointer(this.__data_address__ + offset, this.__blender_file__);
                return this.__blender_file__.memory_lookup[pointer];
            }
        },
        set: function() {}
    };
}

function compileProp(obj, name, type, offset, array_size, IS_POINTER, pointer_size, length) {

    if (!IS_POINTER) {
        switch (type) {
            case "double":
                Object.defineProperty(obj, name, float64Prop(offset, array_size, length >> 3));
                break;
            case "float":
                Object.defineProperty(obj, name, floatProp(offset, array_size, length >> 2));
                break;
            case "int":
                Object.defineProperty(obj, name, intProp(offset, array_size, length >> 2));
                break;
            case "short":
            case "ushort":
                Object.defineProperty(obj, name, shortProp(offset, array_size, length >> 1));
                break;
            case "char":
            case "uchar":
                Object.defineProperty(obj, name, charProp(offset, array_size, length));
                break;
            default:
                //compile list to 
                obj[name] = {};
                obj.__list__.push(name, type, length, offset, array_size, IS_POINTER);
        }
        obj._length += length;
        offset += length;
    } else {
        Object.defineProperty(obj, name, pointerProp(offset, array_size, pointer_size));
        offset += pointer_size * array_size;
    }

    return offset;
}

module.exports = compileProp;