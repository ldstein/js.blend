/*jshint esversion: 6 */

const BLENDER_FILE = function(AB) {
    this.AB = AB;
    //this.double = new Float64Array(AB);
    this.byte = new Uint8Array(AB);

    this.dv = new DataView(AB);

    this.objects = {};
    this.memory_lookup = {},
    this.object_array = [];
    this.isBlendFile = false;
    this.template = null;
};

BLENDER_FILE.prototype = {
    addObject: function(obj) {
        this.object_array.push(obj);
        if (!this.objects[obj.blender_name]) this.objects[obj.blender_name] = [];
        this.objects[obj.blender_name].push(obj);
    },

    getPointer: function(offset) {
        var pointerLow = this.dv.getUint32(offset, this.template.endianess);
        if (this.template.pointer_size > 4) {
            var pointerHigh = this.dv.getUint32(offset + 4, this.template.endianess);
            if (this.template.endianess) {
                return (pointerLow) + "l|h" + pointerHigh;
            } else {
                return (pointerHigh) + "h|l" + pointerLow;
            }
        } else {
            return pointerLow;
        }
    }
};

module.exports = BLENDER_FILE;