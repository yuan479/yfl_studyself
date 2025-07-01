/** 二进制求和
 * @param {string} a
 * @param {string} b
 * @return {string}
 */
var addBinary = function(a, b) {
    let numa = 0
    let numb = 0
    let a1 =  [...a]
    let b1 =  [...b]
   for(let i = 0;i<a1.length ;i++){
  
    numa = a1[i]*(2**(a1.length-i-1)) + numa
   }
   for(let i = 0;i<b1.length ;i++){
   
    numb = b1[i]*(2**(b1.length-i-1)) + numb
   }
    return (numa+numb).toString(2)
};

console.log(addBinary("11","1")) //"100"
console.log(addBinary("1010","1011")) //"10101"