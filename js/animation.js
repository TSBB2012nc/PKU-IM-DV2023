// switch language
// var button = document.getElementById('button');
// button.addEventListener('click', function () {
//     window.location.href = 'index-ch.html';
// });

// show sidebar
var sidebar = document.getElementById("sidebar");

document.addEventListener("mousemove", function (event) {
    if (event.clientX > window.innerWidth - 200 && event.clientY < window.innerHeight - 300) {
        sidebar.style.right = "0";
    } else {
        sidebar.style.right = "-300px";
    }
});



// radius
const blocks = document.querySelectorAll('.block');
blocks.forEach((svg, index) => {
    svg.style.animationDelay = `${index}s`;
    
});


function hoverBlock(index) {
    var blocks = document.getElementsByClassName("graph");
    
    // 添加活动样式
    blocks[index].classList.add("active");
    
    // 移除非活动样式
    for (var i = 0; i < blocks.length; i++) {
      if (i !== index) {
        blocks[i].classList.add("inactive");
        blocks[i].classList.remove("active");
      }
    }
    
    // 根据索引应用相应的移动样式
    if (index === 0) {
      blocks[index].classList.add("move-left");
      blocks[index+1].classList.add("move-center");
      blocks[index+2].classList.add("move-right");
    } else if (index === 1) {
      blocks[index-1].classList.add("move-left");
      blocks[index].classList.add("move-center");
      blocks[index+1].classList.add("move-right");
    } else if (index === 2) {
      blocks[index-2].classList.add("move-left");
      blocks[index-1].classList.add("move-center");
      blocks[index].classList.add("move-right");
    }
  }

function clearAnimation() {
    var blocks = document.querySelectorAll(".graph");
    blocks.forEach((elem) => {
        elem.classList = "graph"
    })
}

