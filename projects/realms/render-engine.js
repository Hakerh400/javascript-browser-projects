'use strict';

const Grid = require('./grid');
const Tile = require('./tile');
const Object = require('./object');
const Event = require('./event');

const TICK_DURATION = 100;

const {sign} = Math;

class RenderEngine{
  constructor(canvas, gridCtor){
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.grid = new gridCtor(this);

    this.cx = 0;
    this.cy = 0;
    this.curIn = 0;

    this.listeners = [];
    this.events = [];

    this.disposed = 0;
    this.aels();

    this.time = 0;
    this.animating = 0;
    this.tick = null;

    this.renderBound = this.render.bind(this);
    O.raf(this.renderBound);
  }

  aels(){
    const {canvas, grid, events, listeners} = this;

    this.ael(window, 'keydown', evt => {
      const {target} = grid;

      switch(evt.code){
        case 'ArrowUp':
          events.push(new Event.Navigate(0, target));
          break;

        case 'ArrowRight':
          events.push(new Event.Navigate(1, target));
          break;

        case 'ArrowDown':
          events.push(new Event.Navigate(2, target));
          break;

        case 'ArrowLeft':
          events.push(new Event.Navigate(3, target));
          break;

        case 'Enter':
          events.push(new Event('tick', target));
          break;
      }
    });

    this.ael(window, 'mousemove', evt => {
      this.updateCursor(evt);
    });

    this.ael(window, 'mousedown', evt => {
      this.updateCursor(evt);

      const btn = evt.button;
    });

    this.ael(window, 'wheel', evt => {
      this.updateCursor(evt);
      if(!this.curIn) return;

      const dir = sign(evt.deltaY);
      this.grid.zoom(dir);
    });

    this.ael(window, 'resize', evt => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    this.ael(window, 'contextmenu', evt => {
      O.pd(evt);
    });
  }

  ael(...args){
    this.listeners.push(args);
    O.ael(...args);
  }

  rels(){
    for(const args of this.listeners)
      O.rel(...args);
  }

  updateCursor(evt){
    const {left, top, width: w, height: h} = this.brect;
    const {clientX: x, clientY: y} = evt;

    if(x >= left && y >= top && x < left + w && y < top + h){
      this.cx = x - left;
      this.cy = y - top;
      this.curIn = 1;
    }else{
      this.curIn = 0;
    }
  }

  get brect(){
    return this.canvas.getBoundingClientRect();
  }

  render(){
    if(this.disposed) return;

    const {canvas, g, grid, events} = this;
    const t = O.now;
    let k = 0;

    main: {
      if(this.animating){
        const dt = t - this.time;
        k = dt / TICK_DURATION % 1;

        if(dt >= TICK_DURATION){
          this.animating = 0;
          grid.endAnimation();
        }
      }else{
        if(events.length === 0) break main;

        const evt = events.shift();
        this.tick = Symbol();

        if(evt.type === 'tick'){
          if(!grid.tick(evt))
            break main;
        }else{
          if(!grid.emitAndTick(evt))
            break main;
        }

        this.time = t;
        this.animating = 1;
      }
    }

    grid.draw(g, t, k);

    O.raf(this.renderBound);
  }

  dispose(){
    this.disposed = 1;
    this.rels();
  }
}

module.exports = RenderEngine;