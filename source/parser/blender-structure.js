/*jshint esversion: 6 */

const BLENDER_STRUCTURE = function(SDNA_Template) {
    this.__blender_file__ = null;
    this.__list__ = null;
    this.__super_array_list__ = null;
    this.blender_name = "";
    this.__pointers = null;
    this.address = null;
    this.length = 0;
    this.__data_address__ = 0;
    this.blender_name = "";
    this._length = 0;
    this.__SDNA_Template = SDNA_Template;
};

BLENDER_STRUCTURE.prototype = {
    setData: function(pointer, _data_offset, data_block_length, BLENDER_FILE) {
        if (this.__list__ === null) return this;
        BLENDER_FILE.addObject(this);

        this.__blender_file__ = BLENDER_FILE;

        var struct = this.__list__,
            j = 0,
            i = 0,
            obj, name = "",
            type, length, Blender_Array_Length, Pointer_Match, offset, constructor;

        this.__data_address__ = _data_offset;

        if (struct === null) return this;

        for (i = 0; i < struct.length; i += 6) {
            obj = null;
            name = struct[i];
            type = struct[i + 1];
            Blender_Array_Length = struct[i + 4];
            Pointer_Match = struct[i + 5];
            offset = this.__data_address__ + struct[i + 3];

            if (Blender_Array_Length > 1) {
                this[name] = [];
                j = 0;
                while (j < Blender_Array_Length) {
                    constructor = this.__SDNA_Template.getSDNAStructureConstructor(type);
                    if (constructor) {
                        this[name].push((new constructor()).setData(0, offset, offset + length / Blender_Array_Length, BLENDER_FILE));
                    } else this[name].push(null);
                    offset += length / Blender_Array_Length;
                    j++;
                }
            } else {
                constructor = this.__SDNA_Template.getSDNAStructureConstructor(type);
                if (constructor) {
                    this[name] = (new constructor()).setData(0, offset, length + offset, BLENDER_FILE);
                } else this[name] = null;
            }
        }
        //break connection to configuration list
        this.__list__ = null;
        return this;
    },

    get aname() {
        if (this.id) return this.id.name.slice(2);
        else return undefined;
    }
};

module.exports = BLENDER_STRUCTURE;