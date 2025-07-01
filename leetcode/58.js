/** 58. 最后一个单词的长度
 * @param {string} s
 * @return {number}
 */
var lengthOfLastWord = function (s) {
    let l = s.length
    let str = ''
    let num = 0
    for (let i = l - 1; i >= 0; i--) {
        if (s[i] != " ") {
            str = str + s[i]
            num = num + 1
        }
        else {
            if (str.length != 0) break;
        }
    }
    return num
};

console.log(lengthOfLastWord("   fly me   to   the moon  "))
console.log(lengthOfLastWord("luffy is still joyboy"))
console.log(lengthOfLastWord("Hello World"))