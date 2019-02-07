/*jshint esversion: 6 */

const BLENDER_FILE = require('./blender-file');
const MASTER_SDNA_SCHEMA = require('./master-sdna-schema');
const utils = require('./utils');

const toString = utils.toString;

const DNA1 = 826363460;
const ENDB = 1111772741;

/* Note: Blender coordinates treat the Z axis as the vertical an Y as depth. */

module.exports = (function(unzipper) {

    //web worker not functional in this version
    USE_WEBWORKER = false;

    var worker = null,

        return_object = {
            loadBlendFromArrayBuffer: function(array_buffer) {
                return_object.ready = false;
                if (USE_WEBWORKER) {
                    worker.postMessage(array_buffer, array_buffer);
                } else {
                    worker.onmessage({
                        data: array_buffer
                    });
                }
            },
            loadBlendFromBlob: function(blob) {
                FR = new FileReader();
                FR.onload = function() {
                    return_object.loadBlendFromArrayBuffer(this.result);
                };
                FR.readAsArrayBuffer(blob);
            },
            ready: true,
            onParseReady: function() {},
        };

    worker = new worker_code();

    worker.postMessage = function(message) {
        return_object.onParseReady(message);
    };

    function worker_code() {
        "use strict";

        var data = null,
            _data = null,
            BIG_ENDIAN = false,
            pointer_size = 0,
            struct_names = [],
            offset = 0,
            working_blend_file = null,
            current_SDNA_template = null,
            templates = {},
            finished_objects = [],
            FILE = null,
            ERROR = null,
            AB = null,
            self = self || this;

        function parseFile(msg) {
            
            var self = this;
            
            if (typeof msg.data == "object") {
                // reset global variables
                AB = null;
                data = null;
                BIG_ENDIAN = false;
                pointer_size = 0;
                struct_names = [];
                offset = 0;
                working_blend_file = null;
                finished_objects = [];
                current_SDNA_template = null;


                // set data
                _data = msg.data;

                AB = _data.slice();

                data = new DataView(_data);


                FILE = new BLENDER_FILE(AB);

                //start parsing
                readFile();

                //export parsed data
                self.postMessage(FILE, ERROR);
            }
        }

        self.onmessage = parseFile;
        this.onmessage = parseFile;

        /*
            Returns a pre-constructed BLENDER_STRUCTURE or creates a new BLENDER_STRUCTURE to match the DNA struct type
        */
        var pointer_function = (pointer) => () => {
            return FILE.memory_lookup[pointer];
        };

        function getPointer(offset) {
            var pointerLow = data.getUint32(offset, BIG_ENDIAN);
            if (pointer_size > 4) {
                var pointerHigh = data.getUint32(offset + 4, BIG_ENDIAN);

                if (BIG_ENDIAN) {
                    return (pointerLow) + "" + pointerHigh;
                } else {
                    return (pointerHigh) + "" + pointerLow;
                }
            } else {
                return pointerLow;
            }
        }

        //Begin parsing blender __blender_file__

        function readFile() {
            var count = 0;
            var offset2 = 0;
            // var root = 0;
            // var i = 0;
            var data_offset = 0;
            var sdna_index = 0;
            var code = "";
            var block_length = 0;
            var curr_count = 0;
            var curr_count2 = 0;

            FILE.memory_lookup = {};
            struct_names = [];
            offset = 0;

            // Make sure we have a .blend __blender_file__. All blend files have the first 12bytes
            // set with BLENDER-v### in Utf-8
            if (toString(_data, offset, 7) !== "BLENDER") return ERROR = "File supplied is not a .blend compatible Blender file.";

            // otherwise get templete from save version.

            offset += 7;
            pointer_size = ((toString(_data, offset++, offset)) == "_") ? 4 : 8;
            BIG_ENDIAN = toString(_data, offset++, offset) !== "V";
            var version = toString(_data, offset, offset + 3);


            //create new master template if none exist for current blender version;
            if (!templates[version]) {
                templates[version] = new MASTER_SDNA_SCHEMA(version);
            }

            current_SDNA_template = templates[version];

            FILE.template = current_SDNA_template;

            offset += 3;

            //Set SDNA structs if template hasn't been set.
            //Todo: Move the following block into the MASTER_SDNA_SCHEMA object.
            //*Like so:*/ current_SDNA_template.set(AB);

            if (!current_SDNA_template.SDNA_SET) {
                current_SDNA_template.endianess = BIG_ENDIAN;
                current_SDNA_template.pointer_size = pointer_size;
                //find DNA1 data block
                offset2 = offset;

                while (true) {
                    sdna_index = data.getInt32(offset2 + pointer_size + 8, BIG_ENDIAN);
                    code = toString(_data, offset2, offset2 + 4).replace(/\u0000/g, "");
                    block_length = data.getInt32(offset2 + 4, true);
                    offset2 += 16 + (pointer_size);
                    if (code === "DNA1") {
                        // DNA found; This is the core of the __blender_file__ and contains all the structure for the various data types used in Blender.
                        count = 0;
                        var types = [],
                            fields = [],
                            names = [],
                            lengths = [],
                            name = "",
                            curr_name = "";

                        //skip SDNA and NAME identifiers
                        offset2 += 8;

                        //Number of structs.
                        count = data.getInt32(offset2, true);
                        offset2 += 4;

                        curr_count = 0;

                        //Build up list of names for structs
                        while (curr_count < count) {
                            curr_name = "";
                            while (data.getInt8(offset2) !== 0) {
                                curr_name += toString(_data, offset2, offset2 + 1);
                                offset2++;
                            }
                            names.push(curr_name);
                            offset2++;
                            curr_count++;
                        }


                        //Adjust for 4byte alignment
                        if ((offset2 % 4) > 0) offset2 = (4 - (offset2 % 4)) + offset2;
                        offset2 += 4;

                        //Number of struct types
                        count = data.getInt32(offset2, true);
                        offset2 += 4;
                        curr_count = 0;

                        //Build up list of types
                        while (curr_count < count) {
                            curr_name = "";
                            while (data.getInt8(offset2) !== 0) {
                                curr_name += toString(_data, offset2, offset2 + 1);
                                offset2++;
                            }
                            types.push(curr_name);
                            offset2++;
                            curr_count++;
                        }

                        //Adjust for 4byte alignment
                        if ((offset2 % 4) > 0) offset2 = (4 - (offset2 % 4)) + offset2;
                        offset2 += 4;
                        curr_count = 0;

                        //Build up list of byte lengths for types
                        while (curr_count < count) {
                            lengths.push(data.getInt16(offset2, BIG_ENDIAN));
                            offset2 += 2;
                            curr_count++;
                        }

                        //Adjust for 4byte alignment
                        if ((offset2 % 4) > 0) offset2 = (4 - (offset2 % 4)) + offset2;
                        offset2 += 4;

                        //Number of structures
                        var structure_count = data.getInt32(offset2, BIG_ENDIAN);
                        offset2 += 4;
                        curr_count = 0;

                        //Create constructor objects from list of SDNA structs
                        while (curr_count < structure_count) {
                            var struct_name = types[data.getInt16(offset2, BIG_ENDIAN)];
                            offset2 += 2;
                            obj = [];
                            count = data.getInt16(offset2, BIG_ENDIAN);
                            offset2 += 2;
                            curr_count2 = 0;
                            struct_names.push(struct_name);

                            //Fill an array with name, type, and length for each SDNA struct property
                            while (curr_count2 < count) {
                                obj.push(names[data.getInt16(offset2 + 2, BIG_ENDIAN)], types[data.getInt16(offset2, BIG_ENDIAN)], lengths[data.getInt16(offset2, BIG_ENDIAN)]);
                                offset2 += 4;
                                curr_count2++;
                            }

                            //Create a SDNA constructor by passing [type,name,lenth] array as second argument
                            current_SDNA_template.getSDNAStructureConstructor(struct_name, obj, pointer_size);
                            curr_count++;
                        }
                        current_SDNA_template.SDNA_SET = true;
                        current_SDNA_template.SDNA_NAMES = struct_names;
                        break;
                    }
                    offset2 += block_length;
                }
            }

            //parse the rest of the data, starting back at the top.

            //TODO: turn into "on-demand" parsing.

            while (true) {
                if ((offset % 4) > 0) {
                    offset = (4 - (offset % 4)) + offset;
                }

                data_offset = offset;
                sdna_index = data.getInt32(offset + pointer_size + 8, BIG_ENDIAN);
                let code_uint = data.getUint32(offset, BIG_ENDIAN);
                offset2 = offset + 16 + (pointer_size);
                offset += data.getInt32(offset + 4, true) + 16 + (pointer_size);

                if (code_uint === DNA1); //skip - already processed at this point    
                else if (code_uint === ENDB) break; //end of __blender_file__ found
                else {
                    //Create a Blender object using a constructor template from current_SDNA_template
                    var data_start = data_offset + pointer_size + 16;

                    //Get a SDNA constructor by name;
                    var constructor = current_SDNA_template.getSDNAStructureConstructor(current_SDNA_template.SDNA_NAMES[sdna_index]);

                    var size = data.getInt32(data_offset + 4, BIG_ENDIAN);

                    count = data.getInt32(data_offset + 12 + pointer_size, BIG_ENDIAN);

                    if (count > 0) {
                        var obj = new constructor();

                        var length = constructor.prototype._length;


                        var address = FILE.getPointer(data_offset + 8);

                        obj.address = address + "";

                        obj.setData(address, data_start, data_start + size, FILE);

                        if (count > 1) {
                            let array = [];
                            array.push(obj);
                            for (var u = 1; u < count; u++) {
                                obj = new constructor();
                                obj.setData(address, data_start + length * u, data_start + (length * u) + length, FILE);
                                array.push(obj);
                            }
                            FILE.memory_lookup[address] = array;
                        } else {
                            FILE.memory_lookup[address] = obj;
                        }
                    }
                }
            }
        }
    }
    return return_object;
});