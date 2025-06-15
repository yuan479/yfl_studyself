/* function f1(a) {
    var b = 2;
    f2();
    function f2() {
        var c = 3;
        console.log(a + b + c); // 输出 6 (1 + 2 + 3)
    }
}
var a = 1;
f1(a); */

/* function f1() {
    var x = 10;
    function f2() {
        console.log(x); // 输出 10
    }
    f2();
}
f1(); */

/* function f1() {
    var x = 10; // 定义于 f1 函数作用域
    f2(); // 调用外部定义的 f2 函数
}

function f2() {
    console.log(x); // 报错: x is not defined
}
f1();  */

/* function f1() {
    var a = 1; // 函数作用域
    if (true) {
        var b = 2; // 实际上也是函数作用域
    }
    console.log(a); // 1
    console.log(b); // 2（尽管在 if 块中定义，但作用域是函数）
}
f1();
console.log(a); // 报错：a is not defined
console.log(b); // 报错：b is not defined */

/* {
    let x = 10; // 块级作用域
    const y = 20; // 块级作用域
    var z = 30; // 函数作用域（如果在函数内部）或全局作用域
}

console.log(z); // 30（如果在全局作用域中）
console.log(x); // 报错：x is not defined
console.log(y); // 报错：y is not defined */

/* for (var i = 0; i < 3; i++) {
    setTimeout(function() {
        console.log(i); // 输出 3, 3, 3
    }, 1000);
} */

/* for (let i = 0; i < 3; i++) {
    setTimeout(function () {
        console.log(i); // 输出 0, 1, 2
    }, 1000);
}    */

    function f1() {
        let count = 0;
        return function() {
            count++;
            return count;
        };
    }
    const f2 = f1();
    console.log(f2()); // 1
    console.log(f2()); // 2