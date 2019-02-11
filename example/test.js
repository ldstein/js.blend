const fs             = require('fs');
const path           = require('path');
const parseBlendFile = require('../source/parser');

const blendFilePath        = path.join(__dirname, 'test.blend');
const blendFileBuffer      = fs.readFileSync(blendFilePath);
const blendFileArrayBuffer = blendFileBuffer.buffer;
const blendFileParsed      = parseBlendFile(blendFileArrayBuffer);

if (blendFileParsed.isBlendFile)
{
    Object.keys(blendFileParsed.objects).forEach(function(key)
    {
        const objectTypeName  = key.padEnd(25) + ':';
        const objectTypeCount = blendFileParsed.objects[key].length;

        console.log(objectTypeName, objectTypeCount);
    });
}
else
{
    console.error(blendFilePath + ' is not a valid Blender file');
}