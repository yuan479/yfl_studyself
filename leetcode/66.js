/** 66. 加一

 * @param {number[]} digits
 * @return {number[]}
 */
var plusOne = function(digits) {
    let num2 = BigInt( digits.join(''))+ BigInt(1)
    let str2=String(num2)
   return [...str2]
 };
console.log(typeof(plusOne([1,2,3])))
 console.log(plusOne([1,2,3])) //[1,2,4]
 console.log(plusOne([4,3,2,1])) //[4,3,2,2]
 console.log(plusOne([9])) //[1,0]