/* ES6 feature detection. Source: github.com/bevacqua/sixflix */
try {
  eval('class ಠ_ಠ extends Array{constructor(j=`a`,...c){const q=(({u: e})=>{return {[`${c}`]:Symbol(j)};})({});super(j,q,...c)}}new Promise(f=>{const a=function*(){return "\\u{20BB7}".match(/./u)[0].length===2||!0};for (let z of a()){const [x,y,w,k]=[new Set(),new WeakSet(),new Map(), new WeakMap()];break}f(new Proxy({},{get:(h,i) =>i in h ?h[i]:"j".repeat(0o2)}))}).then(t => new ಠ_ಠ(t.d))');
  document.write('<script async src="scripts/core.min.js"></scr'+'ipt>');
} catch(e) {
  document.write('<script src="scripts/polyfill.min.js"></scr'+'ipt>');
  document.write('<script src="scripts/core-old-browsers.min.js"></scr'+'ipt>');
}
