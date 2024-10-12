importScripts('./position.js','https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js');
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

self.onmessage = function(e){
  let position = new Position()
  position.set(e.data.position);
  if(e.data.query == 'move'){
    ai_move(position,0.5).then((move)=> self.postMessage(move));
  }
  else if(e.data.query == 'hint'){
    ai_policy(position).then((policy)=> self.postMessage(policy));
  }
}


let model={
  init: async function(){
    this.session = await ort.InferenceSession.create('./model.onnx');
    console.log('Model loaded successfully!');
    this.ready = true;
  },
  eval: async function(position){
    if(!this.ready){
      console.log('Model not loaded yet!')
    }
    let input_x = new ort.Tensor('float32', position.p0, [2,11,9]);
    let input_y = new ort.Tensor('float32', position.p1, [2,11,9]);
    let inputs = { x: input_x, y: input_y };
    let results = await this.session.run(inputs);
    let value = results.value.data;
    let policy = [];
    let sum=0.0;
    for(let n=0; n<position.valid_moves.length; n++){
      move=position.valid_moves[n]
      let val = Math.exp(results.policy.data[move.h*11*9+move.i*9+move.j]);
      sum += val;  
      policy.push(val);
    }
    for(let i=0; i<policy.length; i++){
      policy[i]/=sum;
    }
    return {
      value:value,
      policy:policy
    }
  }
}

model.init();

const discovery_constant=1.4;

class MCTS{
  constructor(position){
    this.position=position;
    this.children=null;
  }
  async visit(){
    if(this.position.result != null){
      return(this.position.result);
    }
    if(this.children == null){
      let move_count = this.position.valid_moves.length;
      let out = await model.eval(this.position);
      let prior_value = out.value[0];
      this.policy = out.policy;
      this.values=[];
      this.visit_counts=[];
      this.children=[];
      this.total_visit_count=0;
      for(let n=0; n<move_count; n++){
        this.values.push(0);
        this.visit_counts.push(0);
        let new_pos = this.position.copy();
        new_pos.move(new_pos.valid_moves[n]);
        this.children.push(new MCTS(new_pos));
      }
      return prior_value;
    }
    else{
      let best_n=null;
      let best_appeal=null;
      for(let n=0; n<this.values.length; n++){
        let q = this.values[n] / (this.visit_counts[n] + 1);
        let u = discovery_constant * this.policy[n] * Math.sqrt(this.total_visit_count) / (this.visit_counts[n] + 1);
        let appeal = q+u;
        if(best_appeal == null || appeal > best_appeal){
          best_appeal=appeal;
          best_n=n;
        }
      }
      let v = await this.children[best_n].visit();
      v=-v;
      this.visit_counts[best_n] += 1;
      this.total_visit_count += 1;
      this.values[best_n] += v;
      return v;
    }
  }
  posterior_policy(){
    let result = [];
    for(let n=0; n<this.visit_counts.length; n++){
      result.push(this.visit_counts[n] / this.total_visit_count);
    }
    return result;
  }
}

async function ai_policy(position){
  let mcts = new MCTS(position.copy());
  for(let n=0; n<500; n++){
    await mcts.visit();
  }
  let policy = mcts.posterior_policy();
  return policy; 
}

async function ai_move(position,temperature){
  let policy = await ai_policy(position);
  let best_n=null;
  let best_pol=null;
  for(let n=0; n<policy.length; n++){
    if(best_pol == null || policy[n] > best_pol){
      best_pol = policy[n];
      best_n=n;
    }
  }
  let move;
  if(temperature<=0.01){
    move = position.valid_moves[best_n];
  }
  else{
    let sum = 0;
    for(let n=0; n<policy.length; n++){
      policy[n] = Math.pow(policy[n] / best_pol, 1/temperature);
      sum += policy[n];
    }
    let val = sum * Math.random();
    let index=policy.length-1;
    for(let n=0; n<policy.length; n++){
      val -= policy[n];
      if(val < 0){
        index=n;
        break;
      }
    }
    move = position.valid_moves[index];
  }
  let movestr = ["H","V"][move.h] + (move.i - position.min_i) + move.j;
  console.log(movestr);
  return move;
}
