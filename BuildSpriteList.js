'use strict';
const sizeOf = require('image-size');
const fs = require('fs');
const path = require('path');
const walk = require('walk');
const _ = require('underscore');

let args = require('yargs')
  .option('sprites', {
    alias: 's',
    describe: 'The directory from which to load sprites'
  })
  .option('output', {
    alias: 'o',
    describe: 'The output directory'
  })
  .help('help')
  .argv;

function buildSpriteList(spriteDir, outputDir, done) {
  spriteDir = spriteDir || args.sprites;
  outputDir = outputDir || args.output;

  if (spriteDir == undefined) throw 'Error. No sprite directory defined';
  if (outputDir == undefined) throw 'Error. No output directory defined';

  console.log('Generating sprite list for ' + spriteDir);

  let sprites = {};
  let prefix = spriteDir.indexOf('retina') !== -1 ? 'retina' : 'normal';

  let walker = walk.walk(spriteDir);
  walker.on('file', (root, fileStats, next) => fileHandler(sprites, root, fileStats, prefix, next));
  walker.on('end', () => endHandler(sprites, outputDir, prefix, done));
}

function generateCssClass(filePath, prefix) {
  let prefixToReplace = prefix === 'retina' ? 'image-retina-' : 'image-';
  let returnValue = '.coveo-' + filePath
    .replace(/\//g, '-')
    .replace(/\\/, '-')
    .replace(prefixToReplace, '')
    .replace('.png', '')
    .replace('.gif', '')
  return returnValue;
}

function fileHandler(sprites, root, fileStats, prefix, next) {
  let fullPath = path.join(root, fileStats.name);
  fs.readFile(fullPath, (err, imgBuffer) => {
    if (err) throw err;

    let cssClass = generateCssClass(fullPath, prefix);
    let imgSize = sizeOf(imgBuffer);
    sprites[cssClass] = {
      img: imgBuffer.toString('base64'),
      size: imgSize.width * imgSize.height,
      name: cssClass.substring(1)
    }
    next();
  })
}

function generateHtmlOutput(sprites) {
  let row = _.template(
    `<tr>
       <td><code><%= cssClass %></code></td>
       <td><img src="data:image/png;base64,<%= val.img %>" /></td>
     </tr>`
  );
  let header = '<!DOCTYPE html><html><table>';
  let style = '<style>td { border: 1px solid #ccc; } table { text-align: center; }</style>';
  let footer = '</table></html>';
  let rows = _.map(sprites, (val, cssClass) => row({ cssClass: cssClass, val: val })).join('');

  return header + style + rows + footer;
}

function endHandler(sprites, outputDir, prefix, done) {
  let outFilename = path.join(outputDir, prefix + '-icon-list');
  fs.writeFileSync(`${outFilename}.html`, generateHtmlOutput(sprites));
  fs.writeFileSync(`${outFilename}.json`, JSON.stringify(sprites, null, 2));
  console.log('Done. Have a good day !');
  if (done) done();
}

if (require.main === module) {
  buildSpriteList();
}

module.exports = buildSpriteList;
