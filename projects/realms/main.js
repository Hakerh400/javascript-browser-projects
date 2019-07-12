'use strict';

const RenderEngine = require('./render-engine');
const Realm = require('./realm');
const WorldGenerator = require('./world-generator');
const PredicateSet = require('./predicate-set');
const Event = require('./event');
const Transition = require('./transition');
const LayerPool = require('./layer-pool');
const Grid = require('./grid');
const Tile = require('./tile');
const Object = require('./object');
const realmsList = require('./realms-list');
const realms = require('./realms');

main();

function main(){
  O.body.style.margin = '0px';
  O.body.style.overflow = 'hidden';

  const canvas = O.ce(O.body, 'canvas');
  canvas.width = O.iw;
  canvas.height = O.ih;

  const reng = new RenderEngine(canvas, [Grid.SquareGrid, Grid.HexagonalGrid][0]);
  const {grid} = reng;

  const realm = new realms['sokoban'](grid);
  const cs = new realms.sokoban(grid).ctors;

  const pset = new PredicateSet(tile => {
    const {x, y} = tile;

    return 1;
  });

  const start = grid.get(0, 0);
  const generator = realm.createGenerator(start, pset);
  generator.gen(start);

  let generating = 0;

  grid.on('gen', tile => {
    if(pset.has(tile)){
      if(generating) return;

      generating = 1;
      generator.gen(tile);
      generating = 0;

      return;
    }
  });
}