(function () {
  var menu = document.querySelector(".mobile-nav");
  if (menu) {
    menu.addEventListener("keydown", function (event) {
      if (event.key === "Escape") menu.open = false;
    });
    menu.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (link) menu.open = false;
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.activeElement) {
      var inDropdown = document.activeElement.closest(".nav-item.has-dropdown");
      if (inDropdown) document.activeElement.blur();
    }
  });
})();
