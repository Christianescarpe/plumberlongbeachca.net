(function () {
  var menu = document.querySelector(".mobile-nav");
  if (!menu) return;
  menu.addEventListener("keydown", function (event) {
    if (event.key === "Escape") menu.open = false;
  });
  menu.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (link) menu.open = false;
  });
})();
