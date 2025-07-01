/** 69. x 的平方根
 * @param {number} x
 * @return {number}
 */
var mySqrt = function(x) {
    if (x == 0) return 0
    else {
        for (let i = 1; i <= x; i++) {
            if (i * i >= x) {
                if(i*i==x) return i
                if(i*i>x) return i-1
            }

        }
    }
};
console.log(mySqrt(4)) //2
console.log(mySqrt(8)) //2
console.log(Math.sqrt(2**53)) //1