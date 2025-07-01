/** 70. 爬楼梯
 * @param {number} n
 * @return {number}
 */
var climbStairs = function (n) {
    let count = 0
    let n=n
    var climb = function (n) {
        if(n!=1||n!=0)
        climb(n-1)
        climb(n-2)
        count++
            
    }
    return count

};

console.log(climbStairs(2)) //2
console.log(climbStairs(3)) //3
console.log(climbStairs(4)) //5