# JS.BLEND
## The Blender file parser for JavaScript

This fork is a stripped down refactor of [js.blend](https://github.com/Galactrax/js.blend). Full credit goes to the [original author](https://github.com/galactrax). This started as an exercise to get the bare minimum code required to parse .blend files in NodeJS and browser.

JS.BLEND is a file parser that is designed to read unmodified Blender files and convert the binary data into JavaScript objects which can be used in JavaScript applications. It's designed with an easy to use interface to allow for quick integration with 3D apps, namely by using the ThreeJS library. It also allows for manual access to Blender `C` class and data structures that are converted into JavaScript objects.

## Usage - NodeJS

```javascript
const fs             = require('fs');
const path           = require('path');
const parseBlendFile = require('./source/parser');

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
```

### Raw Data

JS.BLEND works by turning the schemas, also known in Blender as SDNAs, in the .blend file into JavaScript prototype objects. It then creates new objects from these prototypes, one for every single data structure stored in the file. The actual data is left stored in an `ArrayBuffer` and `TypedArray` views and `DataViews` used to make the stuctured data available to the rest of JS. 

The compiled objects can be found by accessing `blend.file.objects`, which is used as a key/value lookup for all data structures from the file.  For example `blend.file.objects["Mesh"]` will return an array of all mesh objects stored in the file. 

Official documentation for Blender data structures is hard to come by, and there have been several changes to the data structures since version 1.0 of Blender. This means that accessing and using the raw data is a bit of a discovery process, and requires utilizing the Debugger to investigate the object prototypes to see what members they contain. 

#### Potential

Since the entire .blend file is made available through this script, every single resource that can be created in Blender and saved to file can be accessed and used in JavaScript. This means that, ultimataly, information such as animation data, bone hiearchies, and particle system setups can be saved in Blender and then immediatly extracted and used in Javascript and integrated into projects.

## License

This program is free to use and distribute under the MIT. 
