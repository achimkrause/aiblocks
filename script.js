const ai_worker = new Worker('./aiworker.js');
//const ai_worker = new Worker('./aiworker.js');
let ready=false;
ai_worker.onmessage = function(e){
  if(e.data == 'ready'){
    ready=true;
  }
  else{
    console.log(e.data)
    game.position.move(e.data);
    game.manual = true;
  }
}
ai_worker.onerror = function(e){
  console.error('error in web worker: ',e.message,e);
}

class Game{
  constructor(){
    this.position = new Position();
    this.colors = ['#4b4b4b','#e3e1a1'];
    this.gridsize = 80;
    this.offX = 0;
    this.offY = 0;
    this.movesize = 20;
    this.manual=true;
    let canvas = document.getElementById("canvas");
    canvas.addEventListener('click', (e) => this.click(e));
  }
  draw(){
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.translate(0,canvas.height);
    ctx.scale(1,-1);

    if(this.position.flipped){
      ctx.fillStyle=this.colors[1];
    }
    else{
      ctx.fillStyle=this.colors[0];
    }
    for(let i=0;i<11;i++){
      for(let j=0;j<9;j++){
        if(this.position.p0[i*9 + j]){
          ctx.fillRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, 2*this.gridsize, this.gridsize);
          ctx.strokeRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, 2*this.gridsize, this.gridsize);
        }
        else if(this.position.p0[11*9 + i*9 + j]){
          ctx.fillRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, this.gridsize, 2*this.gridsize);
          ctx.strokeRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, this.gridsize, 2*this.gridsize);
        }
      }
    }
    if(this.position.flipped){
      ctx.fillStyle=this.colors[0];
    }
    else{
      ctx.fillStyle=this.colors[1];
    }
    for(let i=0;i<11;i++){
      for(let j=0;j<9;j++){
        if(this.position.p1[i*9 + j]){
          ctx.fillRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, 2*this.gridsize, this.gridsize);
          ctx.strokeRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, 2*this.gridsize, this.gridsize);
        }
        else if(this.position.p1[11*9 + i*9 + j]){
          ctx.fillRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, this.gridsize, 2*this.gridsize);
          ctx.strokeRect(this.offX + i*this.gridsize, this.offY + j*this.gridsize, this.gridsize, 2*this.gridsize);
        }
      }
    }
    ctx.fillStyle='#c8c8c8';
    for(let n=0; n<this.position.valid_moves.length; n++){
      let move = this.position.valid_moves[n];
      let cornerX = this.offX + move.i*this.gridsize;
      let cornerY = this.offY + move.j*this.gridsize;
      let width = this.movesize;
      let height = this.movesize;
      if(move.h == 0){
        cornerX += this.gridsize - this.movesize;
        cornerY += (this.gridsize - this.movesize)/2;
        width = 2*this.movesize;
      }
      else{
        cornerX += (this.gridsize - this.movesize)/2;
        cornerY += this.gridsize - this.movesize;
        height = 2*this.movesize;
      }
      ctx.fillRect(cornerX,cornerY,width,height);
    }
    ctx.setTransform(1,0,0,1,0,0);
  }
  click(event){
    if(!this.manual){
      console.log('locked')
      return;
    }
    console.log('click')
    let canvas = document.getElementById("canvas");
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    y = canvas.height - y;
    for(let n=0; n<this.position.valid_moves.length; n++){
      let move = this.position.valid_moves[n];
      let cornerX = this.offX + move.i*this.gridsize;
      let cornerY = this.offY + move.j*this.gridsize;
      let width = this.movesize;
      let height = this.movesize;
      if(move.h == 0){
        cornerX += this.gridsize - this.movesize;
        cornerY += (this.gridsize - this.movesize)/2;
        width = 2*this.movesize;
      }
      else{
        cornerX += (this.gridsize - this.movesize)/2;
        cornerY += this.gridsize - this.movesize;
        height = 2*this.movesize;
      }
      if(cornerX <= x && x <= cornerX + width && cornerY <= y && y <= cornerY+height){
        this.position.move(move);
        this.manual=false;
        console.log('sending message')
        ai_worker.postMessage({position:this.position});
        break;
      }
    }
  }
}

let game;

function main(){
  console.log('page loaded');
  game=new Game();
  window.setInterval(()=>game.draw(),100);
}
window.addEventListener('load', main);
