# LHS 和 RHS
  ## 定义：
    LHS 和 RHS 是 JavaScript 中用于赋值操作的两个概念。
    “当变量出现在赋值操作的左侧时进行LHS查询，出现在右侧时进行RHS查询。”
  ## 思考：
    LHS : 赋值操作的左侧（Left-hand side） 赋值操作的目标是谁？
    RHS : 赋值操作的右侧（Right-hand side）谁是赋值操作的源头？

    var a = 2;
    LHS 查询到的是变量a，RHS 查询到的是2。

    LHS 查询试图找到变量的容器本身，主要涉及到变量的存储和初始化。
    RHS 查询是简单地查找某个变量的值，获取变量的值并进行传递。
  ## 案例：
   1. 
   function foo(a) {
      console.log(a); //  RHS 查询，查找变量a的值并进行传递。
    }
    foo (2); // RHS 查询，查找函数foo的值并进行传递。
    注：这里还有一个隐式的赋值操作，即函数foo的参数a被赋值为2，即：a = 2; 为LHS查询。
作用域嵌套
   2. 
   function foo (a){
    var b = a;
    return a + b;
   }
   var c = foo(2);
   
   LHS 查询有：
    var c =...
    var b =...
    a = 2 (隐式赋值操作)
    RHS 查询：
    foo(2)
    ... = a
    return a ...
    ... + b

  3. 
    let a = 10;
    function foo1() {
        let b = 20;
        function foo2() {
            let c = 30;
            console.log(a + b + c);
        }
        foo2();
        console.log(b);
    }
    foo1();
    console.log(a);

    LHS查询有：
    let a = 10
    let b = 20
    let c = 30
    RHS查询有：
    console.log(a... 
    ... + b
    ... + c)
    console.log(b)
    console.log(a)
