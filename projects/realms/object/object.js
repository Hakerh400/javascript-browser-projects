'use strict';

const Transition = require('../transition');
const Pivot = require('../pivot');

const {
  Translation,
  Rotation,
} = Transition;

class Object{
  static layer = 0;
  static traits = O.obj();
  static listenersG = O.obj();
  static listenersL = O.obj();

  layer = this.constructor.layer;
  is = this.constructor.traits;
  listensG = this.constructor.listenersG;
  listensL = this.constructor.listenersL;

  transitions = [];

  constructor(tile){
    const {grid} = tile;

    this.grid = grid;
    this.tile = tile;

    tile.addObj(this);

    for(const type in this.listensG)
      grid.addGridEventListener(type, this);
  }

  static initTraits(arr=[]){
    return window.Object.assign(O.arr2obj(arr), this.traits);
  }

  static initListenersG(arr=[]){
    return window.Object.assign(O.arr2obj(arr), this.listensG);
  }

  static initListenersL(arr=[]){
    return window.Object.assign(O.arr2obj(arr), this.listensL);
  }

  draw(g, t, k){ O.virtual('draw'); }

  move(dir){
    const {tile} = this;
    const newTile = tile.adj(dir);

    tile.removeObj(this);
    newTile.addObj(this);
    this.tile = newTile;

    this.addTr(new Transition.Translation(tile, newTile));
  }

  addTr(transition){
    const {transitions} = this;

    transitions.push(transition);

    if(transitions.length === 1)
      this.grid.transitionsArr.push(transitions);
  }

  findPath(maxLen, func){
    const {tile} = this;

    const result = func(null, tile, []);

    if(result === 1) return [];
    if(result === -1 || maxLen === 0) return null;

    const visited = new Set([tile]);
    const queue = [[tile, []]];

    while(queue.length !== 0){
      const [tile, path] = queue.shift();
      const {adjsNum} = tile;

      const start = O.rand(adjsNum);
      let first = 1;

      for(let i = start;; ++i === adjsNum && (i = 0)){
        if(i === start){
          if(first) first = 0;
          else break;
        }

        const newTile = tile.adj(i);
        if(newTile === null) debugger;
        if(visited.has(newTile)) continue;

        const newPath = path.concat(i);
        const result = func(tile, newTile, newPath);

        if(result === 1) return newPath;
        if(result === -1 || newPath.length === maxLen) continue;

        visited.add(newTile);
        queue.push([newTile, newPath]);
      }
    }

    return null;
  }

  update(){
    this.tile.update();
  }

  remove(){
    const {grid, tile} = this;

    tile.removeObj(this);

    for(const type in this.listenersG)
      grid.removeGridEventListener(type, this);
  }
}

class Ground extends Object{
  static traits = this.initTraits(['ground']);
  static layer = 1;

  draw(g, t, k){
    g.fillStyle = '#08f';
    g.beginPath();
    this.tile.border(g);
    g.fill();
  }
}

class Player extends Object{
  static traits = this.initTraits(['occupying', 'entity']);
  static listenersG = this.initListenersG(['navigate']);
  static layer = 5;

  navigate(evt){
    const {dir} = evt;

    const tile = this.tile.adj(evt.dir);
    const {has} = tile;

    if(has.ground && !has.occupying){
      this.move(dir);
      return 1;
    }

    return 0;
  }

  draw(g, t, k){
    g.fillStyle = '#0f0';
    g.beginPath();
    g.arc(0, 0, .4, 0, O.pi2);
    g.stroke();
    g.fill();
  }
}

class NPC extends Object{
  static traits = this.initTraits(['occupying', 'entity']);
  static listenersG = this.initListenersG(['tick']);
  static layer = 5;

  constructor(tile){
    super(tile);

    this.tickBound = this.tick.bind(this);
  }

  tick(evt){
    const {tile} = this;

    while(1){
      const path = this.findPath(100, (prev, tile, path) => {
        if(path.length !== 0 && tile.has.occupying) return -1;
        if(tile.has.pickup) return 1;
        return 0;
      });

      if(path === null) return 0;

      if(path.length === 0){
        tile.get('pickup').collect();
        continue;
      }

      this.move(path[0]);
      break;
    }

    return 1;
  }

  draw(g, t, k){
    g.fillStyle = 'white';
    g.beginPath();
    g.arc(0, 0, .4, 0, O.pi2);
    g.stroke();
    g.fill();
  }
}

class Pickup extends Object{
  static traits = this.initTraits(['pickup']);
  static layer = 4;

  draw(g, t, k){
    g.fillStyle = 'yellow';
    g.beginPath();
    g.rect(-.25, -.25, .5, .5);
    g.stroke();
    g.fill();
  }

  collect(){
    const {tile} = this;

    while(1){
      const newTile = tile.grid.get(O.rand(-10, 10), O.rand(-10, 10));
      if(newTile.has.occupying || newTile.has.pickup) continue;

      tile.removeObj(this);
      newTile.addObj(this);
      this.tile = newTile;

      break;
    }
  }
}

class Wall extends Object{
  static traits = this.initTraits(['occupying', 'wall']);
  static layer = 6;

  draw(g, t, k){
    g.fillStyle = '#840';
    g.beginPath();
    this.tile.border(g);
    g.fill();
  }
}

Object.Ground = Ground;
Object.Player = Player;
Object.NPC = NPC;
Object.Pickup = Pickup;
Object.Wall = Wall;

module.exports = Object;