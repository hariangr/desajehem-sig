let showSidebar = true;

function toggleHamburger(to) {
  const _sidebar = document.getElementById("sidebarx");
  const _menuIcon = document.getElementById("hamburgerMenu");

  if (to) {
    _sidebar.classList.remove("hideLoading");
    _menuIcon.classList.add("opened");
  } else {
    _sidebar.classList.add("hideLoading");
    _menuIcon.classList.remove("opened");
  }

  showSidebar = to;
}
function onHamburgerClicked() {
  showSidebar = !showSidebar;
  toggleHamburger(showSidebar);
}
window.addEventListener("load", function () {
  function myFunction(x) {
    if (x.matches) {
      // Mobile
      toggleHamburger(false);
    } else {
      toggleHamburger(true);
    }
  }
  var x = window.matchMedia("(max-width: 700px)");
  myFunction(x); // Call listener function at run time
});
